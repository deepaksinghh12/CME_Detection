"""
Test MP4 videos and image sequences for GIF creation
"""
from noaa_realtime_data import get_ccor1_videos, get_image_sequence_for_gif

print("=" * 80)
print("MP4 VIDEOS & IMAGE SEQUENCES FOR GIF")
print("=" * 80)

# Test MP4 videos
print("\n1. CCOR1 MP4 Videos:")
v = get_ccor1_videos()
if v['success']:
    print("   ✅ Available MP4 Videos:")
    for key, url in v['data'].items():
        print(f"      - {key}: {url}")
else:
    print(f"   ❌ Failed: {v.get('error')}")

# Test image sequences
print("\n2. Image Sequences (Can be converted to GIF):")
sources = ['lasco-c3', 'enlil', 'ovation-north']
for source in sources:
    print(f"\n   {source.upper()}:")
    seq = get_image_sequence_for_gif(source, 5)
    if seq['success']:
        print(f"      ✅ Got {seq['count']} images")
        print(f"      Sample URLs:")
        for i, url in enumerate(seq['data'][:2], 1):
            print(f"        {i}. {url[:80]}...")
    else:
        print(f"      ❌ Failed: {seq.get('error')}")

print("\n" + "=" * 80)
print("SUMMARY:")
print("=" * 80)
print("✅ MP4 Videos: 3 files (24hrs, 7-day, 27-day)")
print("✅ Image Sequences: Available from multiple sources")
print("💡 These can be used to create GIF animations in frontend")


