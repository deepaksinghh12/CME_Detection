#!/usr/bin/env python3
# Script to fix main.py by removing corrupted ending

# Read the file up to line 1680 (before the corrupted section)
with open('main.py', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Find the line with "return recommendations" 
good_lines = []
for i, line in enumerate(lines):
    good_lines.append(line)
    if i >= 1682:  # Stop after line 1683 (0-indexed = 1682)
        break

# Write the clean content
with open('main_fixed.py', 'w', encoding='utf-8') as f:
    f.writelines(good_lines)
    f.write('''
def validate_cme_catalog(cme_df: pd.DataFrame) -> Dict:
    """Validate CME catalog data."""
    validation = {
        'total_events': len(cme_df),
        'date_range': {},
        'parameter_ranges': {},
        'data_quality': 'PASS'
    }
    
    if not cme_df.empty:
        validation['date_range'] = {
            'start': cme_df['datetime'].min(),
            'end': cme_df['datetime'].max()
        }
        
        # Check parameter ranges
        if 'velocity' in cme_df.columns:
            validation['parameter_ranges']['velocity'] = {
                'min': cme_df['velocity'].min(),
                'max': cme_df['velocity'].max(),
                'mean': cme_df['velocity'].mean()
            }
    
    return validation

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
''')

print("Fixed file created as main_fixed.py")
