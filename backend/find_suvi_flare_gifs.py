"""
Find SUVI 094 and Solar Flare GIFs/Animations from NOAA
"""
import requests
import re
import json

print("=" * 80)
print("SEARCHING FOR SUVI 094 AND SOLAR FLARE GIFS/ANIMATIONS")
print("=" * 80)

# Check images/animations directory
print("\n1. Checking images/animations directory:")
try:
    r = requests.get('https://services.swpc.noaa.gov/images/animations/', timeout=10)
    if r.status_code == 200:
        all_links = re.findall(r'href="([^"]+)"', r.text)
        suvi_dirs = [l for l in all_links if 'suvi' in l.lower() and l.endswith('/')]
        print(f"   Found {len(suvi_dirs)} SUVI directories:")
        for dir in suvi_dirs[:10]:
            print(f"     - {dir}")
            
        # Check each SUVI directory
        for dir in suvi_dirs[:3]:
            try:
                dir_url = f"https://services.swpc.noaa.gov/images/animations/{dir}"
                r2 = requests.get(dir_url, timeout=10)
                if r2.status_code == 200:
                    files = re.findall(r'href="([^"]+)"', r2.text)
                    gifs = [f for f in files if '.gif' in f.lower()]
                    mp4s = [f for f in files if '.mp4' in f.lower()]
                    print(f"\n   {dir}:")
                    print(f"     GIFs: {len(gifs)}")
                    if gifs:
                        for gif in gifs[:5]:
                            print(f"       - {gif}")
                    print(f"     MP4s: {len(mp4s)}")
                    if mp4s:
                        for mp4 in mp4s[:5]:
                            print(f"       - {mp4}")
            except Exception as e:
                print(f"     Error checking {dir}: {e}")
    else:
        print(f"   Status: {r.status_code}")
except Exception as e:
    print(f"   Error: {e}")

# Check products/animations
print("\n2. Checking products/animations directory:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/', timeout=10)
    if r.status_code == 200:
        all_links = re.findall(r'href="([^"]+)"', r.text)
        suvi_files = [l for l in all_links if 'suvi' in l.lower()]
        flare_files = [l for l in all_links if 'flare' in l.lower()]
        print(f"   SUVI files: {len(suvi_files)}")
        for f in suvi_files[:10]:
            print(f"     - {f}")
        print(f"   Flare files: {len(flare_files)}")
        for f in flare_files[:10]:
            print(f"     - {f}")
except Exception as e:
    print(f"   Error: {e}")

# Check SUVI JSON for image URLs
print("\n3. Checking SUVI 094 JSON for image patterns:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/suvi-primary-094.json', timeout=10)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list) and len(data) > 0:
            sample = data[0]
            print(f"   Sample entry: {json.dumps(sample, indent=2)[:500]}")
            # Check if there's a pattern for GIFs
            if isinstance(sample, dict):
                url = sample.get('url', '')
                print(f"   URL pattern: {url}")
                # Try to find GIF version
                if url:
                    base_url = url.replace('.jpg', '').replace('.png', '')
                    gif_urls = [
                        f"{base_url}.gif",
                        f"{base_url}_animation.gif",
                        f"{base_url}_movie.gif",
                    ]
                    print(f"   Testing GIF patterns:")
                    for gif_url in gif_urls:
                        try:
                            check_r = requests.head(gif_url, timeout=5, allow_redirects=True)
                            if check_r.status_code == 200:
                                print(f"     ✅ FOUND: {gif_url}")
                        except:
                            pass
except Exception as e:
    print(f"   Error: {e}")

# Check GOES XRS (solar flares)
print("\n4. Checking GOES XRS (Solar Flares) endpoints:")
goes_urls = [
    'https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json',
    'https://services.swpc.noaa.gov/products/goes-xrs/',
    'https://services.swpc.noaa.gov/images/goes-xrs/',
]
for url in goes_urls:
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            if 'json' in url:
                data = r.json()
                print(f"   {url}: JSON data with {len(data) if isinstance(data, list) else 'dict'} entries")
            else:
                files = re.findall(r'href="([^"]+)"', r.text)
                gifs = [f for f in files if '.gif' in f.lower()]
                mp4s = [f for f in files if '.mp4' in f.lower()]
                print(f"   {url}:")
                print(f"     GIFs: {len(gifs)}")
                if gifs:
                    for gif in gifs[:5]:
                        print(f"       - {gif}")
                print(f"     MP4s: {len(mp4s)}")
                if mp4s:
                    for mp4 in mp4s[:5]:
                        print(f"       - {mp4}")
    except Exception as e:
        print(f"   {url}: Error - {e}")

print("\n" + "=" * 80)
print("SEARCH COMPLETE")
print("=" * 80)







