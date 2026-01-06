"""Verify SUVI GIF URL works"""
import requests

# Test the PHP URL with format=gif
url = 'https://www.star.nesdis.noaa.gov/goes/SUVI_band.php?band=Fe094&length=60&sat=G19&format=gif'

print(f"Testing: {url}")
try:
    r = requests.head(url, timeout=10, allow_redirects=True)
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('Content-Type', 'N/A')}")
    print(f"Content-Length: {r.headers.get('Content-Length', 'N/A')}")
    
    # Also try GET to see first few bytes
    r2 = requests.get(url, timeout=10, stream=True)
    if r2.status_code == 200:
        first_bytes = r2.raw.read(10)
        print(f"First 10 bytes: {first_bytes}")
        # Check if it's a GIF (starts with GIF89a or GIF87a)
        if first_bytes.startswith(b'GIF'):
            print("✅ This is a valid GIF file!")
        else:
            print("⚠️ This might not be a GIF (could be HTML page)")
            print(f"   Content-Type: {r2.headers.get('Content-Type', 'N/A')}")
except Exception as e:
    print(f"Error: {e}")

# Also try to get the actual GIF filename from the page
print("\n" + "="*60)
print("Getting actual GIF filename from page:")
try:
    page_url = 'https://www.star.nesdis.noaa.gov/goes/SUVI_band.php?band=Fe094&length=60&sat=G19'
    r = requests.get(page_url, timeout=10)
    if r.status_code == 200:
        import re
        gif_refs = re.findall(r'G19_fd_Fe094_60fr_\d{8}-\d{4}\.gif', r.text)
        if gif_refs:
            latest_gif = gif_refs[-1]
            print(f"Latest GIF filename: {latest_gif}")
            
            # Try different base paths
            bases = [
                'https://www.star.nesdis.noaa.gov/goes/data/SUVI/G19/',
                'https://www.star.nesdis.noaa.gov/goes/SUVI/G19/',
            ]
            
            for base in bases:
                test_url = base + latest_gif
                try:
                    r2 = requests.head(test_url, timeout=5)
                    if r2.status_code == 200:
                        print(f"✅ FOUND: {test_url}")
                        print(f"   Content-Type: {r2.headers.get('Content-Type', 'N/A')}")
                        break
                    else:
                        print(f"❌ {test_url} - Status: {r2.status_code}")
                except:
                    pass
except Exception as e:
    print(f"Error: {e}")

print("\nDone!")







