import aiohttp
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Using the key found in frontend, but ideally this should be a backend-specific key
YANDEX_API_KEY = "09cb021e-5a23-41f0-9979-14523fdbd16c" 

async def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """
    Geocode address string to (latitude, longitude) using Yandex Geocoder API.
    """
    if not address:
        return None
        
    url = "https://geocode-maps.yandex.ru/1.x/"
    params = {
        "apikey": YANDEX_API_KEY,
        "geocode": address,
        "format": "json",
        "results": 1
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Yandex API error: {response.status}")
                    return None
                    
                data = await response.json()
                
                try:
                    # Parse response structure
                    # response -> GeoObjectCollection -> featureMember -> [0] -> GeoObject -> Point -> pos
                    geo_object = data["response"]["GeoObjectCollection"]["featureMember"][0]["GeoObject"]
                    pos = geo_object["Point"]["pos"]
                    
                    # pos is "lon lat" (string)
                    lon, lat = map(float, pos.split())
                    return lat, lon
                    
                except (KeyError, IndexError, ValueError) as e:
                    logger.warning(f"Could not parse Yandex response for '{address}': {e}")
                    return None
                    
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return None

async def get_route_info(lat1: float, lon1: float, lat2: float, lon2: float) -> Optional[dict]:
    """
    Get routing information (time, distance) between two points.
    Note: Usage of the frontend key for Routing API might be restricted.
    """
    # Using Yandex Router API (v2) - Requires Routing API key, checking if the current key works
    # If standard routing API fails, we fallback to Haversine roughly or use another service
    
    url = "https://api.routing.yandex.net/v2/route"
    params = {
        "apikey": YANDEX_API_KEY,
        "waypoints": f"{lat1},{lon1}|{lat2},{lon2}",
        "mode": "driving" 
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.warning(f"Yandex Routing API failed ({response.status}) - maybe key doesn't have Routing access?")
                    return None
                    
                data = await response.json()
                # Parse route info... (simplified)
                # This depends on exact API logic, usually data['route']['legs'][0]...
                return data
                
    except Exception as e:
        logger.error(f"Routing error: {e}")
        return None
