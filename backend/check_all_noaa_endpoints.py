"""
Check ALL NOAA endpoints and their date ranges
"""
import requests
import json
from datetime import datetime

def check_endpoint(name, url):
    """Check a single endpoint"""
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and len(data) > 1:
                first = data[1][0] if isinstance(data[1], list) else data[1].get('time_tag', 'N/A')
                last = data[-1][0] if isinstance(data[-1], list) else data[-1].get('time_tag', 'N/A')
                count = len(data) - 1
                return {
                    'success': True,
                    'count': count,
                    'first': first,
                    'last': last
                }
            elif isinstance(data, list):
                return {
                    'success': True,
                    'count': len(data),
                    'first': 'N/A',
                    'last': 'N/A'
                }
            elif isinstance(data, dict):
                return {
                    'success': True,
                    'count': len(data),
                    'first': 'N/A',
                    'last': 'N/A'
                }
        return {'success': False, 'error': f'Status {r.status_code}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

# All known NOAA endpoints
endpoints = {
    # Solar Wind
    'Magnetic 7-day': 'https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json',
    'Magnetic 3-day': 'https://services.swpc.noaa.gov/products/solar-wind/mag-3-day.json',
    'Magnetic 1-day': 'https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json',
    'Magnetic 6-hour': 'https://services.swpc.noaa.gov/products/solar-wind/mag-6-hour.json',
    'Magnetic 2-hour': 'https://services.swpc.noaa.gov/products/solar-wind/mag-2-hour.json',
    'Magnetic 5-minute': 'https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json',
    'Plasma 7-day': 'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json',
    'Plasma 3-day': 'https://services.swpc.noaa.gov/products/solar-wind/plasma-3-day.json',
    'Plasma 1-day': 'https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json',
    'Plasma 6-hour': 'https://services.swpc.noaa.gov/products/solar-wind/plasma-6-hour.json',
    'Plasma 2-hour': 'https://services.swpc.noaa.gov/products/solar-wind/plasma-2-hour.json',
    'Plasma 5-minute': 'https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json',
    'Ephemerides': 'https://services.swpc.noaa.gov/products/solar-wind/ephemerides.json',
    
    # Geomagnetic
    'DST Index': 'https://services.swpc.noaa.gov/products/kyoto-dst.json',
    'Kp Index': 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    'Kp Forecast': 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json',
    
    # Solar Flux
    'F10.7 Flux': 'https://services.swpc.noaa.gov/products/10cm-flux-30-day.json',
    
    # Alerts
    'Space Weather Alerts': 'https://services.swpc.noaa.gov/products/alerts.json',
    
    # Geospace
    'Propagated SW (1h)': 'https://services.swpc.noaa.gov/products/geospace/propagated-solar-wind-1-hour.json',
    'Propagated SW (full)': 'https://services.swpc.noaa.gov/products/geospace/propagated-solar-wind.json',
    
    # CME
    'CME List': 'https://services.swpc.noaa.gov/products/animations/lasco-c3.json',
    
    # Other
    'NOAA Scales': 'https://services.swpc.noaa.gov/products/noaa-scales.json',
}

print("=" * 80)
print("CHECKING ALL NOAA ENDPOINTS - DATE RANGES & DATA AVAILABILITY")
print("=" * 80)

working = []
failed = []

for name, url in endpoints.items():
    print(f"\n{name}...")
    result = check_endpoint(name, url)
    if result['success']:
        working.append((name, result))
        print(f"  ✅ SUCCESS")
        print(f"  📊 Entries: {result['count']}")
        if result['first'] != 'N/A':
            print(f"  📅 First: {result['first']}")
            print(f"  📅 Last: {result['last']}")
    else:
        failed.append((name, result))
        print(f"  ❌ FAILED: {result.get('error', 'Unknown')}")

print("\n" + "=" * 80)
print(f"SUMMARY: ✅ {len(working)} Working | ❌ {len(failed)} Failed")
print("=" * 80)

print("\n✅ WORKING ENDPOINTS:")
for name, result in working:
    print(f"  - {name}: {result['count']} entries")

if failed:
    print("\n❌ FAILED ENDPOINTS:")
    for name, result in failed:
        print(f"  - {name}: {result.get('error', 'Unknown error')}")

print("\n" + "=" * 80)
print("DATE RANGE SUMMARY:")
print("=" * 80)

# Check date ranges
date_ranges = {}
for name, result in working:
    if result['first'] != 'N/A' and result['last'] != 'N/A':
        date_ranges[name] = {
            'first': result['first'],
            'last': result['last'],
            'days': '~7-8 days' if '7-day' in name else '~30 days' if '30-day' in name else 'Varies'
        }

for name, info in sorted(date_ranges.items()):
    print(f"\n{name}:")
    print(f"  First: {info['first']}")
    print(f"  Last: {info['last']}")
    print(f"  Range: {info['days']}")


