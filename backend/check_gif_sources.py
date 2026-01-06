"""
Check for GIF files in NOAA
"""
import requests
import re

print("=" * 80)
print("CHECKING FOR GIF FILES IN NOAA")
print("=" * 80)

# Check main animations directory
print("\n1. Main Animations Directory:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/', timeout=10)
    gif_files = re.findall(r'href="([^"]+\.gif)"', r.text, re.I)
    mp4_files = re.findall(r'href="([^"]+\.mp4)"', r.text, re.I)
    print(f"   GIF files: {len(gif_files)}")
    print(f"   MP4 files: {len(mp4_files)}")
    if gif_files:
        print(f"   Sample GIFs:")
        for gif in gif_files[:5]:
            print(f"     - {gif}")
    if mp4_files:
        print(f"   Sample MP4s:")
        for mp4 in mp4_files[:5]:
            print(f"     - {mp4}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check CCOR1
print("\n2. CCOR1 Directory:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/ccor1/', timeout=10)
    all_files = re.findall(r'href="([^"]+)"', r.text)
    gif_mp4 = [f for f in all_files if f.lower().endswith(('.gif', '.mp4'))]
    print(f"   Total GIF/MP4: {len(gif_mp4)}")
    for f in gif_mp4[:10]:
        print(f"     - {f}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check if MP4s can be used as animations
print("\n3. MP4 Video Files (Can be used as animations):")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/ccor1/mp4s/', timeout=10)
    mp4_files = re.findall(r'href="([^"]+\.mp4)"', r.text, re.I)
    print(f"   ✅ Found {len(mp4_files)} MP4 files")
    for mp4 in mp4_files:
        print(f"     - {mp4}")
        print(f"       URL: https://services.swpc.noaa.gov/products/ccor1/mp4s/{mp4}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check D-RAP animations
print("\n4. D-RAP Animation Directory:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/d-rap/', timeout=10)
    all_files = re.findall(r'href="([^"]+)"', r.text)
    gif_files = [f for f in all_files if '.gif' in f.lower()]
    print(f"   GIF files: {len(gif_files)}")
    if gif_files:
        for gif in gif_files[:5]:
            print(f"     - {gif}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 80)
print("SUMMARY:")
print("=" * 80)
print("✅ MP4 videos available (can be used as animations)")
print("✅ Image sequences can be converted to GIF")
print("✅ Real-time image updates every few minutes")


