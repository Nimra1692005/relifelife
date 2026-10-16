"""
ReliefLink — Mesh Network (real-time zone relay)

WebSocket rooms ("zones"). Everyone in a zone receives messages instantly.
Features: message history for late joiners, delivery acks, live GPS positions
(so clients can show who is within ~1 km), keep-alive, duplicate-peer handling.

NOTE: this is internet-based relay. True offline 1 km links need LoRa radios
(e.g. Meshtastic); browsers cannot do Bluetooth mesh.
"""

import re
import uuid
from collections import deque
from datetime import datetime
from typing import Deque, Dict, Optional, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

MAX_TEXT = 1000
HISTORY = 50


def _clean(s: str, n: int, default: str) -> str:
    s = re.sub(r"[^\w\- ]", "", (s or "").strip(), flags=re.UNICODE)[:n].strip()
    return s or default


def _num(v) -> Optional[float]:
    try:
        f = float(v)
        return f if f == f and abs(f) <= 180 else None
    except (TypeError, ValueError):
        return None


class MeshManager:
    def __init__(self):
        self.zones: Dict[str, Set[WebSocket]] = {}
        self.peers: Dict[WebSocket, dict] = {}
        self.history: Dict[str, Deque[dict]] = {}

    async def connect(self, ws: WebSocket, zone: str, peer_id: str, name: str):
        await ws.accept()
        # same peer reconnecting (e.g. after Wi-Fi drop): drop the stale socket
        for old, info in list(self.peers.items()):
            if info["peer_id"] == peer_id and info["zone"] == zone:
                self.disconnect(old)
                try:
                    await old.close()
                except Exception:
                    pass
        self.zones.setdefault(zone, set()).add(ws)
        self.peers[ws] = {
            "peer_id": peer_id, "name": name, "zone": zone,
            "joined": datetime.utcnow().isoformat(), "lat": None, "lon": None,
        }
        await self.broadcast_zone(zone, {
            "type": "peer_joined", "peer_id": peer_id, "name": name,
            "peers_in_zone": len(self.zones[zone]),
        }, exclude=ws)

    def disconnect(self, ws: WebSocket):
        info = self.peers.pop(ws, {})
        zone, peer_id, name = info.get("zone"), info.get("peer_id"), info.get("name")
        if zone and zone in self.zones:
            self.zones[zone].discard(ws)
            if not self.zones[zone]:
                del self.zones[zone]
        return zone, peer_id, name

    def remember(self, zone: str, msg: dict):
        self.history.setdefault(zone, deque(maxlen=HISTORY)).append(msg)

    async def broadcast_zone(self, zone: str, message: dict, exclude: Optional[WebSocket] = None):
        for ws in list(self.zones.get(zone, ())):
            if ws is exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(ws)

    async def send_to_peer(self, zone: str, target_id: str, message: dict):
        for ws, info in list(self.peers.items()):
            if info["peer_id"] == target_id and info["zone"] == zone:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass
                return

    def get_zone_peers(self, zone: str) -> list:
        return [self.peers[ws] for ws in self.zones.get(zone, ()) if ws in self.peers]


manager = MeshManager()


@router.websocket("/ws/{zone}/{peer_id}")
async def mesh_websocket(ws: WebSocket, zone: str, peer_id: str, name: str = "Anonymous"):
    """
    Client → server:  send {text, emergency?, cid?} | location {lat, lon, accuracy?}
                      signal {target, signal} | list | ping
    Server → client:  welcome {peers, history} | message | location | ack {cid, id}
                      peer_joined | peer_left | peers | pong
    """
    zone = _clean(zone, 40, "General")
    peer_id = _clean(peer_id, 40, "peer_" + uuid.uuid4().hex[:6])
    name = _clean(name, 30, "Anonymous")

    await manager.connect(ws, zone, peer_id, name)
    await ws.send_json({
        "type": "welcome", "peer_id": peer_id, "zone": zone,
        "peers": manager.get_zone_peers(zone),
        "history": list(manager.history.get(zone, [])),
    })

    try:
        while True:
            data = await ws.receive_json()
            t = data.get("type")

            if t == "send":
                text = str(data.get("text", ""))[:MAX_TEXT].strip()
                if not text:
                    continue
                msg = {
                    "type": "message", "id": uuid.uuid4().hex[:10],
                    "from_id": peer_id, "from_name": name, "text": text,
                    "emergency": bool(data.get("emergency", False)),
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }
                manager.remember(zone, msg)
                await manager.broadcast_zone(zone, msg, exclude=ws)
                await ws.send_json({"type": "ack", "cid": data.get("cid"), "id": msg["id"],
                                    "delivered_to": max(len(manager.zones.get(zone, ())) - 1, 0)})

            elif t == "location":
                lat, lon = _num(data.get("lat")), _num(data.get("lon"))
                if lat is None or lon is None:
                    continue
                manager.peers[ws]["lat"], manager.peers[ws]["lon"] = lat, lon
                await manager.broadcast_zone(zone, {
                    "type": "location", "from_id": peer_id, "from_name": name,
                    "lat": lat, "lon": lon, "accuracy": _num(data.get("accuracy")),
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }, exclude=ws)

            elif t == "signal":
                await manager.send_to_peer(zone, data.get("target"), {
                    "type": "signal", "from_id": peer_id, "signal": data.get("signal")})

            elif t == "list":
                await ws.send_json({"type": "peers", "peers": manager.get_zone_peers(zone)})

            elif t == "ping":
                await ws.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        z, pid, nm = manager.disconnect(ws)
        if z and pid:
            await manager.broadcast_zone(z, {
                "type": "peer_left", "peer_id": pid, "name": nm,
                "peers_in_zone": len(manager.zones.get(z, ())),
            })


# ── REST ───────────────────────────────────────────────────

@router.get("/zones")
async def list_zones():
    return {"zones": {z: {"peer_count": len(s), "peers": manager.get_zone_peers(z)}
                      for z, s in manager.zones.items()}}


@router.get("/zones/{zone}/peers")
async def zone_peers(zone: str):
    peers = manager.get_zone_peers(zone)
    return {"zone": zone, "peers": peers, "count": len(peers)}
