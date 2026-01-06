#!/usr/bin/env python3
"""
Parse OMNIWeb Results.html file and convert to pandas DataFrame
"""
import pandas as pd
import numpy as np
from datetime import datetime
import re
from pathlib import Path

def parse_omni_html_file(html_file_path: str) -> pd.DataFrame:
    """
    Parse OMNIWeb Results.html file and extract all data.
    
    Args:
        html_file_path: Path to the HTML file
        
    Returns:
        pandas.DataFrame with timestamp and all parameters
    """
    with open(html_file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract data from <pre> tag
    pre_match = re.search(r'<pre>(.*?)</pre>', content, re.DOTALL)
    if not pre_match:
        raise ValueError("Could not find <pre> tag in HTML file")
    
    pre_content = pre_match.group(1)
    lines = pre_content.split('\n')
    
    # Find parameter definitions (lines starting with number)
    param_definitions = {}
    header_line_idx = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Parameter definitions: "1 Scalar B, nT"
        if re.match(r'^\d+\s+', line):
            parts = line.split(None, 2)
            if len(parts) >= 2:
                param_num = int(parts[0])
                param_name = parts[1] if len(parts) > 1 else f"param_{param_num}"
                param_definitions[param_num] = param_name
        
        # Header line: "YEAR DOY HR    1     2     3..."
        if line.startswith('YEAR') and 'DOY' in line and 'HR' in line:
            header_line_idx = i
            break
    
    if header_line_idx is None:
        raise ValueError("Could not find header line in HTML file")
    
    # Parse data lines (after header)
    data_lines = []
    for line in lines[header_line_idx + 1:]:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        # Check if it's a data line (starts with 4-digit year)
        if re.match(r'^\d{4}\s+\d+\s+\d+', line):
            data_lines.append(line)
    
    if not data_lines:
        raise ValueError("No data lines found in HTML file")
    
    print(f"✅ Found {len(data_lines)} data lines")
    print(f"✅ Found {len(param_definitions)} parameter definitions")
    
    # Parse data into DataFrame
    # Format: YEAR DOY HR param1 param2 param3 ...
    all_rows = []
    
    for line in data_lines:
        parts = line.split()
        if len(parts) < 3:
            continue
        
        try:
            year = int(parts[0])
            doy = int(parts[1])
            hr = int(parts[2])
            
            # Create timestamp from YEAR, DOY, HR
            # DOY (Day of Year) to date conversion
            date_str = f"{year}-{doy:03d}"
            base_date = datetime.strptime(date_str, "%Y-%j")
            timestamp = base_date.replace(hour=hr)
            
            # Extract parameter values (columns 4 onwards)
            row_data = {'timestamp': timestamp}
            
            # Map parameter numbers to values
            for i, param_num in enumerate(sorted(param_definitions.keys()), start=4):
                if i < len(parts):
                    try:
                        value = float(parts[i])
                        # Replace fill values with NaN
                        if value >= 99999.0 or value <= -99999.0:
                            value = np.nan
                        param_name = param_definitions[param_num]
                        row_data[param_name] = value
                    except (ValueError, IndexError):
                        row_data[param_definitions[param_num]] = np.nan
                else:
                    row_data[param_definitions[param_num]] = np.nan
            
            all_rows.append(row_data)
            
        except (ValueError, IndexError) as e:
            continue
    
    if not all_rows:
        raise ValueError("No valid data rows parsed")
    
    df = pd.DataFrame(all_rows)
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Map parameter names to our internal names
    column_mapping = {
        'Scalar': 'bt',
        'Vector': 'bt',
        'BX,': 'bx_gsm',
        'BY,': 'by_gsm',
        'BZ,': 'bz_gsm',
        'SW': 'speed',  # SW Plasma Speed
        'Proton': 'density',  # SW Proton Density
        'Plasma': 'temperature',  # SW Plasma Temperature
        'Alpha/Prot.': 'alpha_proton_ratio',
        'Flow': 'flow_pressure',
        'E': 'electric_field',
        'Beta': 'plasma_beta',
        'Alfen': 'alfven_mach',
        'Magnetosonic': 'magnetosonic_mach',
        'Kp': 'kp',
        'R': 'sunspot_number',
        'Dst-index,': 'dst',
        'ap_index,': 'ap',
        'AE-index,': 'ae',
        'AL-index,': 'al',
        'AU-index,': 'au',
        'f10.7_index': 'f10_7',
        'Proton': 'proton_flux_1mev',  # Will need to differentiate
    }
    
    print(f"✅ Parsed {len(df)} rows with {len(df.columns)} columns")
    print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    return df


if __name__ == "__main__":
    html_file = "downloads/OMNIWeb Results.html"
    
    if not Path(html_file).exists():
        print(f"❌ File not found: {html_file}")
        exit(1)
    
    print(f"📥 Parsing {html_file}...")
    df = parse_omni_html_file(html_file)
    
    print(f"\n✅ Successfully parsed!")
    print(f"   Rows: {len(df)}")
    print(f"   Columns: {len(df.columns)}")
    print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # Save to CSV
    output_file = "downloads/omni_parsed.csv"
    df.to_csv(output_file, index=False)
    print(f"\n💾 Saved to: {output_file}")
    
    # Show sample
    print(f"\n📊 Sample data (first 5 rows):")
    print(df.head())









