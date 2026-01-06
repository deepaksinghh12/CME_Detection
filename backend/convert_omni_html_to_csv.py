#!/usr/bin/env python3
"""
Convert OMNIWeb Results_2.html to CSV file
This will be used as the primary data source instead of online fetching
"""
import pandas as pd
import numpy as np
from datetime import datetime
import re
from pathlib import Path

def parse_omni_html_to_csv(html_file_path: str, output_csv_path: str):
    """
    Parse OMNIWeb HTML file and convert to CSV.
    """
    print(f"📥 Reading HTML file: {html_file_path}")
    
    with open(html_file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract data from <pre> tag
    pre_match = re.search(r'<pre>(.*?)</pre>', content, re.DOTALL)
    if not pre_match:
        raise ValueError("Could not find <pre> tag in HTML file")
    
    pre_content = pre_match.group(1)
    lines = pre_content.split('\n')
    
    # Find header line
    header_line_idx = None
    format_type = None
    
    for i, line in enumerate(lines):
        if line.strip().startswith('YEAR') and 'DOY' in line and 'HR' in line:
            header_line_idx = i
            # Detect format
            if '26' in line or '25' in line:
                format_type = 'reduced'  # 26 parameters
            else:
                format_type = 'full'  # 40 parameters
            break
    
    if header_line_idx is None:
        raise ValueError("Could not find header line in HTML file")
    
    print(f"✅ Detected format: {format_type} ({'26' if format_type == 'reduced' else '40'} parameters)")
    
    # Parse data lines
    data_lines = []
    for line in lines[header_line_idx + 1:]:
        line = line.strip()
        if line and re.match(r'^\d{4}\s+\d+\s+\d+', line):
            data_lines.append(line)
    
    print(f"✅ Found {len(data_lines)} data lines")
    
    # Parse into DataFrame
    all_rows = []
    for idx, line in enumerate(data_lines):
        if (idx + 1) % 10000 == 0:
            print(f"   Processing row {idx + 1}/{len(data_lines)}...")
        
        parts = line.split()
        if len(parts) < 3:
            continue
        
        try:
            year = int(parts[0])
            doy = int(parts[1])
            hr = int(parts[2])
            
            # Create timestamp
            date_str = f"{year}-{doy:03d}"
            base_date = datetime.strptime(date_str, "%Y-%j")
            timestamp = base_date.replace(hour=hr)
            
            row_data = {'timestamp': timestamp}
            
            # Column mapping based on format
            if format_type == 'reduced':
                # New format: 26 parameters
                # Data: 2010   1  0   3.0   3.0  17.4  89.8   0.0   2.8   0.9   2.5   1.6   36035.   3.7  283.   1.9  -2.2  0  18     5   0  72.7 999999.99 99999.99 99999.99     0.24     0.13     0.11 -1
                col_mapping = {
                    4: 'bt',  # Vector B Magnitude
                    5: 'imf_latitude',  # Lat. Angle
                    6: 'imf_longitude',  # Long. Angle
                    7: 'bx_gsm',  # BX
                    8: 'by_gsm',  # BY GSE
                    9: 'bz_gse',  # BZ GSE
                    10: 'by_gsm',  # BY GSM (overwrites)
                    11: 'bz_gsm',  # BZ GSM
                    12: 'temperature',  # SW Plasma Temperature
                    13: 'density',  # SW Proton Density
                    14: 'speed',  # SW Plasma Speed
                    15: 'flow_longitude',  # Flow long
                    16: 'flow_latitude',  # Flow lat
                    17: 'kp',  # Kp index
                    18: 'sunspot_number',  # R Sunspot
                    19: 'dst',  # Dst-index
                    20: 'ap',  # ap_index
                    21: 'f10_7',  # f10.7_index
                    22: 'proton_flux_1mev',  # Proton flux >1 Mev
                    23: 'proton_flux_2mev',  # Proton flux >2 Mev
                    24: 'proton_flux_4mev',  # Proton flux >4 Mev
                    25: 'proton_flux_10mev',  # Proton flux >10 Mev
                    26: 'proton_flux_30mev',  # Proton flux >30 Mev
                    27: 'proton_flux_60mev',  # Proton flux >60 Mev
                }
            else:
                # Original format: 40 parameters
                col_mapping = {
                    4: 'bt',  # Vector B Magnitude
                    5: 'imf_latitude',  # Lat. Angle
                    6: 'imf_longitude',  # Long. Angle
                    7: 'bx_gsm',  # BX
                    8: 'by_gsm',  # BY GSE
                    9: 'bz_gse',  # BZ GSE
                    10: 'by_gsm',  # BY GSM
                    11: 'bz_gsm',  # BZ GSM
                    17: 'temperature',  # SW Plasma Temperature
                    18: 'density',  # SW Proton Density
                    19: 'speed',  # SW Plasma Speed
                    20: 'flow_longitude',  # Flow long
                    21: 'flow_latitude',  # Flow lat
                    22: 'alpha_proton_ratio',  # Alpha/Prot ratio
                    23: 'flow_pressure',  # Flow pressure
                    24: 'electric_field',  # E electric field
                    25: 'plasma_beta',  # Plasma Beta
                    26: 'alfven_mach',  # Alfven mach
                    27: 'magnetosonic_mach',  # Magnetosonic
                    29: 'kp',  # Kp index
                    30: 'sunspot_number',  # R Sunspot
                    31: 'dst',  # Dst-index
                    32: 'ap',  # ap_index
                    33: 'f10_7',  # f10.7_index
                    34: 'ae',  # AE-index
                    35: 'al',  # AL-index
                    36: 'au',  # AU-index
                    37: 'proton_flux_1mev',  # Proton flux >1 Mev
                    38: 'proton_flux_2mev',  # Proton flux >2 Mev
                    39: 'proton_flux_4mev',  # Proton flux >4 Mev
                    40: 'proton_flux_10mev',  # Proton flux >10 Mev
                    41: 'proton_flux_30mev',  # Proton flux >30 Mev
                    42: 'proton_flux_60mev',  # Proton flux >60 Mev
                }
            
            for col_idx, param_name in col_mapping.items():
                if col_idx < len(parts):
                    try:
                        value = float(parts[col_idx])
                        # Replace fill values with NaN (comprehensive check)
                        fill_values = [999.9, 99999.9, 999999.99, 9999999.0, -999.9, -99999.9, -999999.99, -9999999.0]
                        if value in fill_values or abs(value) > 9e4:
                            value = np.nan
                        # Additional physical limits check
                        elif 'speed' in param_name and (value < 100 or value > 2000):
                            value = np.nan  # Speed should be 100-2000 km/s
                        elif 'density' in param_name and (value < 0.1 or value > 100):
                            value = np.nan  # Density should be 0.1-100 cm^-3
                        elif 'temperature' in param_name and (value < 1000 or value > 1e6):
                            value = np.nan  # Temperature should be 1000-1e6 K
                        row_data[param_name] = value
                    except (ValueError, IndexError):
                        row_data[param_name] = np.nan
                else:
                    row_data[param_name] = np.nan
            
            all_rows.append(row_data)
            
        except (ValueError, IndexError) as e:
            continue
    
    if not all_rows:
        raise ValueError("No valid data rows parsed")
    
    print(f"✅ Parsed {len(all_rows)} rows")
    
    # Create DataFrame
    df = pd.DataFrame(all_rows)
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    print(f"✅ Created DataFrame: {len(df)} rows, {len(df.columns)} columns")
    print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # Save to CSV
    output_path = Path(output_csv_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"💾 Saving to CSV: {output_csv_path}")
    df.to_csv(output_csv_path, index=False)
    
    print(f"\n🎉 Successfully converted HTML to CSV!")
    print(f"   File: {output_csv_path}")
    print(f"   Size: {output_path.stat().st_size / (1024*1024):.2f} MB")
    print(f"   Rows: {len(df)}")
    print(f"   Columns: {len(df.columns)}")
    
    return df


if __name__ == "__main__":
    html_file = "downloads/OMNIWeb Results_2.html"
    csv_file = "downloads/omni_complete_data.csv"
    
    if not Path(html_file).exists():
        print(f"❌ File not found: {html_file}")
        exit(1)
    
    print("="*70)
    print("CONVERTING OMNI HTML TO CSV")
    print("="*70)
    
    df = parse_omni_html_to_csv(html_file, csv_file)
    
    print("\n" + "="*70)
    print("✅ CONVERSION COMPLETE!")
    print("="*70)
    print(f"\nNow you can use: {csv_file}")
    print("The system will automatically use this CSV file instead of fetching online!")

