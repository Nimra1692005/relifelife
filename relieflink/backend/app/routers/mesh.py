"""
ReliefLink — Mesh Network Signaling Router

WebSocket-based signaling server for WebRTC peer-to-peer mesh networking.
When internet is available, peers connect via WebRTC using this server for signaling.
Once connected, all communication is direct (no server relay).

Rooms are geographic zones — peers in the same zone can communicate.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio
from datetime import datetime

router = APIRouter()

# ── Connection Manager ──────────────────────────────────────

class MeshManager:
    def __init__(self):
        # zone_id -> set of websockets
        self.zones: Dict[str, Set[WebSocket]] = {}
        # websocket -> peer info
        self.peers: Dict[WebSocket, dict] = {}

    async def connect(self, ws: WebSocket, zone: str, peer_id: str, name: str):
        await ws.accept()
        if zone not in self.zones:
            self.zones[zone] = set()
        self.zones[zone].add(ws)
        self.peers[ws] = {
            "peer_id": peer_id,
            "name": name,
            "zone": zone,
            "joined": datetime.utcnow().isoformat(),
        }
        # Notify others in zone
        await self.broadcast_zone(zone, {
            "type": "peer_joined",
            "peer_id": peer_id,
            "name": name,
            "peers_in_zone": len(self.zones[zone]),
        }, exclude=ws)

    def disconnect(self, ws: WebSocket):
        info = self.peers.get(ws, {})
        zone = info.get("zone")
        peer_id = info.get("peer_id")
        if zone and zone in self.zones:
            self.zones[zone].discard(ws)
            if not self.zones[zone]:
                del self.zones[zone]
        if ws in self.peers:
            del self.peers[ws]
        return zone, peer_id

    async def broadcast_zone(self, zone: str, message: dict, exclude: WebSocket = None):
        if zone not in self.zones:
            return
        dead = set()
        for ws in self.zones[zone]:
            if ws == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.zones[zone].discard(ws)

    async def send_to_peer(self, zone: str, target_id: str, message: dict):
        if zone not in self.zones:
            return
        for ws, info in self.peers.items():
            if info.get("peer_id") == target_id and info.get("zone") == zone:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass
                return

    def get_zone_peers(self, zone: str) -> list:
        if zone not in self.zones:
            return []
        return [
            self.peers[ws]
            for ws in self.zones[zone]
            if ws in self.peers
        ]


manager = MeshManager()


# ── WebSocket Endpoint ──────────────────────────────────────

@router.websocket("/ws/{zone}/{peer_id}")
async def mesh_websocket(ws: WebSocket, zone: str, peer_id: str, name: str = "Anonymous"):
    """
    WebSocket endpoint for mesh network signaling.
    
    Messages types:
      send: client → broadcast a message to all peers in zone
      signal: client → WebRTC signaling (offer/answer/ICE) to specific peer
      list: client → get list of peers in zone
      ping: client → keepalive
    """
    await manager.connect(ws, zone, peer_id, name)

    # Send current peers list to new joiner
    await ws.send_json({
        "type": "welcome",
        "peer_id": peer_id,
        "zone": zone,
        "peers": manager.get_zone_peers(zone),
    })

    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "send":
                # Broadcast text message to all peers in zone
                await manager.broadcast_zone(zone, {
                    "type": "message",
                    "from_id": peer_id,
                    "from_name": name,
                    "text": data.get("text", ""),
                    "timestamp": datetime.utcnow().isoformat(),
                    "emergency": data.get("emergency", False),
                }, exclude=ws)

            elif msg_type == "signal":
                # WebRTC signaling — forward to target peer
                await manager.send_to_peer(zone, data.get("target"), {
                    "type": "signal",
                    "from_id": peer_id,
                    "signal": data.get("signal"),
                })

            elif msg_type == "list":
                await ws.send_json({
                    "type": "peers",
                    "peers": manager.get_zone_peers(zone),
                })

            elif msg_type == "ping":
                await ws.send_json({"type": "pong"})

            elif msg_type == "location":
                # Share location with zone (for emergency)
                await manager.broadcast_zone(zone, {
                    "type": "location",
                    "from_id": peer_id,
                    "from_name": name,
                    "lat": data.get("lat"),
                    "lon": data.get("lon"),
                    "address": data.get("address", ""),
                    "timestamp": datetime.utcnow().isoformat(),
                }, exclude=ws)

    except WebSocketDisconnect:
        zone_left, left_id = manager.disconnect(ws)
        if zone_left:
            await manager.broadcast_zone(zone_left, {
                "type": "peer_left",
                "peer_id": left_id,
                "peers_in_zone": len(manager.zones.get(zone_left, set())),
            })
    except Exception as e:
        manager.disconnect(ws)


# ── REST endpoints ──────────────────────────────────────────

@router.get("/zones")
async def list_zones():
    """List active mesh zones and peer counts."""
    return {
        "zones": {
            zone: {
                "peer_count": len(ws_set),
                "peers": manager.get_zone_peers(zone),
            }
            for zone, ws_set in manager.zones.items()
        }
    }


@router.get("/zones/{zone}/peers")
async def zone_peers(zone: str):
    """List peers in a specific zone."""
    return {
        "zone": zone,
        "peers": manager.get_zone_peers(zone),
        "count": len(manager.get_zone_peers(zone)),
    }
