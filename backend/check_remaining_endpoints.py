"""
Check remaining important NOAA endpoints
"""
import requests

important_endpoints = {
    'ENLIL Model': 'https://services.swpc.noaa.gov/products/animations/enlil.json',
    'LASCO C2': 'https://services.swpc.noaa.gov/products/animations/lasco-c2.json',
    'Ovation Aurora North': 'https://services.swpc.noaa.gov/products/animations/ovation_north_24h.json',
    'Ovation Aurora South': 'https://services.swpc.noaa.gov/products/animations/ovation_south_24h.json',
    'US TEC': 'https://services.swpc.noaa.gov/products/animations/us-tec.json',
    'CTIPE TEC': 'https://services.swpc.noaa.gov/products/animations/ctipe-tec.json',
    'SUVI Primary 094': 'https://services.swpc.noaa.gov/products/animations/suvi-primary-094.json',
    'SDO HMI': 'https://services.swpc.noaa.gov/products/animations/sdo-hmii.json',
}

print("=" * 80)
print("REMAINING IMPORTANT NOAA ENDPOINTS")
print("=" * 80)

for name, url in important_endpoints.items():
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list):
                print(f"\n{name}:")
                print(f"  ✅ Working - {len(data)} entries")
                if len(data) > 0:
                    print(f"  Sample type: {type(data[0])}")
                    if isinstance(data[0], dict):
                        print(f"  Keys: {list(data[0].keys())[:5]}")
            elif isinstance(data, dict):
                print(f"\n{name}:")
                print(f"  ✅ Working - {len(data)} keys")
                print(f"  Top keys: {list(data.keys())[:5]}")
        else:
            print(f"\n{name}: ❌ Status {r.status_code}")
    except Exception as e:
        print(f"\n{name}: ❌ Error - {str(e)[:50]}")


