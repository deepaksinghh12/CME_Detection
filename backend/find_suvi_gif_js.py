"""
Find SUVI GIF URLs from JavaScript on star.nesdis.noaa.gov page
"""
import requests
import re
import json

url = 'https://www.star.nesdis.noaa.gov/goes/SUVI_band.php?band=Fe094&length=60&sat=G19'

print("Fetching SUVI page and extracting GIF URLs from JavaScript...")
try:
    r = requests.get(url, timeout=15)
    if r.status_code == 200:
        text = r.text
        
        # Look for JavaScript variables that might contain GIF URLs
        print("\n1. Searching for GIF URLs in JavaScript:")
        
        # Pattern 1: Look for .gif in JavaScript strings
        js_gifs = re.findall(r'["\']([^"\']*\.gif[^"\']*)["\']', text, re.I)
        print(f"   Found {len(js_gifs)} potential GIF references in JS strings:")
        for gif in list(set(js_gifs))[:10]:
            print(f"     - {gif}")
        
        # Pattern 2: Look for image/gif URLs
        http_gifs = re.findall(r'https?://[^\s"\'<>]+\.gif[^\s"\'<>]*', text, re.I)
        print(f"\n2. Found {len(http_gifs)} HTTP GIF URLs:")
        for gif in list(set(http_gifs))[:10]:
            print(f"     - {gif}")
        
        # Pattern 3: Look for data URLs or base64
        data_gifs = re.findall(r'data:image/gif[^"\']+', text, re.I)
        print(f"\n3. Found {len(data_gifs)} data GIF URLs:")
        for gif in data_gifs[:5]:
            print(f"     - {gif[:100]}...")
        
        # Pattern 4: Look for API endpoints that might return GIFs
        api_endpoints = re.findall(r'["\']([^"\']*api[^"\']*gif[^"\']*)["\']', text, re.I)
        print(f"\n4. Found {len(api_endpoints)} API endpoints with 'gif':")
        for endpoint in set(api_endpoints)[:10]:
            print(f"     - {endpoint}")
        
        # Pattern 5: Look for image generation scripts
        img_scripts = re.findall(r'<script[^>]*>([^<]*\.gif[^<]*)</script>', text, re.I | re.DOTALL)
        print(f"\n5. Found {len(img_scripts)} script blocks with GIF references:")
        for script in img_scripts[:3]:
            print(f"     - {script[:200]}...")
        
        # Pattern 6: Check for common GIF generation patterns
        print(f"\n6. Testing common GIF URL patterns:")
        base_urls = [
            'https://www.star.nesdis.noaa.gov/goes/data/SUVI/',
            'https://www.star.nesdis.noaa.gov/goes/SUVI/',
            'https://www.star.nesdis.noaa.gov/goes/animations/',
        ]
        
        gif_patterns = [
            'SUVI_Fe094_60min.gif',
            'SUVI_Fe094_animation.gif',
            'SUVI_094_60.gif',
            'suvi-094-60.gif',
            'G19_SUVI_Fe094_60.gif',
        ]
        
        for base in base_urls:
            for pattern in gif_patterns:
                test_url = base + pattern
                try:
                    check_r = requests.head(test_url, timeout=5, allow_redirects=True)
                    if check_r.status_code == 200:
                        print(f"     ✅ FOUND: {test_url}")
                except:
                    pass
        
        # Pattern 7: Look for AJAX/fetch calls that might load GIFs
        ajax_calls = re.findall(r'(fetch|ajax|xmlhttp|\.get|\.post)\(["\']([^"\']+)["\']', text, re.I)
        print(f"\n7. Found {len(ajax_calls)} AJAX/fetch calls:")
        for call in ajax_calls[:10]:
            if 'gif' in call[1].lower() or 'animation' in call[1].lower():
                print(f"     - {call[0]}: {call[1]}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\nDone!")

