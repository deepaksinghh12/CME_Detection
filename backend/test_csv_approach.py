#!/usr/bin/env python3
"""Test CSV/pre-combined file approach"""
from omniweb_data_fetcher import OMNIWebDataFetcher
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)

print('\n' + '='*70)
print('TESTING PRE-COMBINED FILE APPROACH (with CGI API fallback)')
print('='*70)

fetcher = OMNIWebDataFetcher()

# Test with recent date
df = fetcher.get_cme_relevant_data(datetime(2023, 10, 1), datetime(2023, 10, 5))

print(f'\n✅ Result: {len(df)} rows, {len(df.columns)} columns')
print(f'\n📊 Parameters with data:')
fetched = []
for col in sorted(df.columns):
    if col != 'timestamp':
        non_null = df[col].notna().sum()
        if non_null > 0:
            fetched.append(col)
            pct = (non_null / len(df)) * 100
            print(f'  {col:30s} - {non_null:3d}/{len(df)} ({pct:5.1f}%)')

print(f'\n✅ Total: {len(fetched)} parameters successfully fetched')
print('='*70)
print('\nNote: If pre-combined files are not available, system automatically')
print('      falls back to CGI API multi-request approach.')
print('='*70)









