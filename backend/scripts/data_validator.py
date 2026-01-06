#!/usr/bin/env python3
"""
Data Validation Module
=====================

Comprehensive utilities for validating SWIS data quality, CME catalog integrity,
and real-time data verification.
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import requests
import json

logger = logging.getLogger(__name__)

class DataValidator:
    """Comprehensive validator for SWIS and CME catalog data with real-time verification."""
    
    def __init__(self):
        self.validation_config = {
            'swis_params': ['proton_velocity', 'proton_density', 'proton_temperature', 'proton_flux'],
            'cme_params': ['datetime', 'velocity', 'angular_width', 'central_pa'],
            'time_gap_threshold_minutes': 10,
            'completeness_threshold': 0.7,
            'velocity_range': (0, 3000),  # km/s
            'density_range': (0, 200),    # particles/cm³
            'temperature_range': (0, 2000000)  # K
        }
    
    def validate_real_data_source(self, source_name: str, data: Dict) -> Dict:
        """Validate that data is real and not hardcoded/synthetic."""
        validation_result = {
            'source': source_name,
            'is_real_data': False,
            'data_freshness': None,
            'data_variability': None,
            'timestamp_validation': None,
            'issues': [],
            'confidence_score': 0.0
        }
        
        try:
            if source_name.lower() == 'issdc':
                validation_result = self._validate_issdc_data(data, validation_result)
            elif source_name.lower() == 'cactus':
                validation_result = self._validate_cactus_data(data, validation_result)
            elif source_name.lower() == 'nasa_spdf':
                validation_result = self._validate_nasa_spdf_data(data, validation_result)
            
            # Calculate overall confidence score
            validation_result['confidence_score'] = self._calculate_confidence_score(validation_result)
            
        except Exception as e:
            validation_result['issues'].append(f"Validation error: {str(e)}")
            logger.error(f"Error validating {source_name} data: {e}")
        
        return validation_result
    
    def _validate_issdc_data(self, data: Dict, validation_result: Dict) -> Dict:
        """Validate ISSDC/SWIS data for authenticity."""
        if not data:
            validation_result['issues'].append("No data received from ISSDC")
            return validation_result
        
        # Check for timestamp freshness
        if 'timestamp' in data:
            try:
                data_time = pd.to_datetime(data['timestamp'])
                now = datetime.now()
                time_diff = now - data_time
                
                validation_result['data_freshness'] = {
                    'data_timestamp': data_time,
                    'age_hours': time_diff.total_seconds() / 3600,
                    'is_recent': time_diff < timedelta(hours=24)
                }
                
                # Real SWIS data should be within reasonable time range
                if time_diff > timedelta(days=30):
                    validation_result['issues'].append("Data timestamp is too old")
                elif time_diff < timedelta(minutes=1):
                    validation_result['issues'].append("Data timestamp is suspiciously fresh (possible synthetic)")
                
            except Exception as e:
                validation_result['issues'].append(f"Invalid timestamp format: {e}")
        
        # Check data variability (real data should have natural variations)
        if 'solar_wind_data' in data:
            sw_data = data['solar_wind_data']
            validation_result['data_variability'] = self._check_data_variability(sw_data)
            
            if validation_result['data_variability']['is_too_uniform']:
                validation_result['issues'].append("Data shows unnatural uniformity (possible synthetic)")
        
        # Check for realistic parameter ranges
        param_validation = self._validate_parameter_ranges(data)
        if param_validation['has_issues']:
            validation_result['issues'].extend(param_validation['issues'])
        
        # Data is considered real if it passes most checks
        validation_result['is_real_data'] = len(validation_result['issues']) <= 1
        
        return validation_result
    
    def _validate_cactus_data(self, data: Dict, validation_result: Dict) -> Dict:
        """Validate CACTUS CME data for authenticity."""
        if not data or 'cme_events' not in data:
            validation_result['issues'].append("No CME events data received from CACTUS")
            return validation_result
        
        cme_events = data['cme_events']
        
        # Check for realistic CME event patterns
        if len(cme_events) > 0:
            # Check timestamp distribution
            timestamps = [event.get('datetime') for event in cme_events if event.get('datetime')]
            if timestamps:
                validation_result['timestamp_validation'] = self._validate_cme_timestamps(timestamps)
            
            # Check velocity distribution
            velocities = [event.get('velocity') for event in cme_events if event.get('velocity')]
            if velocities:
                vel_stats = {
                    'mean': np.mean(velocities),
                    'std': np.std(velocities),
                    'range': (min(velocities), max(velocities))
                }
                
                # Real CME velocities should follow known patterns
                if vel_stats['mean'] < 200 or vel_stats['mean'] > 2000:
                    validation_result['issues'].append("CME velocity distribution is unrealistic")
                
                if vel_stats['std'] < 50:
                    validation_result['issues'].append("CME velocities show too little variation")
        
        validation_result['is_real_data'] = len(validation_result['issues']) == 0
        return validation_result
    
    def _validate_nasa_spdf_data(self, data: Dict, validation_result: Dict) -> Dict:
        """Validate NASA SPDF data for authenticity."""
        if not data:
            validation_result['issues'].append("No data received from NASA SPDF")
            return validation_result
        
        # Check for CDF file characteristics
        if 'magnetic_field' in data:
            mag_data = data['magnetic_field']
            validation_result['data_variability'] = self._check_magnetic_field_variability(mag_data)
        
        validation_result['is_real_data'] = len(validation_result['issues']) == 0
        return validation_result
    
    def _check_data_variability(self, data: Dict) -> Dict:
        """Check if data shows natural variability patterns."""
        variability_result = {
            'is_too_uniform': False,
            'coefficient_of_variation': {},
            'has_natural_patterns': True
        }
        
        numeric_params = ['proton_velocity', 'proton_density', 'proton_temperature']
        
        for param in numeric_params:
            if param in data and isinstance(data[param], (list, np.ndarray)):
                values = np.array(data[param])
                if len(values) > 1:
                    cv = np.std(values) / np.mean(values) if np.mean(values) != 0 else 0
                    variability_result['coefficient_of_variation'][param] = cv
                    
                    # Real solar wind data should have some variability
                    if cv < 0.01:  # Less than 1% variation is suspicious
                        variability_result['is_too_uniform'] = True
        
        return variability_result
    
    def _check_magnetic_field_variability(self, mag_data: Dict) -> Dict:
        """Check magnetic field data for realistic patterns."""
        variability_result = {
            'is_too_uniform': False,
            'field_strength_stats': {},
            'has_natural_patterns': True
        }
        
        if 'field_magnitude' in mag_data:
            field_values = mag_data['field_magnitude']
            if isinstance(field_values, (list, np.ndarray)) and len(field_values) > 1:
                field_array = np.array(field_values)
                variability_result['field_strength_stats'] = {
                    'mean': np.mean(field_array),
                    'std': np.std(field_array),
                    'cv': np.std(field_array) / np.mean(field_array) if np.mean(field_array) != 0 else 0
                }
                
                # Magnetic field should have natural variations
                if variability_result['field_strength_stats']['cv'] < 0.05:
                    variability_result['is_too_uniform'] = True
        
        return variability_result
    
    def _validate_parameter_ranges(self, data: Dict) -> Dict:
        """Validate that parameters are within realistic ranges."""
        validation = {
            'has_issues': False,
            'issues': [],
            'parameter_checks': {}
        }
        
        # Check solar wind parameters
        if 'solar_wind_data' in data:
            sw_data = data['solar_wind_data']
            
            # Velocity check
            if 'proton_velocity' in sw_data:
                velocity = sw_data['proton_velocity']
                if isinstance(velocity, (int, float)):
                    if not (self.validation_config['velocity_range'][0] <= velocity <= self.validation_config['velocity_range'][1]):
                        validation['issues'].append(f"Velocity {velocity} km/s is outside realistic range")
                        validation['has_issues'] = True
            
            # Density check
            if 'proton_density' in sw_data:
                density = sw_data['proton_density']
                if isinstance(density, (int, float)):
                    if not (self.validation_config['density_range'][0] <= density <= self.validation_config['density_range'][1]):
                        validation['issues'].append(f"Density {density} particles/cm³ is outside realistic range")
                        validation['has_issues'] = True
            
            # Temperature check
            if 'proton_temperature' in sw_data:
                temperature = sw_data['proton_temperature']
                if isinstance(temperature, (int, float)):
                    if not (self.validation_config['temperature_range'][0] <= temperature <= self.validation_config['temperature_range'][1]):
                        validation['issues'].append(f"Temperature {temperature} K is outside realistic range")
                        validation['has_issues'] = True
        
        return validation
    
    def _validate_cme_timestamps(self, timestamps: List) -> Dict:
        """Validate CME event timestamp patterns."""
        validation = {
            'temporal_distribution': 'normal',
            'issues': []
        }
        
        try:
            # Convert to datetime objects
            dt_timestamps = [pd.to_datetime(ts) for ts in timestamps if ts]
            dt_timestamps.sort()
            
            if len(dt_timestamps) > 1:
                # Check for unrealistic clustering
                time_diffs = [(dt_timestamps[i+1] - dt_timestamps[i]).total_seconds() 
                             for i in range(len(dt_timestamps)-1)]
                
                # If all events are within a very short time span, it might be synthetic
                if all(diff < 3600 for diff in time_diffs):  # All within 1 hour
                    validation['issues'].append("CME events are unrealistically clustered in time")
                
                # Check for suspiciously regular intervals
                if len(set(time_diffs)) == 1:  # All intervals exactly the same
                    validation['issues'].append("CME events show artificial regular timing")
        
        except Exception as e:
            validation['issues'].append(f"Timestamp validation error: {e}")
        
        return validation
    
    def _calculate_confidence_score(self, validation_result: Dict) -> float:
        """Calculate confidence score for data authenticity."""
        score = 1.0
        
        # Deduct points for each issue
        issue_count = len(validation_result['issues'])
        score -= (issue_count * 0.2)
        
        # Add points for positive indicators
        if validation_result.get('data_freshness', {}).get('is_recent'):
            score += 0.1
        
        if validation_result.get('data_variability', {}).get('has_natural_patterns'):
            score += 0.1
        
        return max(0.0, min(1.0, score))  # Clamp between 0 and 1
    
    
    def validate_swis_data(self, df: pd.DataFrame) -> Dict:
        """Validate SWIS data quality and completeness."""
        validation_results = {
            'total_records': len(df),
            'time_coverage': {},
            'parameter_completeness': {},
            'data_quality_issues': [],
            'recommendations': [],
            'data_authenticity': None
        }
        
        # Time coverage validation
        if isinstance(df.index, pd.DatetimeIndex):
            validation_results['time_coverage'] = {
                'start_time': df.index.min(),
                'end_time': df.index.max(),
                'duration_days': (df.index.max() - df.index.min()).days,
                'time_gaps': self._find_time_gaps(df.index)
            }
        
        # Parameter completeness
        for param in self.validation_config['swis_params']:
            if param in df.columns:
                completeness = df[param].notna().sum() / len(df)
                validation_results['parameter_completeness'][param] = completeness
                
                if completeness < self.validation_config['completeness_threshold']:
                    validation_results['data_quality_issues'].append(
                        f"Low completeness for {param}: {completeness:.1%}"
                    )
        
        # Check for data authenticity patterns
        validation_results['data_authenticity'] = self._check_dataframe_authenticity(df)
        
        # Generate recommendations
        validation_results['recommendations'] = self._generate_recommendations(validation_results)
        
        return validation_results
    
    def _check_dataframe_authenticity(self, df: pd.DataFrame) -> Dict:
        """Check if DataFrame contains real vs synthetic data patterns."""
        authenticity_check = {
            'is_likely_real': True,
            'synthetic_indicators': [],
            'confidence': 0.8
        }
        
        # Check for unrealistic uniformity
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if col in df.columns and not df[col].isna().all():
                values = df[col].dropna()
                if len(values) > 10:
                    # Check coefficient of variation
                    cv = values.std() / values.mean() if values.mean() != 0 else 0
                    if cv < 0.005:  # Less than 0.5% variation
                        authenticity_check['synthetic_indicators'].append(
                            f"{col} shows unnatural low variation (CV: {cv:.4f})"
                        )
                    
                    # Check for repeating patterns
                    if len(values.unique()) < len(values) * 0.1:  # Less than 10% unique values
                        authenticity_check['synthetic_indicators'].append(
                            f"{col} has too many repeated values"
                        )
        
        # Check timestamp patterns
        if isinstance(df.index, pd.DatetimeIndex) and len(df) > 1:
            time_diffs = df.index.to_series().diff().dropna()
            if len(time_diffs.unique()) == 1:  # Perfectly regular intervals
                authenticity_check['synthetic_indicators'].append(
                    "Timestamps show artificial regular intervals"
                )
        
        # Update confidence based on indicators
        if authenticity_check['synthetic_indicators']:
            authenticity_check['is_likely_real'] = False
            authenticity_check['confidence'] = max(0.1, 0.8 - len(authenticity_check['synthetic_indicators']) * 0.2)
        
        return authenticity_check
    
    def generate_validation_report(self, source_name: str, validation_results: Dict) -> str:
        """Generate a human-readable validation report."""
        report = f"\n{'='*50}\n"
        report += f"DATA VALIDATION REPORT - {source_name.upper()}\n"
        report += f"{'='*50}\n"
        report += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Overall Status
        is_real = validation_results.get('is_real_data', False)
        confidence = validation_results.get('confidence_score', 0.0)
        
        status = "✅ AUTHENTIC" if is_real and confidence > 0.7 else "⚠️ SUSPICIOUS" if confidence > 0.3 else "❌ LIKELY SYNTHETIC"
        report += f"OVERALL STATUS: {status}\n"
        report += f"CONFIDENCE SCORE: {confidence:.2f}/1.00\n\n"
        
        # Data Freshness
        if 'data_freshness' in validation_results:
            freshness = validation_results['data_freshness']
            if freshness:
                report += "DATA FRESHNESS:\n"
                report += f"  • Data Timestamp: {freshness.get('data_timestamp', 'Unknown')}\n"
                report += f"  • Age: {freshness.get('age_hours', 0):.1f} hours\n"
                report += f"  • Recent: {'Yes' if freshness.get('is_recent') else 'No'}\n\n"
        
        # Data Variability
        if 'data_variability' in validation_results:
            variability = validation_results['data_variability']
            if variability:
                report += "DATA VARIABILITY:\n"
                report += f"  • Natural Patterns: {'Yes' if variability.get('has_natural_patterns') else 'No'}\n"
                report += f"  • Too Uniform: {'Yes' if variability.get('is_too_uniform') else 'No'}\n"
                
                if 'coefficient_of_variation' in variability:
                    report += "  • Coefficient of Variation:\n"
                    for param, cv in variability['coefficient_of_variation'].items():
                        report += f"    - {param}: {cv:.4f}\n"
                report += "\n"
        
        # Issues
        if validation_results.get('issues'):
            report += "IDENTIFIED ISSUES:\n"
            for i, issue in enumerate(validation_results['issues'], 1):
                report += f"  {i}. {issue}\n"
            report += "\n"
        
        # Recommendations
        if not is_real or confidence < 0.8:
            report += "RECOMMENDATIONS:\n"
            if confidence < 0.3:
                report += "  • Data appears to be synthetic or corrupted\n"
                report += "  • Verify data source configuration\n"
                report += "  • Check API endpoints and authentication\n"
            elif confidence < 0.8:
                report += "  • Data quality concerns detected\n"
                report += "  • Monitor data source for consistency\n"
                report += "  • Consider additional validation checks\n"
            
            report += "  • Review data processing pipeline\n"
            report += "  • Contact data provider if issues persist\n"
        
        report += f"\n{'='*50}\n"
        return report
    
    def validate_all_sources(self, data_sources: Dict) -> Dict:
        """Validate multiple data sources and generate comprehensive report."""
        all_validations = {}
        overall_status = {
            'total_sources': len(data_sources),
            'authentic_sources': 0,
            'suspicious_sources': 0,
            'failed_sources': 0,
            'overall_confidence': 0.0
        }
        
        confidence_scores = []
        
        for source_name, source_data in data_sources.items():
            validation = self.validate_real_data_source(source_name, source_data)
            all_validations[source_name] = validation
            
            confidence = validation.get('confidence_score', 0.0)
            confidence_scores.append(confidence)
            
            if validation.get('is_real_data') and confidence > 0.7:
                overall_status['authentic_sources'] += 1
            elif confidence > 0.3:
                overall_status['suspicious_sources'] += 1
            else:
                overall_status['failed_sources'] += 1
        
        overall_status['overall_confidence'] = np.mean(confidence_scores) if confidence_scores else 0.0
        
        return {
            'validations': all_validations,
            'summary': overall_status,
            'timestamp': datetime.now().isoformat()
        }
    
    def save_validation_report(self, validation_results: Dict, output_path: str = None):
        """Save validation results to file."""
        if output_path is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = f"validation_report_{timestamp}.json"
        
        try:
            with open(output_path, 'w') as f:
                json.dump(validation_results, f, indent=2, default=str)
            logger.info(f"Validation report saved to {output_path}")
        except Exception as e:
            logger.error(f"Failed to save validation report: {e}")
    
    def quick_data_check(self, data: Dict, source_name: str) -> bool:
        """Quick check to determine if data looks real."""
        try:
            validation = self.validate_real_data_source(source_name, data)
            return validation.get('is_real_data', False) and validation.get('confidence_score', 0) > 0.5
        except Exception as e:
            logger.error(f"Quick data check failed for {source_name}: {e}")
            return False
    
    def _find_time_gaps(self, time_index: pd.DatetimeIndex, 
                       max_gap_minutes: int = 10) -> List[Dict]:
        """Find significant time gaps in the data."""
        time_diffs = time_index.to_series().diff()
        gap_threshold = pd.Timedelta(minutes=max_gap_minutes)
        
        gaps = []
        gap_indices = time_diffs > gap_threshold
        
        for idx in time_diffs[gap_indices].index:
            gaps.append({
                'start_time': time_index[idx-1],
                'end_time': time_index[idx],
                'duration': time_diffs[idx]
            })
        
        return gaps
    
    def _generate_recommendations(self, validation_results: Dict) -> List[str]:
        """Generate data quality recommendations."""
        recommendations = []
        
        # Check completeness
        for param, completeness in validation_results['parameter_completeness'].items():
            if completeness < 0.5:
                recommendations.append(
                    f"Consider alternative data sources for {param} due to low completeness"
                )
            elif completeness < 0.8:
                recommendations.append(
                    f"Apply gap-filling techniques for {param}"
                )
        
        # Check time gaps
        if validation_results['time_coverage'].get('time_gaps'):
            gap_count = len(validation_results['time_coverage']['time_gaps'])
            recommendations.append(
                f"Address {gap_count} significant time gaps in the data"
            )
        
        return recommendations

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
