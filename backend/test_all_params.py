#!/usr/bin/env python3
"""Test fetching all OMNIWeb parameters"""
from omniweb_data_fetcher import OMNIWebDataFetcher
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)

fetcher = OMNIWebDataFetcher()
df = fetcher.get_cme_relevant_data(datetime(2023, 10, 1), datetime(2023, 10, 5))

print('\n' + '='*70)
print('ALL PARAMETERS FETCH TEST')
print('='*70)
print(f'Total columns: {len(df.columns)}')
print(f'Total data points: {len(df)}')
print('\n✅ Successfully Fetched Parameters:')
print('-'*70)

fetched = []
for col in sorted(df.columns):
    if col != 'timestamp':
        non_null = df[col].notna().sum()
        pct = (non_null / len(df)) * 100
        if non_null > 0:
            fetched.append(col)
            min_val = df[col].min()
            max_val = df[col].max()
            print(f'  {col:30s} - {non_null:3d}/{len(df)} ({pct:5.1f}%) - Range: {min_val:10.2f} to {max_val:10.2f}')

print(f'\n✅ Total: {len(fetched)} parameters successfully fetched')
print('='*70)









