"""Test SUVI GIF detection"""
from noaa_realtime_data import get_image_sequence_for_gif
import json

result = get_image_sequence_for_gif('suvi-094', 5)
print('SUVI 094 Result:')
print(f'Success: {result.get("success")}')
print(f'Has GIFs: {result.get("has_gifs", False)}')
print(f'GIFs found: {list(result.get("gifs", {}).keys())}')
if result.get('gifs'):
    print('GIF URLs:')
    for k, v in result.get('gifs', {}).items():
        print(f'  {k}: {v}')
else:
    print('No GIFs found')
    print(f'But we have {len(result.get("images", []))} images for animation')







