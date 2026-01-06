"""
Discover ALL NOAA endpoints
"""
import requests
import re

def get_all_endpoints():
    """Get all JSON endpoints from NOAA"""
    base_url = "https://services.swpc.noaa.gov/products/"
    
    # Main products
    r = requests.get(base_url)
    main_links = re.findall(r'href="([^"]+)"', r.text)
    
    endpoints = []
    
    # Direct JSON files
    for link in main_links:
        if link.endswith('.json'):
            endpoints.append(link)
    
    # Check subdirectories
    subdirs = ['solar-wind', 'geospace', 'animations', 'gong', 'flares', 'summary', 'ccor1']
    
    for subdir in subdirs:
        try:
            r = requests.get(f"{base_url}{subdir}/", timeout=10)
            links = re.findall(r'href="([^"]+\.json)"', r.text)
            for link in links:
                endpoints.append(f"{subdir}/{link}")
        except:
            pass
    
    return sorted(set(endpoints))

if __name__ == "__main__":
    print("Discovering ALL NOAA JSON endpoints...")
    endpoints = get_all_endpoints()
    print(f"\nTotal endpoints found: {len(endpoints)}\n")
    for i, ep in enumerate(endpoints, 1):
        print(f"{i}. {ep}")


