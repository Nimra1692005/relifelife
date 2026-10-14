"""
ReliefLink — Location Service (OpenStreetMap / Overpass API)

Finds nearby hospitals, shelters, pharmacies, fire stations using OpenStreetMap data.
100% FREE — No API key required, no credit card needed.

Uses Overpass API: https://overpass-api.de/
Data source: OpenStreetMap (open data, community maintained)
"""

import httpx
from typing import List, Dict, Any, Optional
from math import radians, sin, cos, sqrt, atan2

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# OSM tags for emergency facilities
FACILITY_QUERIES = {
    "hospitals": """
        [out:json][timeout:25];
        (
            node["amenity"="hospital"](around:{radius},{lat},{lon});
            way["amenity"="hospital"](around:{radius},{lat},{lon});
            node["amenity"="clinic"](around:{radius},{lat},{lon});
            way["amenity"="clinic"](around:{radius},{lat},{lon});
        );
        out center body;
    """,
    "shelters": """
        [out:json][timeout:25];
        (
            node["amenity"="shelter"](around:{radius},{lat},{lon});
            way["amenity"="shelter"](around:{radius},{lat},{lon});
            node["emergency"="shelter"](around:{radius},{lat},{lon});
            way["emergency"="shelter"](around:{radius},{lat},{lon});
            node["tourism"="camp_site"](around:{radius},{lat},{lon});
            way["tourism"="camp_site"](around:{radius},{lat},{lon});
        );
        out center body;
    """,
    "pharmacies": """
        [out:json][timeout:25];
        (
            node["amenity"="pharmacy"](around:{radius},{lat},{lon});
            way["amenity"="pharmacy"](around:{radius},{lat},{lon});
        );
        out center body;
    """,
    "fire_stations": """
        [out:json][timeout:25];
        (
            node["amenity"="fire_station"](around:{radius},{lat},{lon});
            way["amenity"="fire_station"](around:{radius},{lat},{lon});
        );
        out center body;
    """,
    "police": """
        [out:json][timeout:25];
        (
            node["amenity"="police"](around:{radius},{lat},{lon});
            way["amenity"="police"](around:{radius},{lat},{lon});
        );
        out center body;
    """,
    "schools": """
        [out:json][timeout:25];
        (
            node["amenity"="school"](around:{radius},{lat},{lon});
            way["amenity"="school"](around:{radius},{lat},{lon});
            node["amenity"="community_centre"](around:{radius},{lat},{lon});
            way["amenity"="community_centre"](around:{radius},{lat},{lon});
        );
        out center body;
    """,
}


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km."""
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def _parse_osm_element(element: Dict, user_lat: float, user_lon: float) -> Optional[Dict[str, Any]]:
    """Parse an OSM element into a clean facility object."""
    tags = element.get("tags", {})

    # Get coordinates (node has lat/lon, way has center)
    if element["type"] == "node":
        lat = element.get("lat")
        lon = element.get("lon")
    else:
        center = element.get("center", {})
        lat = center.get("lat")
        lon = center.get("lon")

    if not lat or not lon:
        return None

    # Build name
    name = tags.get("name", "")
    if not name:
        amenity = tags.get("amenity", tags.get("emergency", tags.get("tourism", "")))
        name = amenity.replace("_", " ").title() if amenity else "Unnamed Facility"

    # Phone
    phone = tags.get("phone", tags.get("contact:phone", ""))

    # Address
    addr_street = tags.get("addr:street", "")
    addr_city = tags.get("addr:city", tags.get("addr:suburb", ""))
    address = f"{addr_street}, {addr_city}".strip(", ") if addr_street or addr_city else ""

    # Website
    website = tags.get("website", tags.get("contact:website", ""))

    # Opening hours
    opening_hours = tags.get("opening_hours", "")

    # Emergency capability
    emergency = tags.get("emergency", "")
    beds = tags.get("beds", tags.get("capacity", ""))

    # Calculate distance
    distance = _haversine(user_lat, user_lon, lat, lon)

    # Operating status
    is_24h = "24/7" in opening_hours if opening_hours else False

    return {
        "id": f"osm-{element['type']}-{element['id']}",
        "name": name,
        "type": tags.get("amenity", tags.get("emergency", tags.get("tourism", "unknown"))),
        "lat": lat,
        "lng": lon,
        "distance_km": round(distance, 2),
        "address": address,
        "phone": phone,
        "website": website,
        "opening_hours": opening_hours,
        "is_24h": is_24h,
        "beds": beds,
        "emergency": emergency == "yes",
        "source": "OpenStreetMap",
        "osm_id": element["id"],
    }


class LocationService:
    """
    Finds nearby emergency facilities using OpenStreetMap (100% free, no API key).
    """

    async def find_nearby(
        self,
        lat: float,
        lon: float,
        facility_type: str = "hospitals",
        radius_m: int = 5000,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Find nearby facilities of a specific type.

        Args:
            lat: User latitude
            lon: User longitude
            facility_type: hospitals | shelters | pharmacies | fire_stations | police | schools
            radius_m: Search radius in meters (default 5km)
            limit: Max results to return
        """
        query_template = FACILITY_QUERIES.get(facility_type)
        if not query_template:
            return {
                "error": f"Unknown facility type: {facility_type}",
                "available_types": list(FACILITY_QUERIES.keys()),
                "facilities": [],
            }

        query = query_template.format(radius=radius_m, lat=lat, lon=lon)

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    OVERPASS_URL,
                    data={"data": query},
                    timeout=30.0,
                    headers={"User-Agent": "ReliefLink/1.0 (Disaster Response Platform)"},
                )
                resp.raise_for_status()
                data = resp.json()

            elements = data.get("elements", [])
            facilities = []

            for element in elements:
                parsed = _parse_osm_element(element, lat, lon)
                if parsed:
                    facilities.append(parsed)

            # Sort by distance
            facilities.sort(key=lambda f: f["distance_km"])

            # Limit results
            facilities = facilities[:limit]

            return {
                "type": facility_type,
                "search_lat": lat,
                "search_lon": lon,
                "radius_m": radius_m,
                "count": len(facilities),
                "facilities": facilities,
                "source": "OpenStreetMap (Overpass API)",
            }

        except httpx.TimeoutException:
            return {
                "type": facility_type,
                "error": "Request timed out. Try a smaller search radius.",
                "facilities": [],
                "source": "OpenStreetMap (Overpass API)",
            }
        except httpx.HTTPStatusError as e:
            return {
                "type": facility_type,
                "error": f"API error: {e.response.status_code}",
                "facilities": [],
                "source": "OpenStreetMap (Overpass API)",
            }
        except Exception as e:
            return {
                "type": facility_type,
                "error": str(e),
                "facilities": [],
                "source": "OpenStreetMap (Overpass API)",
            }

    async def find_all_nearby(
        self,
        lat: float,
        lon: float,
        radius_m: int = 5000,
    ) -> Dict[str, Any]:
        """Find all types of emergency facilities nearby."""
        results = {}

        for facility_type in ["hospitals", "shelters", "pharmacies", "fire_stations"]:
            result = await self.find_nearby(lat, lon, facility_type, radius_m, limit=10)
            results[facility_type] = {
                "count": result.get("count", 0),
                "facilities": result.get("facilities", []),
                "error": result.get("error"),
            }

        # Calculate totals
        total = sum(r["count"] for r in results.values())

        # Find closest of each type
        closest = {}
        for ftype, data in results.items():
            if data["facilities"]:
                closest[ftype] = {
                    "name": data["facilities"][0]["name"],
                    "distance_km": data["facilities"][0]["distance_km"],
                    "lat": data["facilities"][0]["lat"],
                    "lng": data["facilities"][0]["lng"],
                }

        return {
            "search_lat": lat,
            "search_lon": lon,
            "radius_m": radius_m,
            "total_facilities": total,
            "facilities_by_type": results,
            "closest": closest,
            "source": "OpenStreetMap (Overpass API) — 100% free, no API key required",
        }

    async def get_safe_places(
        self,
        lat: float,
        lon: float,
        radius_m: int = 3000,
    ) -> Dict[str, Any]:
        """Get all safe places (shelters + schools + community centers) nearby."""
        result = await self.find_nearby(lat, lon, "shelters", radius_m, limit=15)
        schools = await self.find_nearby(lat, lon, "schools", radius_m, limit=10)

        all_places = result.get("facilities", []) + schools.get("facilities", [])
        all_places.sort(key=lambda f: f["distance_km"])

        return {
            "search_lat": lat,
            "search_lon": lon,
            "radius_m": radius_m,
            "count": len(all_places),
            "safe_places": all_places[:15],
            "source": "OpenStreetMap (Overpass API)",
        }

    # ─── Overview stats (used by /analytics) ───────────────

    async def get_overview_stats(self) -> Dict[str, Any]:
        """Aggregate counts for the admin dashboard."""
        from app.database import db
        teams = await db.table_select("rescue_teams", limit=1000)
        shelters = await db.table_select("shelters", limit=1000)
        volunteers = await db.table_select("volunteers", limit=1000)
        capacity = sum(int(x.get("capacity") or 0) for x in shelters)
        occupied = sum(int(x.get("current_occupancy") or 0) for x in shelters)
        return {
            "teams_total": len(teams),
            "teams_available": len([t for t in teams if t.get("status") == "available"]),
            "teams_deployed": len([t for t in teams if t.get("status") == "deployed"]),
            "shelters_active": len([x for x in shelters if x.get("status") == "active"]),
            "shelter_capacity": capacity,
            "shelter_occupancy": occupied,
            "volunteers_total": len(volunteers),
            "volunteers_available": len([v for v in volunteers if v.get("availability") == "available"]),
        }

    # ─── Volunteers ────────────────────────────────────────

    async def list_volunteers(self) -> Dict[str, Any]:
        """List all registered volunteers from database."""
        from app.database import db
        volunteers = await db.table_select("volunteers", limit=100, order_by="-registered_at")
        return {
            "success": True,
            "data": volunteers,
            "count": len(volunteers),
            "available": len([v for v in volunteers if v.get("availability") == "available"]),
            "deployed": len([v for v in volunteers if v.get("availability") == "deployed"]),
        }

    async def register_volunteer(self, data: dict) -> Dict[str, Any]:
        """Register a new volunteer."""
        from app.database import db
        import uuid
        from datetime import datetime, timezone
        vol_id = f"vol-{uuid.uuid4().hex[:6]}"
        row = {
            "id": vol_id,
            "user_id": data.get("user_id", f"user-{uuid.uuid4().hex[:6]}"),
            "full_name": data.get("full_name", "Unknown"),
            "phone": data.get("phone", ""),
            "email": data.get("email"),
            "skills": data.get("skills", []),
            "availability": data.get("availability", "available"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "verified": False,
            "registered_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.table_insert("volunteers", row)
        return {"success": True, "data": row, "message": "Volunteer registered successfully"}

    async def list_shelters(self) -> Dict[str, Any]:
        """List all shelters with remaining capacity."""
        from app.database import db
        rows = await db.table_select("shelters", limit=100)
        rows = [r for r in rows if r.get("type") != "hospital"]
        for r in rows:
            r["available_spots"] = max((r.get("capacity") or 0) - (r.get("current_occupancy") or 0), 0)
        return {"success": True, "data": rows, "count": len(rows)}

    async def create_shelter(self, data: dict) -> Dict[str, Any]:
        """Create a new shelter."""
        from app.database import db
        import uuid
        from datetime import datetime, timezone
        row = {
            "id": f"shl-{uuid.uuid4().hex[:6]}",
            "name": data["name"],
            "type": data.get("type", "shelter"),
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "address": data.get("address"),
            "capacity": data.get("capacity", 100),
            "current_occupancy": 0,
            "facilities": data.get("facilities") or [],
            "status": "active",
            "contact_phone": data.get("phone"),
            "verified": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.table_insert("shelters", row)
        return {"success": True, "data": row, "message": "Shelter created successfully"}
    async def list_hospitals(self) -> Dict[str, Any]:
        """List hospitals (stored in the shelters table with type='hospital')."""
        from app.database import db
        rows = await db.table_select("shelters", limit=200)
        out = []
        for r in rows:
            if r.get("type") != "hospital":
                continue
            beds = max((r.get("capacity") or 0) - (r.get("current_occupancy") or 0), 0)
            out.append({**r, "beds_available": beds, "emergency_capable": True})
        return {"success": True, "data": out, "count": len(out)}

    async def create_hospital(self, data: dict) -> Dict[str, Any]:
        """Create a hospital entry."""
        from app.database import db
        import uuid
        from datetime import datetime, timezone
        row = {
            "id": f"hsp-{uuid.uuid4().hex[:6]}",
            "name": data["name"],
            "type": "hospital",
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "address": data.get("address"),
            "capacity": data.get("beds_available", 0),
            "current_occupancy": 0,
            "facilities": [],
            "status": "active",
            "contact_phone": data.get("phone"),
            "verified": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.table_insert("shelters", row)
        return {"success": True, "data": row, "message": "Hospital created successfully"}

location_service = LocationService()
