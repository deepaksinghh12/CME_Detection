"""
Find actual SUVI GIF URLs - check multiple patterns
"""
import requests
import re

print("=" * 80)
print("FINDING SUVI 094 GIF URLs")
print("=" * 80)

# Get latest SUVI image URL
print("\n1. Getting latest SUVI 094 image URL:")
try:
    r = requests.get('https://services.swpc.noaa.gov/products/animations/suvi-primary-094.json', timeout=10)
    if r.status_code == 200:
        data = r.json()
        if data:
            latest = data[-1]
            if isinstance(latest, dict):
                png_url = latest.get('url', '')
                print(f"   Latest PNG: {png_url}")
                
                # Try different GIF patterns
                base_url = png_url.replace('.png', '')
                full_base = f"https://services.swpc.noaa.gov{base_url}" if base_url.startswith('/') else base_url
                
                print("\n2. Testing GIF URL patterns:")
                gif_patterns = [
                    f"{full_base}.gif",
                    f"{full_base}_animation.gif",
                    f"{full_base}_movie.gif",
                    f"{base_url.replace('or_', '')}.gif",
                    f"{base_url.replace('or_', 'animation_')}.gif",
                ]
                
                # Also try directory-based patterns
                if '/suvi/primary/094/' in png_url:
                    dir_base = '/images/animations/suvi/primary/094/'
                    gif_patterns.extend([
                        f"https://services.swpc.noaa.gov{dir_base}suvi-094-latest.gif",
                        f"https://services.swpc.noaa.gov{dir_base}suvi-094-animation.gif",
                        f"https://services.swpc.noaa.gov{dir_base}suvi-094-movie.gif",
                        f"https://services.swpc.noaa.gov{dir_base}animation.gif",
                        f"https://services.swpc.noaa.gov{dir_base}latest.gif",
                    ])
                
                found_gifs = []
                for pattern in gif_patterns:
                    try:
                        check_r = requests.head(pattern, timeout=5, allow_redirects=True)
                        if check_r.status_code == 200:
                            print(f"   ✅ FOUND: {pattern}")
                            found_gifs.append(pattern)
                        else:
                            print(f"   ❌ {pattern} - Status: {check_r.status_code}")
                    except Exception as e:
                        print(f"   ❌ {pattern} - Error: {e}")
                
                if found_gifs:
                    print(f"\n   ✅ Total GIFs found: {len(found_gifs)}")
                else:
                    print(f"\n   ❌ No GIFs found with these patterns")
except Exception as e:
    print(f"   Error: {e}")

# Check if there's a GIF generation endpoint
print("\n3. Checking for GIF generation endpoints:")
gif_endpoints = [
    'https://services.swpc.noaa.gov/products/animations/suvi-primary-094.gif',
    'https://services.swpc.noaa.gov/images/animations/suvi/primary/094/animation.gif',
    'https://services.swpc.noaa.gov/images/animations/suvi/primary/094/latest.gif',
    'https://services.swpc.noaa.gov/images/animations/suvi/primary/094/suvi-094.gif',
]

for endpoint in gif_endpoints:
    try:
        check_r = requests.head(endpoint, timeout=5, allow_redirects=True)
        if check_r.status_code == 200:
            print(f"   ✅ FOUND: {endpoint}")
        else:
            print(f"   ❌ {endpoint} - Status: {check_r.status_code}")
    except Exception as e:
        print(f"   ❌ {endpoint} - Error: {e}")

# Check NOAA website for SUVI GIF links
print("\n4. Checking NOAA website for SUVI GIF links:")
try:
    r = requests.get('https://www.swpc.noaa.gov/products/goes-solar-ultraviolet-imager-suvi', timeout=15)
    if r.status_code == 200:
        # Find all GIF links
        gif_links = re.findall(r'href="([^"]+\.gif)"', r.text, re.I)
        suvi_gifs = [link for link in gif_links if 'suvi' in link.lower() or '094' in link]
        print(f"   Found {len(suvi_gifs)} SUVI GIF links on website:")
        for gif in suvi_gifs[:10]:
            # Make absolute URL if relative
            if gif.startswith('/'):
                full_url = f"https://www.swpc.noaa.gov{gif}"
            elif gif.startswith('http'):
                full_url = gif
            else:
                full_url = f"https://www.swpc.noaa.gov/{gif}"
            print(f"     - {full_url}")
            
            # Test if accessible
            try:
                check_r = requests.head(full_url, timeout=5, allow_redirects=True)
                if check_r.status_code == 200:
                    print(f"       ✅ Accessible")
            except:
                pass
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 80)
print("SEARCH COMPLETE")
print("=" * 80)
print("\n💡 TIP: If you see GIFs in browser, please share the URL so we can add it to the code!")







