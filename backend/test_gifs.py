"""
Test script to check if GIFs are available from NOAA
"""
import requests
import json
from noaa_realtime_data import get_image_sequence_for_gif, get_solar_flares_data

print("=" * 80)
print("TESTING GIF AVAILABILITY FROM NOAA")
print("=" * 80)

# Test LASCO C3
print("\n1. Testing LASCO C3:")
result = get_image_sequence_for_gif('lasco-c3', 5)
print(f"   Success: {result.get('success')}")
print(f"   Has GIFs: {result.get('has_gifs', False)}")
print(f"   GIFs found: {list(result.get('gifs', {}).keys())}")
if result.get('gifs'):
    print(f"   GIF URLs:")
    for key, url in result.get('gifs', {}).items():
        print(f"     {key}: {url}")

# Test SUVI 094
print("\n2. Testing SUVI 094:")
result = get_image_sequence_for_gif('suvi-094', 5)
print(f"   Success: {result.get('success')}")
print(f"   Has GIFs: {result.get('has_gifs', False)}")
print(f"   GIFs found: {list(result.get('gifs', {}).keys())}")
if result.get('gifs'):
    print(f"   GIF URLs:")
    for key, url in result.get('gifs', {}).items():
        print(f"     {key}: {url}")

# Test Solar Flares
print("\n3. Testing Solar Flares with GIFs:")
result = get_solar_flares_data(include_gifs=True)
print(f"   Success: {result.get('success')}")
print(f"   Has GIFs: {result.get('has_gifs', False)}")
if result.get('gifs'):
    print(f"   GIF URLs:")
    for key, url in result.get('gifs', {}).items():
        print(f"     {key}: {url}")

# Check actual URLs
print("\n4. Checking actual GIF URLs from NOAA:")
test_urls = [
    'https://services.swpc.noaa.gov/products/ccor1/mp4s/',
    'https://services.swpc.noaa.gov/images/animations/lasco-c3/',
    'https://services.swpc.noaa.gov/images/animations/suvi-primary-094/',
]

for url in test_urls:
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            import re
            gifs = re.findall(r'href="([^"]+\.gif)"', r.text, re.I)
            mp4s = re.findall(r'href="([^"]+\.mp4)"', r.text, re.I)
            print(f"\n   {url}:")
            print(f"     GIFs: {len(gifs)}")
            if gifs:
                for gif in gifs[:3]:
                    print(f"       - {gif}")
            print(f"     MP4s: {len(mp4s)}")
            if mp4s:
                for mp4 in mp4s[:3]:
                    print(f"       - {mp4}")
        else:
            print(f"\n   {url}: Status {r.status_code}")
    except Exception as e:
        print(f"\n   {url}: Error - {e}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)







