"""
Get SUVI GIF URL from star.nesdis.noaa.gov PHP page
"""
import requests
import re
from datetime import datetime

url = 'https://www.star.nesdis.noaa.gov/goes/SUVI_band.php?band=Fe094&length=60&sat=G19'

print("Fetching SUVI page to extract GIF URL...")
try:
    r = requests.get(url, timeout=15)
    if r.status_code == 200:
        text = r.text
        
        # Look for the actual GIF filename in JavaScript
        # Pattern: G19_fd_Fe094_60fr_YYYYMMDD-HHMM.gif
        gif_pattern = r'G19_fd_Fe094_60fr_\d{8}-\d{4}\.gif'
        gif_matches = re.findall(gif_pattern, text)
        
        if gif_matches:
            gif_filename = gif_matches[0]
            print(f"\n✅ Found GIF filename: {gif_filename}")
            
            # Try different base URLs
            base_urls = [
                'https://www.star.nesdis.noaa.gov/goes/data/SUVI/G19/',
                'https://www.star.nesdis.noaa.gov/goes/SUVI/G19/',
                'https://www.star.nesdis.noaa.gov/goes/animations/SUVI/G19/',
            ]
            
            for base in base_urls:
                full_url = base + gif_filename
                try:
                    check_r = requests.head(full_url, timeout=5, allow_redirects=True)
                    if check_r.status_code == 200:
                        print(f"✅ FOUND GIF URL: {full_url}")
                        print(f"   Status: {check_r.status_code}")
                        print(f"   Content-Type: {check_r.headers.get('Content-Type', 'N/A')}")
                        break
                    else:
                        print(f"❌ {full_url} - Status: {check_r.status_code}")
                except Exception as e:
                    print(f"❌ {full_url} - Error: {e}")
        else:
            print("❌ No GIF filename found in page")
            
            # Try to find any image source that might be the GIF
            img_sources = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', text, re.I)
            print(f"\nFound {len(img_sources)} image sources:")
            for img in img_sources[:10]:
                if 'gif' in img.lower() or 'animation' in img.lower() or 'suvi' in img.lower():
                    print(f"  - {img}")
                    # Make absolute URL
                    if img.startswith('/'):
                        full = f"https://www.star.nesdis.noaa.gov{img}"
                    elif img.startswith('http'):
                        full = img
                    else:
                        full = f"https://www.star.nesdis.noaa.gov/goes/{img}"
                    print(f"    Full URL: {full}")
                    
                    # Test
                    try:
                        check_r = requests.head(full, timeout=5, allow_redirects=True)
                        if check_r.status_code == 200:
                            print(f"    ✅ Accessible!")
                    except:
                        pass
        
        # Also check for canvas or video elements that might contain the animation
        canvas_video = re.findall(r'<(canvas|video)[^>]+>', text, re.I)
        if canvas_video:
            print(f"\nFound {len(canvas_video)} canvas/video elements (might be generating animation)")
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\nDone!")







