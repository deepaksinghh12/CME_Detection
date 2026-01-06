"""Check SUVI and Flare animations"""
import requests
import re

print("Checking SUVI 094 and Flare animations...")

# Check SUVI directory
print("\n1. SUVI 094 directory:")
try:
    r = requests.get('https://services.swpc.noaa.gov/images/animations/suvi/primary/094/', timeout=15)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        files = re.findall(r'href="([^"]+)"', r.text)
        pngs = [f for f in files if '.png' in f.lower() and not f.startswith('?')]
        gifs = [f for f in files if '.gif' in f.lower()]
        mp4s = [f for f in files if '.mp4' in f.lower()]
        print(f"PNGs: {len(pngs)}")
        print(f"GIFs: {len(gifs)}")
        print(f"MP4s: {len(mp4s)}")
        if gifs:
            print("GIF files found:")
            for gif in gifs[:5]:
                print(f"  - {gif}")
        if mp4s:
            print("MP4 files found:")
            for mp4 in mp4s[:5]:
                print(f"  - {mp4}")
except Exception as e:
    print(f"Error: {e}")

# Check for flare animations
print("\n2. Solar Flare animations:")
try:
    r = requests.get('https://services.swpc.noaa.gov/images/goes-xrs/', timeout=15)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        files = re.findall(r'href="([^"]+)"', r.text)
        gifs = [f for f in files if '.gif' in f.lower()]
        mp4s = [f for f in files if '.mp4' in f.lower()]
        print(f"GIFs: {len(gifs)}")
        print(f"MP4s: {len(mp4s)}")
        if gifs:
            for gif in gifs[:5]:
                print(f"  - {gif}")
        if mp4s:
            for mp4 in mp4s[:5]:
                print(f"  - {mp4}")
except Exception as e:
    print(f"Error: {e}")

# Check SUVI JSON for latest images
print("\n3. SUVI 094 JSON (latest 5 images):")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/suvi-primary-094.json', timeout=10)
    if r.status_code == 200:
        data = r.json()
        print(f"Total images: {len(data)}")
        print("Latest 5 image URLs:")
        for img in data[-5:]:
            if isinstance(img, dict):
                url = img.get('url', '')
                full_url = f"https://services.swpc.noaa.gov{url}" if url.startswith('/') else url
                print(f"  - {full_url}")
except Exception as e:
    print(f"Error: {e}")

print("\nDone!")







