#!/usr/bin/env python3
"""
Convert CDF file to CSV for inspection.
Usage: python convert_cdf_to_csv.py <cdf_file_path> [output_csv_path]
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))

from scripts.swis_data_loader import SWISDataLoader

def convert_cdf_to_csv(cdf_path: str, output_path: str = None):
    """
    Convert CDF file to CSV.
    
    Parameters:
    -----------
    cdf_path : str
        Path to input CDF file
    output_path : str, optional
        Path to output CSV file. If None, uses same name as CDF with .csv extension
    """
    cdf_file = Path(cdf_path)
    
    if not cdf_file.exists():
        print(f"❌ CDF file not found: {cdf_path}")
        return False
    
    print(f"📁 Loading CDF file: {cdf_file.name}")
    print(f"   Size: {cdf_file.stat().st_size / 1024:.1f} KB")
    
    # Load CDF file
    try:
        loader = SWISDataLoader()
        data = loader.load_cdf_file(str(cdf_file))
        
        if data is None or data.empty:
            print("❌ No data loaded from CDF file")
            return False
        
        print(f"✅ Loaded {len(data)} data points")
        print(f"   Date range: {data.index[0] if isinstance(data.index, pd.DatetimeIndex) else 'N/A'} to {data.index[-1] if isinstance(data.index, pd.DatetimeIndex) else 'N/A'}")
        print(f"   Columns: {list(data.columns)}")
        
        # Determine output path
        if output_path is None:
            output_path = cdf_file.with_suffix('.csv')
        else:
            output_path = Path(output_path)
        
        # Reset index if timestamp is in index
        if isinstance(data.index, pd.DatetimeIndex):
            data_to_save = data.reset_index()
            if 'index' in data_to_save.columns:
                data_to_save.rename(columns={'index': 'timestamp'}, inplace=True)
        else:
            data_to_save = data.copy()
        
        # Ensure timestamp column exists
        if 'timestamp' not in data_to_save.columns and 'datetime' not in data_to_save.columns:
            if isinstance(data.index, pd.DatetimeIndex):
                data_to_save['timestamp'] = data.index
            else:
                print("⚠️  Warning: No timestamp information found")
        
        # Save to CSV
        print(f"\n💾 Saving to CSV: {output_path}")
        data_to_save.to_csv(output_path, index=False)
        
        print(f"✅ Successfully converted to CSV!")
        print(f"   Output file: {output_path}")
        print(f"   Rows: {len(data_to_save)}")
        print(f"   Columns: {len(data_to_save.columns)}")
        
        # Show sample data
        print(f"\n📊 Sample data (first 5 rows):")
        print(data_to_save.head().to_string())
        
        # Show data statistics
        print(f"\n📈 Data Statistics:")
        numeric_cols = data_to_save.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            print(data_to_save[numeric_cols].describe().to_string())
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting CDF to CSV: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python convert_cdf_to_csv.py <cdf_file_path> [output_csv_path]")
        print("\nExample:")
        print("  python convert_cdf_to_csv.py downloads/file.cdf")
        print("  python convert_cdf_to_csv.py downloads/file.cdf output/file.csv")
        
        # Try to find CDF files in downloads folder
        downloads_dir = Path(__file__).parent / 'downloads'
        if downloads_dir.exists():
            cdf_files = list(downloads_dir.glob("*.cdf"))
            if cdf_files:
                print(f"\n📁 Found CDF files in downloads folder:")
                for cdf_file in cdf_files[:5]:
                    print(f"   - {cdf_file.name}")
                if len(cdf_files) > 5:
                    print(f"   ... and {len(cdf_files) - 5} more")
                print(f"\n💡 Quick convert: python convert_cdf_to_csv.py downloads/{cdf_files[0].name}")
        
        sys.exit(1)
    
    cdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = convert_cdf_to_csv(cdf_path, output_path)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()






