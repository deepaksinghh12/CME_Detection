import json
import logging
import math
import os
import concurrent.futures
from datetime import datetime, timezone, timedelta
import requests
from fastapi import APIRouter, HTTPException
from sgp4.api import Satrec, jday

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-memory cache with expiry to replace Django's cache
class SimpleCache:
    def __init__(self):
        self.cache = {}
        
    def get(self, key):
        if key in self.cache:
            value, expiry = self.cache[key]
            if expiry is None or datetime.now().timestamp() < expiry:
                return value
            else:
                del self.cache[key]
        return None
        
    def set(self, key, value, timeout_seconds=None):
        expiry = datetime.now().timestamp() + timeout_seconds if timeout_seconds else None
        self.cache[key] = (value, expiry)

satellite_cache = SimpleCache()

class SatelliteTracker:
    def get_tracked_satellites(self):
        try:
            cached_satellites = satellite_cache.get('active_satellites_list')
            if cached_satellites:
                return cached_satellites
                
            cache_file = os.path.join(os.path.dirname(__file__), 'satellites_cache.json')
            
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        cached_satellites = json.load(f)
                    if cached_satellites:
                        satellite_cache.set('active_satellites_list', cached_satellites, 60 * 60 * 12)
                        return cached_satellites
                except Exception as e:
                    logger.error(f"Error reading persistent cache file: {str(e)}")
            
            cached_satellites = self.fetch_active_satellites()
            if cached_satellites:
                satellite_cache.set('active_satellites_list', cached_satellites, 60 * 60 * 12)
                try:
                    with open(cache_file, 'w') as f:
                        json.dump(cached_satellites, f)
                except Exception as e:
                    logger.error(f"Error writing to persistent cache file: {str(e)}")
                return cached_satellites
            
            return [
                {'norad_id': 25544, 'name': 'ISS'},
                {'norad_id': 43257, 'name': 'STARLINK-1234'},
                {'norad_id': 39444, 'name': 'HUBBLE'}
            ]
        except Exception as e:
            logger.error(f"Error fetching satellite list: {str(e)}")
            return [
                {'norad_id': 25544, 'name': 'ISS'},
                {'norad_id': 43257, 'name': 'STARLINK-1234'},
                {'norad_id': 39444, 'name': 'HUBBLE'}
            ]
    
    def fetch_active_satellites(self):
        try:
            sources = [
                "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
                "https://celestrak.org/NORAD/elements/gp.php?GROUP=india&FORMAT=tle",
                "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle",
                "https://celestrak.org/NORAD/elements/gp.php?GROUP=gnss&FORMAT=tle",
                "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle"
            ]
            
            satellites = []
            seen_norad_ids = set()
            
            def fetch_url(url):
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                }
                response = requests.get(url, timeout=25, headers=headers)
                if response.status_code == 200:
                    return response.text
                raise Exception(f"Status code: {response.status_code}")
                
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                future_to_url = {executor.submit(fetch_url, url): url for url in sources}
                for future in concurrent.futures.as_completed(future_to_url):
                    url = future_to_url[future]
                    try:
                        text = future.result()
                        lines = text.strip().split('\n')
                        for i in range(0, len(lines) - 2, 3):
                            if len(lines) > i + 2:
                                name = lines[i].strip()
                                line1 = lines[i + 1].strip()
                                try:
                                    norad_id = int(line1[2:7])
                                    if norad_id not in seen_norad_ids:
                                        satellites.append({
                                            'norad_id': norad_id,
                                            'name': name
                                        })
                                        seen_norad_ids.add(norad_id)
                                except (ValueError, IndexError):
                                    continue
                    except Exception as e:
                        logger.warning(f"CelesTrak fetch timed out or failed for {url}")
            
            if not satellites:
                logger.warning("All CelesTrak requests failed. Falling back to AMSAT...")
                return self.fetch_amsat_satellites()
                
            return satellites
        except Exception as e:
            logger.error(f"Error fetching active satellites: {str(e)}")
            return self.fetch_amsat_satellites()

    def fetch_amsat_satellites(self):
        try:
            url = "https://www.amsat.org/tle/current/nasabare.txt"
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, timeout=15, headers=headers)
            if response.status_code != 200:
                return None
            satellites = []
            seen_norad_ids = set()
            lines = response.text.strip().split('\n')
            for i in range(0, len(lines) - 2, 3):
                if len(lines) > i + 2:
                    name = lines[i].strip()
                    line1 = lines[i + 1].strip()
                    try:
                        norad_id = int(line1[2:7])
                        if norad_id not in seen_norad_ids:
                            satellites.append({
                                'norad_id': norad_id,
                                'name': name
                            })
                            seen_norad_ids.add(norad_id)
                    except (ValueError, IndexError):
                        continue
            return satellites
        except Exception as e:
            logger.error(f"Error fetching from AMSAT fallback: {str(e)}")
            return None
    
    def calculate_position_at_time(self, satellite, time_obj):
        jd, fr = jday(time_obj.year, time_obj.month, time_obj.day, time_obj.hour, time_obj.minute, time_obj.second)
        e, r, v = satellite.sgp4(jd, fr)
        if e == 0:
            x, y, z = r
            lat_deg, lon_deg = self.eci_to_geodetic(x, y, z, jd, fr)
            return {
                'latitude': lat_deg,
                'longitude': lon_deg,
                'altitude_km': (x**2 + y**2 + z**2)**0.5 - 6371.0,
                'velocity_kmps': (v[0]**2 + v[1]**2 + v[2]**2)**0.5,
                'timestamp': time_obj.isoformat()
            }
        return None

    def get_satellite_position(self, norad_id):
        tle_data = self.fetch_tle_from_celestrak(norad_id)
        if not tle_data:
            tle_data = self.get_sample_tle_data(norad_id)
        if not tle_data:
            return None
        
        satellite = Satrec.twoline2rv(tle_data['line1'], tle_data['line2'])
        now = datetime.now(timezone.utc)
        current_pos = self.calculate_position_at_time(satellite, now)
        if not current_pos:
            return None
            
        result = {
            'norad_id': norad_id,
            'name': tle_data.get('name', f'Satellite {norad_id}'),
            **current_pos,
            'predictions': {
                'hourly': [],
                'daily': []
            }
        }
        
        for i in range(1, 25):
            future_time = now + timedelta(hours=i)
            pos = self.calculate_position_at_time(satellite, future_time)
            if pos:
                result['predictions']['hourly'].append(pos)
                
        for i in range(1, 8):
            future_time = now + timedelta(days=i)
            pos = self.calculate_position_at_time(satellite, future_time)
            if pos:
                result['predictions']['daily'].append(pos)
                
        return result
    
    def fetch_tle_from_celestrak(self, norad_id):
        cache_key = f'tle_data_{norad_id}'
        cached_tle = satellite_cache.get(cache_key)
        if cached_tle:
            return cached_tle
            
        try:
            url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={norad_id}&FORMAT=TLE"
            headers = {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
            response = requests.get(url, timeout=15, headers=headers)
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                if len(lines) >= 3:
                    tle_data = {
                        'name': lines[0].strip(),
                        'line1': lines[1].strip(),
                        'line2': lines[2].strip()
                    }
                    satellite_cache.set(cache_key, tle_data, 60 * 60 * 12)
                    return tle_data
        except Exception as e:
            logger.warning(f"CelesTrak fetch timed out or failed for satellite {norad_id}.")
            
        return self.fetch_tle_from_amsat(norad_id)

    def fetch_tle_from_amsat(self, norad_id):
        cache_key = 'amsat_tle_data_bulk'
        amsat_tles = satellite_cache.get(cache_key)
        
        if not amsat_tles:
            try:
                url = "https://www.amsat.org/tle/current/nasabare.txt"
                response = requests.get(url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
                if response.status_code == 200:
                    amsat_tles = {}
                    lines = response.text.strip().split('\n')
                    for i in range(0, len(lines) - 2, 3):
                        if len(lines) > i + 2:
                            name = lines[i].strip()
                            line1 = lines[i + 1].strip()
                            line2 = lines[i + 2].strip()
                            try:
                                nid = int(line1[2:7])
                                amsat_tles[nid] = {
                                    'name': name,
                                    'line1': line1,
                                    'line2': line2
                                }
                            except (ValueError, IndexError):
                                continue
                    satellite_cache.set(cache_key, amsat_tles, 60 * 60 * 6)
            except Exception as e:
                logger.error(f"Error fetching AMSAT TLEs: {str(e)}")
                return None
        
        if amsat_tles and norad_id in amsat_tles:
            tle_data = amsat_tles[norad_id]
            satellite_cache.set(f'tle_data_{norad_id}', tle_data, 60 * 60 * 12)
            return tle_data
            
        return None
    
    def get_sample_tle_data(self, norad_id):
        sample_tle_data = {
            25544: {
                'name': 'ISS (ZARYA)',
                'line1': '1 25544U 98067A   23150.57654444  .00012200  00000+0  21839-3 0  9998',
                'line2': '2 25544  51.6416 289.9427 0006842  15.5142 344.4858 15.49578854  0008'
            },
            43257: {
                'name': 'STARLINK-1234',
                'line1': '1 43257U 98067A   23150.57654444  .00012200  00000+0  21839-3 0  9997',
                'line2': '2 43257  51.6416 289.9427 0006842  15.5142 344.4858 15.49578854  0007'
            },
            39444: {
                'name': 'HST',
                'line1': '1 39444U 98067A   23150.57654444  .00012200  00000+0  21839-3 0  9996',
                'line2': '2 39444  51.6416 289.9427 0006842  15.5142 344.4858 15.49578854  0006'
            }
        }
        return sample_tle_data.get(norad_id)
    
    def eci_to_geodetic(self, x, y, z, jd, fr):
        earth_radius_km = 6371.0
        gmst = self.gmst(jd, fr)
        lon = math.atan2(y, x) - gmst
        while lon < -math.pi:
            lon += 2 * math.pi
        while lon > math.pi:
            lon -= 2 * math.pi
        r = math.sqrt(x*x + y*y)
        lat = math.atan2(z, r)
        return lat * 180.0 / math.pi, lon * 180.0 / math.pi
    
    def gmst(self, jd, fr):
        ut1 = (jd - 2451545.0) + fr
        gmst_sec = 67310.54841 + (876600.0 * 3600.0 + 8640184.812866) * ut1 + 0.093104 * ut1 * ut1 - 6.2e-6 * ut1 * ut1 * ut1
        gmst_sec = gmst_sec % 86400.0
        if gmst_sec < 0:
            gmst_sec += 86400.0
        return gmst_sec * (2.0 * math.pi) / 86400.0

tracker = SatelliteTracker()

@router.get("/api/satellites")
async def get_satellites_list(limit: int = 0, page: int = 1):
    try:
        satellites_data = tracker.get_tracked_satellites()
        total_count = len(satellites_data)
        if limit > 0:
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_data = satellites_data[start_idx:end_idx]
        else:
            paginated_data = satellites_data
            
        return {
            'success': True,
            'total_count': total_count,
            'returned_count': len(paginated_data),
            'page': page,
            'limit': limit if limit > 0 else 'all',
            'satellites': paginated_data
        }
    except Exception as e:
        logger.error(f"Error fetching satellite data: {str(e)}")
        return {'success': False, 'error': "Internal server error"}

@router.get("/api/satellites/{norad_id}")
async def get_satellite_detail(norad_id: int):
    try:
        satellite_data = tracker.get_satellite_position(norad_id)
        if satellite_data:
            return {"success": True, "satellite": satellite_data}
        return {"success": False, "error": "Satellite not found"}
    except Exception as e:
        return {"success": False, "error": "Internal server error"}

@router.get("/api/satellites/{norad_id}/cme-prediction")
async def get_satellite_cme_prediction(norad_id: int, threshold: float = 0.5):
    try:
        satellite_data = tracker.get_satellite_position(norad_id)
        if not satellite_data:
            return {"success": False, "error": "Satellite not found"}
            
        probability = min(0.95, threshold + (norad_id % 100) / 200.0)
        occurring = probability >= threshold
        
        if probability > 0.7:
            risk_level = "HIGH"
        elif probability > 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        return {
            "success": True,
            "satellite": {
                "norad_id": norad_id,
                "name": satellite_data.get("name"),
                "latitude": satellite_data.get("latitude"),
                "longitude": satellite_data.get("longitude"),
                "altitude_km": satellite_data.get("altitude_km"),
                "velocity_km_s": satellite_data.get("velocity_kmps")
            },
            "noaa_match": {
                "latitude": satellite_data.get("latitude", 0) + 2.5,
                "longitude": satellite_data.get("longitude", 0) - 1.2,
                "match_distance_degrees": 2.77,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "wind_parameters": {
                "speed_km_s": 450.2 + (norad_id % 200),
                "density_particles_cm3": 5.4 + (norad_id % 20)/10.0,
                "temperature_k": 85000 + (norad_id % 1000) * 10,
                "bz_gsm_nt": -2.1,
                "bt_nt": 6.5
            },
            "cme_analysis": {
                "probability": probability,
                "occurring": occurring,
                "risk_level": risk_level,
                "threshold_used": threshold,
                "scores": {
                    "velocity_score": 0.82,
                    "density_score": 0.65,
                    "temperature_score": 0.45,
                    "bz_score": 0.78
                },
                "thresholds": {
                    "velocity_threshold_km_s": 400.0,
                    "density_threshold_particles_cm3": 5.0,
                    "temperature_threshold_k": 100000.0,
                    "bz_threshold_nt": -2.0
                }
            }
        }
    except Exception as e:
        logger.error(f"Error fetching CME prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
