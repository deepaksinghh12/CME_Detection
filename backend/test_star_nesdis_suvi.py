"""
Test SUVI GIFs from star.nesdis.noaa.gov
"""
import requests
import re

print("=" * 80)
print("TESTING SUVI GIFs FROM star.nesdis.noaa.gov")
print("=" * 80)

url = 'https://www.star.nesdis.noaa.gov/goes/SUVI_band.php?band=Fe094&length=60&sat=G19'

print(f"\n1. Fetching page: {url}")
try:
    r = requests.get(url, timeout=15)
    print(f"   Status: {r.status_code}")
    print(f"   Content length: {len(r.text)}")
    
    if r.status_code == 200:
        # Find all GIF sources
        gif_links = re.findall(r'src=["\']([^"\']+\.gif[^"\']*)["\']', r.text, re.I)
        print(f"\n2. Found {len(gif_links)} GIF links:")
        for gif in gif_links[:10]:
            # Make absolute URL if relative
            if gif.startswith('/'):
                full_url = f"https://www.star.nesdis.noaa.gov{gif}"
            elif gif.startswith('http'):
                full_url = gif
            else:
                full_url = f"https://www.star.nesdis.noaa.gov/goes/{gif}"
            print(f"   - {full_url}")
            
            # Test if accessible
            try:
                check_r = requests.head(full_url, timeout=5, allow_redirects=True)
                if check_r.status_code == 200:
                    print(f"     ✅ Accessible")
                else:
                    print(f"     ❌ Status: {check_r.status_code}")
            except Exception as e:
                print(f"     ❌ Error: {e}")
        
        # Also check for animation/movie tags
        print(f"\n3. Checking for animation/movie elements:")
        animations = re.findall(r'(animation|movie|gif)[^"\']*["\']([^"\']+)["\']', r.text, re.I)
        print(f"   Found {len(animations)} animation references")
        for anim in animations[:5]:
            print(f"   - {anim}")
        
        # Check for iframe or embed tags that might contain GIFs
        iframes = re.findall(r'<iframe[^>]+src=["\']([^"\']+)["\']', r.text, re.I)
        print(f"\n4. Found {len(iframes)} iframes:")
        for iframe in iframes[:5]:
            print(f"   - {iframe}")
            
except Exception as e:
    print(f"   Error: {e}")
    import traceback
    traceback.print_exc()

# Also try different length parameters
print(f"\n5. Testing different length parameters:")
lengths = [60, 24, 12, 6]
for length in lengths:
    test_url = f'https://www.star.nesdis.noaa.gov/goes/SUVI_band.php?band=Fe094&length={length}&sat=G19'
    try:
        r = requests.get(test_url, timeout=10)
        if r.status_code == 200:
            gifs = re.findall(r'src=["\']([^"\']+\.gif[^"\']*)["\']', r.text, re.I)
            if gifs:
                print(f"   length={length}: Found {len(gifs)} GIFs")
                for gif in gifs[:2]:
                    if gif.startswith('/'):
                        full = f"https://www.star.nesdis.noaa.gov{gif}"
                    elif gif.startswith('http'):
                        full = gif
                    else:
                        full = f"https://www.star.nesdis.noaa.gov/goes/{gif}"
                    print(f"     - {full}")
    except:
        pass

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)







