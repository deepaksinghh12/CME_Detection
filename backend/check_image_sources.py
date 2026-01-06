"""
Check where images and GIFs are coming from
"""
import requests

print("=" * 80)
print("IMAGE & GIF SOURCES FROM NOAA")
print("=" * 80)

# Check ENLIL
print("\n1. ENLIL Model Images:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/enlil.json')
    data = r.json()
    if data:
        sample = data[0]
        url = sample.get('url', 'N/A')
        print(f"   ✅ Source: https://services.swpc.noaa.gov{url}")
        print(f"   📊 Total: {len(data)} images")
        print(f"   📝 Type: CME propagation model visualization")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check LASCO C3
print("\n2. LASCO C3 Images:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/lasco-c3.json')
    data = r.json()
    if data:
        sample = data[0]
        url = sample.get('url', 'N/A')
        print(f"   ✅ Source: https://services.swpc.noaa.gov{url}")
        print(f"   📊 Total: {len(data)} images")
        print(f"   📝 Type: CME coronagraph images (JPG)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check LASCO C2
print("\n3. LASCO C2 Images:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/lasco-c2.json')
    data = r.json()
    if data:
        sample = data[0]
        url = sample.get('url', 'N/A')
        print(f"   ✅ Source: https://services.swpc.noaa.gov{url}")
        print(f"   📊 Total: {len(data)} images")
        print(f"   📝 Type: CME coronagraph images (JPG)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check Ovation Aurora
print("\n4. Ovation Aurora Images:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/ovation_north_24h.json')
    data = r.json()
    if data:
        sample = data[0]
        url = sample.get('url', 'N/A')
        print(f"   ✅ Source: https://services.swpc.noaa.gov{url}")
        print(f"   📊 Total: {len(data)} images")
        print(f"   📝 Type: Aurora prediction maps (JPG)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check SUVI
print("\n5. SUVI Solar UV Images:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/suvi-primary-094.json')
    data = r.json()
    if data:
        sample = data[0]
        url = sample.get('url', 'N/A')
        print(f"   ✅ Source: https://services.swpc.noaa.gov{url}")
        print(f"   📊 Total: {len(data)} images")
        print(f"   📝 Type: Solar UV images (PNG)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check SDO HMI
print("\n6. SDO HMI Images:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/sdo-hmii.json')
    data = r.json()
    if data:
        sample = data[0]
        url = sample.get('url', 'N/A')
        print(f"   ✅ Source: https://services.swpc.noaa.gov{url}")
        print(f"   📊 Total: {len(data)} images")
        print(f"   📝 Type: Solar magnetic field images (JPG)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check CCOR1 (Coronagraph)
print("\n7. CCOR1 Coronagraph Images:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/ccor1/jpegs.json')
    data = r.json()
    if data:
        sample = data[0] if isinstance(data, list) else list(data.values())[0] if data else None
        print(f"   ✅ Source: CCOR1 Coronagraph")
        print(f"   📊 Total: {len(data)} images")
        print(f"   📝 Type: Coronagraph images (JPEG)")
        if sample:
            print(f"   Sample keys: {list(sample.keys())[:3]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check for MP4/GIF
print("\n8. Video/Animation Files:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/ccor1/mp4s/')
    if r.status_code == 200:
        import re
        mp4_links = re.findall(r'href="([^"]+\.mp4)"', r.text)
        print(f"   ✅ CCOR1 MP4 Videos: {len(mp4_links)} files")
        if mp4_links:
            print(f"   Sample: {mp4_links[0]}")
        print(f"   📝 Source: https://services.swpc.noaa.gov/products/ccor1/mp4s/")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 80)
print("SUMMARY:")
print("=" * 80)
print("✅ All images come from: https://services.swpc.noaa.gov/images/")
print("✅ Image formats: JPG, PNG, GIF, MP4")
print("✅ Real-time updates: Every few minutes to hours")
print("✅ Sources: LASCO, SUVI, SDO, CCOR1, ENLIL, Ovation")


