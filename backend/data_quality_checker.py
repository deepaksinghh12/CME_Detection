#!/usr/bin/env python3
"""
Data Quality Checker - Identifies and handles fill values, missing data, and data quality issues
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional

class DataQualityChecker:
    """
    Identifies fill values, missing data, and provides quality scores for OMNIWeb data.
    """
    
    # OMNIWeb fill values (common patterns)
    FILL_VALUES = {
        'omniweb': {
            'high': [99999.99, 999999.99, 9999999.0, 999.9, 9999.9],
            'low': [-99999.99, -999999.99, -9999999.0, -999.9, -9999.9],
            'extreme': lambda x: abs(x) > 9e4,  # Values > 90000
        },
        'noaa': {
            'high': [999.9, 9999.9],
            'low': [-999.9, -9999.9],
        }
    }
    
    # Physical limits for validation
    PHYSICAL_LIMITS = {
        'speed': (100, 2000),  # km/s
        'density': (0.1, 100),  # cm^-3
        'temperature': (1000, 1e6),  # K
        'bt': (0, 100),  # nT
        'bz_gsm': (-100, 100),  # nT
        'kp': (0, 9),  # Kp index
        'dst': (-500, 100),  # nT
        'ap': (0, 400),  # nT
        'f10_7': (50, 300),  # sfu
    }
    
    @staticmethod
    def identify_fill_values(df: pd.DataFrame, source: str = 'omniweb') -> pd.DataFrame:
        """
        Identify and mark fill values in DataFrame.
        
        Returns DataFrame with additional '_is_fill' columns for each parameter.
        """
        df = df.copy()
        fill_config = DataQualityChecker.FILL_VALUES.get(source, DataQualityChecker.FILL_VALUES['omniweb'])
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if col == 'timestamp':
                continue
            
            fill_mask = pd.Series(False, index=df.index)
            
            # Check high fill values
            for fill_val in fill_config['high']:
                fill_mask |= (df[col] == fill_val)
            
            # Check low fill values
            for fill_val in fill_config['low']:
                fill_mask |= (df[col] == fill_val)
            
            # Check extreme values
            if callable(fill_config['extreme']):
                fill_mask |= df[col].apply(fill_config['extreme'])
            
            # Mark fill values
            df[f'{col}_is_fill'] = fill_mask
            
            # Replace fill values with NaN
            df.loc[fill_mask, col] = np.nan
        
        return df
    
    @staticmethod
    def calculate_quality_score(df: pd.DataFrame, parameters: Optional[List[str]] = None) -> Dict:
        """
        Calculate data quality score for each row.
        
        Returns dict with:
        - quality_score: 0.0 to 1.0 (1.0 = perfect, 0.0 = all missing)
        - missing_count: Number of missing parameters
        - fill_count: Number of fill values
        - valid_count: Number of valid parameters
        """
        if parameters is None:
            parameters = [col for col in df.columns if col not in ['timestamp'] and not col.endswith('_is_fill')]
        
        quality_scores = []
        missing_counts = []
        fill_counts = []
        valid_counts = []
        
        for idx in df.index:
            missing = 0
            fill = 0
            valid = 0
            
            for param in parameters:
                if param not in df.columns:
                    missing += 1
                    continue
                
                # Check if fill value
                fill_col = f'{param}_is_fill'
                if fill_col in df.columns and df.loc[idx, fill_col]:
                    fill += 1
                elif pd.isna(df.loc[idx, param]):
                    missing += 1
                else:
                    valid += 1
            
            total = len(parameters)
            quality_score = valid / total if total > 0 else 0.0
            
            quality_scores.append(quality_score)
            missing_counts.append(missing)
            fill_counts.append(fill)
            valid_counts.append(valid)
        
        return {
            'quality_score': quality_scores,
            'missing_count': missing_counts,
            'fill_count': fill_counts,
            'valid_count': valid_counts,
        }
    
    @staticmethod
    def validate_physical_limits(df: pd.DataFrame) -> pd.DataFrame:
        """
        Validate data against physical limits and mark outliers.
        
        Returns DataFrame with additional '_is_outlier' columns.
        """
        df = df.copy()
        
        for param, (min_val, max_val) in DataQualityChecker.PHYSICAL_LIMITS.items():
            if param not in df.columns:
                continue
            
            # Mark outliers
            outlier_mask = (df[param] < min_val) | (df[param] > max_val)
            df[f'{param}_is_outlier'] = outlier_mask
            
            # Replace outliers with NaN
            df.loc[outlier_mask, param] = np.nan
        
        return df
    
    @staticmethod
    def get_quality_summary(df: pd.DataFrame) -> Dict:
        """
        Get overall quality summary for the dataset.
        """
        numeric_cols = [col for col in df.columns if col not in ['timestamp'] and not col.endswith('_is_fill') and not col.endswith('_is_outlier')]
        
        summary = {
            'total_rows': len(df),
            'total_parameters': len(numeric_cols),
            'parameters': {}
        }
        
        for col in numeric_cols:
            total = len(df)
            missing = df[col].isna().sum()
            fill_col = f'{col}_is_fill'
            fill = df[fill_col].sum() if fill_col in df.columns else 0
            valid = total - missing - fill
            
            summary['parameters'][col] = {
                'total': total,
                'valid': valid,
                'missing': missing,
                'fill': fill,
                'valid_percentage': (valid / total * 100) if total > 0 else 0.0,
            }
        
        return summary









