"""Test solar flare GIFs"""
from noaa_realtime_data import get_solar_flares_data

result = get_solar_flares_data(include_gifs=True)
print(f'Has GIFs: {result.get("has_gifs", False)}')
print(f'GIFs found: {list(result.get("gifs", {}).keys())}')
if result.get('gifs'):
    print('GIF URLs:')
    for k, v in result.get('gifs', {}).items():
        print(f'  {k}: {v}')







