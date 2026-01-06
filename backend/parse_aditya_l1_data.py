"""
Aditya-L1 CDF Data Parser
=========================
Reads SWIS Level-2 CDF files and extracts solar wind parameters
"""

import cdflib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_aditya_l1_cdf(cdf_file_path):
    """
    Parse Aditya-L1 SWIS CDF file
    
    Args:
        cdf_file_path: Path to CDF file
        
    Returns:
        DataFrame with solar wind parameters
    """
    try:
        logger.info(f"📂 Reading CDF file: {cdf_file_path}")
        
        # Read CDF file
        cdf = cdflib.CDF(cdf_file_path)
        
        # Get CDF info
        info = cdf.cdf_info()
        variables = info.get('zVariables', [])
        
        logger.info(f"📊 Found {len(variables)} variables")
        logger.info(f"Variables: {variables}")
        
        # Extract data
        data = {}
        
        # Try to extract timestamp (multiple possible names)
        timestamp_vars = ['Epoch', 'Time', 'TIME', 'epoch', 'time_tag', 'Timestamp']
        for var in timestamp_vars:
            if var in variables:
                try:
                    epochs = cdf.varget(var)
                    # Convert CDF epoch to datetime
                    if hasattr(cdflib, 'cdfepoch'):
                        data['timestamp'] = cdflib.cdfepoch.to_datetime(epochs)
                    else:
                        data['timestamp'] = pd.to_datetime(epochs)
                    logger.info(f"✅ Extracted timestamps from '{var}'")
                    break
                except Exception as e:
                    logger.warning(f"Failed to extract {var}: {e}")
        
        # Solar wind parameter mappings (try multiple possible names)
        param_mappings = {
            'proton_velocity': ['V_proton', 'Velocity', 'V', 'Speed', 'v_p', 'Vp', 'SW_V'],
            'proton_density': ['N_proton', 'Density', 'N', 'n_p', 'Np', 'SW_N'],
            'proton_temperature': ['T_proton', 'Temperature', 'T', 'Temp', 'T_p', 'Tp', 'SW_T'],
            'proton_flux': ['Flux', 'F_proton', 'flux', 'F_p'],
            'magnetic_field': ['B', 'Bt', 'B_total', 'Bmag'],
            'bx': ['Bx', 'BX', 'B_x'],
            'by': ['By', 'BY', 'B_y'],
            'bz': ['Bz', 'BZ', 'B_z']
        }
        
        # Extract each parameter
        for param, possible_names in param_mappings.items():
            for name in possible_names:
                if name in variables:
                    try:
                        data[param] = cdf.varget(name)
                        logger.info(f"✅ Extracted {param} from '{name}'")
                        break
                    except Exception as e:
                        logger.warning(f"Failed to extract {name}: {e}")
        
        # If no data extracted, show all available variables
        if len(data) <= 1:  # Only timestamp
            logger.warning("⚠️ Could not extract standard parameters")
            logger.info("Available variables in CDF file:")
            for var in variables:
                try:
                    var_data = cdf.varget(var)
                    logger.info(f"  - {var}: shape={np.array(var_data).shape}, dtype={type(var_data)}")
                except:
                    logger.info(f"  - {var}: (could not read)")
        
        # Create DataFrame
        if not data:
            logger.error("❌ No data extracted from CDF file")
            return None
        
        df = pd.DataFrame(data)
        
        # Add metadata
        df['data_source'] = 'Aditya-L1 SWIS'
        df['file_name'] = Path(cdf_file_path).name
        
        logger.info(f"✅ Parsed {len(df)} data points from {Path(cdf_file_path).name}")
        logger.info(f"Columns: {list(df.columns)}")
        
        return df
        
    except Exception as e:
        logger.error(f"❌ Error parsing CDF file: {e}")
        import traceback
        traceback.print_exc()
        return None

def process_all_cdf_files(data_dir='data/aditya_l1/swis'):
    """
    Process all CDF files in directory
    """
    data_path = Path(data_dir)
    
    # Create directory if it doesn't exist
    data_path.mkdir(parents=True, exist_ok=True)
    
    # Find all CDF files
    cdf_files = list(data_path.glob('*.cdf')) + list(data_path.glob('*.CDF'))
    
    if not cdf_files:
        logger.warning(f"⚠️ No CDF files found in {data_dir}")
        logger.info(f"Please download Aditya-L1 CDF files and place them in: {data_path.absolute()}")
        return None
    
    logger.info(f"📁 Found {len(cdf_files)} CDF files")
    
    all_data = []
    for cdf_file in cdf_files:
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing: {cdf_file.name}")
        logger.info(f"{'='*60}")
        
        df = parse_aditya_l1_cdf(str(cdf_file))
        if df is not None and not df.empty:
            all_data.append(df)
    
    if not all_data:
        logger.error("❌ No data extracted from any CDF files")
        return None
    
    # Combine all data
    logger.info(f"\n{'='*60}")
    logger.info("Combining data from all files...")
    logger.info(f"{'='*60}")
    
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Sort by timestamp if available
    if 'timestamp' in combined_df.columns:
        combined_df = combined_df.sort_values('timestamp')
    
    # Save processed data
    output_dir = Path('data/aditya_l1/processed')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save as CSV
    csv_file = output_dir / f'aditya_l1_swis_{timestamp_str}.csv'
    combined_df.to_csv(csv_file, index=False)
    logger.info(f"✅ Saved CSV: {csv_file}")
    
    # Save as JSON
    json_file = output_dir / f'aditya_l1_swis_{timestamp_str}.json'
    combined_df.to_json(json_file, orient='records', date_format='iso')
    logger.info(f"✅ Saved JSON: {json_file}")
    
    # Print summary
    logger.info(f"\n{'='*60}")
    logger.info("📊 DATA SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"Total records: {len(combined_df)}")
    if 'timestamp' in combined_df.columns:
        logger.info(f"Date range: {combined_df['timestamp'].min()} to {combined_df['timestamp'].max()}")
    logger.info(f"Columns: {list(combined_df.columns)}")
    logger.info(f"\nFirst few rows:")
    print(combined_df.head())
    
    return combined_df

if __name__ == "__main__":
    print("=" * 60)
    print("Aditya-L1 CDF Data Parser")
    print("=" * 60)
    print()
    
    # Check if cdflib is installed
    try:
        import cdflib
        logger.info("✅ cdflib is installed")
    except ImportError:
        logger.error("❌ cdflib not installed!")
        logger.info("Install it with: pip install cdflib")
        exit(1)
    
    # Process all CDF files
    df = process_all_cdf_files()
    
    if df is not None:
        print("\n" + "=" * 60)
        print("✅ PROCESSING COMPLETE!")
        print("=" * 60)
        print(f"Data saved in: data/aditya_l1/processed/")
        print(f"Total records: {len(df)}")
    else:
        print("\n" + "=" * 60)
        print("❌ NO DATA PROCESSED")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Download Aditya-L1 CDF files from PRADAN portal")
        print("2. Place them in: data/aditya_l1/swis/")
        print("3. Run this script again")
