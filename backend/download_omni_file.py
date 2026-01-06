#!/usr/bin/env python3
"""
Download OMNIWeb pre-combined data file directly
"""
import requests
from datetime import datetime
import os

# NASA SPDF URLs
SPDF_BASE_URLS = [
    "https://spdf.gsfc.nasa.gov/pub/data/omni/omni_cdaweb/hro_1hr/",
    "https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/",
    "https://cdaweb.gsfc.nasa.gov/pub/data/omni/omni_cdaweb/hro_1hr/",
]

def download_omni_file(year: int, output_dir: str = "downloads") -> str:
    """
    Download OMNIWeb data file for a specific year.
    
    Args:
        year: Year to download (e.g., 2023)
        output_dir: Directory to save the file
        
    Returns:
        Path to downloaded file or None if failed
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Try multiple file formats
    file_names = [
        f"omni2_{year}.dat",
        f"omni2_hro_1hr_{year}0101_v01.dat",
        f"omni2_hro_1hr_{year}.dat",
        f"omni_hro_1hr_{year}.dat",
        f"omni2_{year}.txt",
    ]
    
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    
    for base_url in SPDF_BASE_URLS:
        for file_name in file_names:
            url = f"{base_url}{file_name}"
            try:
                print(f"📥 Trying: {url}")
                response = session.get(url, timeout=30, stream=True)
                
                if response.status_code == 200:
                    # Check if it's actually a data file (not HTML error page)
                    content_preview = response.content[:1000].decode('utf-8', errors='ignore')
                    
                    if len(content_preview) > 100 and (
                        'YEAR' in content_preview.upper() or 
                        any(c.isdigit() for c in content_preview[:100])
                    ):
                        # Valid data file
                        output_path = os.path.join(output_dir, file_name)
                        
                        print(f"✅ Downloading to: {output_path}")
                        with open(output_path, 'wb') as f:
                            for chunk in response.iter_content(chunk_size=8192):
                                f.write(chunk)
                        
                        file_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
                        print(f"✅ Downloaded successfully! Size: {file_size:.2f} MB")
                        print(f"📁 File saved at: {os.path.abspath(output_path)}")
                        return output_path
                    else:
                        print(f"⚠️ Response doesn't look like data file, skipping...")
                
            except Exception as e:
                print(f"❌ Failed: {e}")
                continue
    
    print("❌ Could not download file from any URL")
    return None


if __name__ == "__main__":
    import sys
    
    # Get year from command line or use default
    if len(sys.argv) > 1:
        year = int(sys.argv[1])
    else:
        year = 2023
        print(f"No year specified, using default: {year}")
    
    print(f"\n{'='*70}")
    print(f"Downloading OMNIWeb data file for year {year}")
    print(f"{'='*70}\n")
    
    file_path = download_omni_file(year)
    
    if file_path:
        print(f"\n✅ Success! File downloaded: {file_path}")
        print(f"\nYou can now:")
        print(f"  1. Open the file in a text editor to view the data")
        print(f"  2. Use it with the CSV approach in omniweb_data_fetcher.py")
        print(f"  3. Analyze the column structure")
    else:
        print(f"\n❌ Download failed. You may need to:")
        print(f"  1. Check the year is correct (OMNIWeb has data from ~1963)")
        print(f"  2. Visit NASA SPDF website manually:")
        print(f"     https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/")
        print(f"  3. Download the file manually from browser")









