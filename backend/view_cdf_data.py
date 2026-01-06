#!/usr/bin/env python3
"""
Terminal script to view CDF file raw data + Model calculations (confidence, indicators, detection)
Usage: python view_cdf_data.py <cdf_file_path>
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime
import json

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))
sys.path.insert(0, str(Path(__file__).parent))

from scripts.swis_data_loader import SWISDataLoader
from scripts.halo_cme_detector import HaloCMEDetector

def format_value(val):
    """Format value for display (same as frontend)"""
    if pd.isna(val):
        return 'N/A'
    elif isinstance(val, (np.integer, np.floating)):
        if isinstance(val, np.integer):
            return int(val)
        else:
            # Format float with appropriate precision
            if abs(val) < 0.01:
                return f"{val:.6f}"
            elif abs(val) < 1:
                return f"{val:.4f}"
            elif abs(val) < 1000:
                return f"{val:.2f}"
            else:
                return f"{val:.1f}"
    else:
        return str(val)

def display_raw_data_table(data, max_rows=100):
    """Display raw data in table format (like frontend)"""
    if data.empty:
        print("❌ No data to display")
        return
    
    # Get sample (first max_rows)
    sample_size = min(max_rows, len(data))
    sample_df = data.head(sample_size).copy()
    
    # Ensure timestamp column
    if 'timestamp' not in sample_df.columns:
        if isinstance(sample_df.index, pd.DatetimeIndex):
            sample_df = sample_df.reset_index()
            if 'index' in sample_df.columns:
                sample_df.rename(columns={'index': 'timestamp'}, inplace=True)
        else:
            sample_df['timestamp'] = range(len(sample_df))
    
    # Format timestamps
    if 'timestamp' in sample_df.columns:
        sample_df['timestamp'] = pd.to_datetime(sample_df['timestamp'])
        sample_df['timestamp'] = sample_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"\n{'='*100}")
    print(f"📊 RAW DATA TABLE (Showing {sample_size} of {len(data)} rows)")
    print(f"{'='*100}\n")
    
    # Get column names
    columns = list(sample_df.columns)
    
    # Calculate column widths
    col_widths = {}
    for col in columns:
        col_widths[col] = max(
            len(str(col)),  # Column name length
            max([len(format_value(val)) for val in sample_df[col].head(10)]) if len(sample_df) > 0 else 0
        )
        col_widths[col] = min(col_widths[col], 20)  # Max width 20
    
    # Print header
    header = " | ".join([str(col).ljust(col_widths[col])[:20] for col in columns])
    print(header)
    print("-" * len(header))
    
    # Print rows
    for idx, row in sample_df.iterrows():
        row_str = " | ".join([
            format_value(row[col]).ljust(col_widths[col])[:20] 
            for col in columns
        ])
        print(row_str)
    
    if len(data) > sample_size:
        print(f"\n... and {len(data) - sample_size} more rows")
    
    print(f"\n{'='*100}\n")

def display_data_summary(data):
    """Display data summary (like frontend)"""
    if data.empty:
        return
    
    print(f"\n{'='*100}")
    print(f"📈 DATA SUMMARY")
    print(f"{'='*100}\n")
    
    print(f"Total Rows: {len(data)}")
    print(f"Total Columns: {len(data.columns)}")
    
    if 'timestamp' in data.columns or isinstance(data.index, pd.DatetimeIndex):
        if isinstance(data.index, pd.DatetimeIndex):
            timestamps = data.index
        else:
            timestamps = pd.to_datetime(data['timestamp'])
        
        print(f"Date Range: {timestamps.min()} to {timestamps.max()}")
    
    print(f"\nColumns: {', '.join(data.columns[:10])}")
    if len(data.columns) > 10:
        print(f"... and {len(data.columns) - 10} more columns")
    
    # Show statistics for numeric columns
    numeric_cols = data.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 0:
        print(f"\n📊 Numeric Column Statistics:")
        print("-" * 100)
        stats = data[numeric_cols].describe()
        print(stats.to_string())
    
    print(f"\n{'='*100}\n")

def view_cdf_data(cdf_path: str, max_rows: int = 100):
    """
    View CDF file raw data in terminal (same format as frontend).
    
    Parameters:
    -----------
    cdf_path : str
        Path to CDF file
    max_rows : int
        Maximum number of rows to display
    """
    cdf_file = Path(cdf_path)
    
    if not cdf_file.exists():
        print(f"❌ CDF file not found: {cdf_path}")
        return False
    
    print(f"\n{'='*100}")
    print(f"🔍 VIEWING CDF FILE: {cdf_file.name}")
    print(f"{'='*100}")
    print(f"📁 File: {cdf_file}")
    print(f"📏 Size: {cdf_file.stat().st_size / 1024:.1f} KB")
    print(f"{'='*100}\n")
    
    # Load CDF file
    try:
        print("⏳ Loading CDF file...")
        loader = SWISDataLoader()
        data = loader.load_cdf_file(str(cdf_file))
        
        if data is None or data.empty:
            print("❌ No data loaded from CDF file")
            return False
        
        print(f"✅ Loaded {len(data)} data points\n")
        
        # Display summary
        display_data_summary(data)
        
        # Display raw data table
        display_raw_data_table(data, max_rows=max_rows)
        
        # Show data quality info
        print(f"\n{'='*100}")
        print(f"🔍 DATA QUALITY")
        print(f"{'='*100}\n")
        
        total_cells = len(data) * len(data.columns)
        missing_cells = data.isna().sum().sum()
        valid_cells = total_cells - missing_cells
        coverage = (valid_cells / total_cells * 100) if total_cells > 0 else 0
        
        print(f"Total Data Points: {total_cells:,}")
        print(f"Valid Values: {valid_cells:,} ({coverage:.1f}%)")
        print(f"Missing Values: {missing_cells:,} ({100 - coverage:.1f}%)")
        
        # Show missing data per column
        missing_per_col = data.isna().sum()
        if missing_per_col.sum() > 0:
            print(f"\n⚠️  Columns with missing data:")
            for col, count in missing_per_col[missing_per_col > 0].items():
                pct = (count / len(data) * 100)
                print(f"   {col}: {count} ({pct:.1f}%)")
        
        print(f"\n{'='*100}\n")
        
        # Run CME Detection Model (same as /api/ml/analyze-cdf endpoint - uses HaloCMEDetector)
        print(f"\n{'='*100}")
        print(f"🤖 RUNNING ML-BASED CME DETECTION MODEL (HaloCMEDetector)")
        print(f"{'='*100}\n")
        
        try:
            from datetime import timedelta
            
            print("⏳ Initializing HaloCMEDetector (same as /api/ml/analyze-cdf)...")
            detector = HaloCMEDetector()
            print("✅ Detector initialized\n")
            
            # Load CME catalog (required for ML analysis - same as endpoint)
            print("⏳ Loading CME catalog...")
            try:
                detector.load_cme_catalog()
                if detector.cme_catalog is not None and not (hasattr(detector.cme_catalog, 'empty') and detector.cme_catalog.empty):
                    print(f"✅ CME catalog loaded: {len(detector.cme_catalog)} events")
                else:
                    print("⚠️  CME catalog is empty, but continuing...")
            except Exception as cat_error:
                print(f"⚠️  Warning: Could not load CME catalog: {cat_error}")
                print("   Continuing without catalog...")
            print()
            
            # Preprocess data (same as endpoint)
            print("⏳ Preprocessing data for ML analysis...")
            processed_data = loader.preprocess_for_analysis(data.copy())
            print(f"✅ Preprocessed {len(processed_data)} data points\n")
            
            # Extract ML features (same as endpoint - line 1534)
            print("⏳ Extracting ML features...")
            features = detector.extract_ml_features(processed_data)
            print(f"✅ Extracted {len(features.columns) if hasattr(features, 'columns') else 0} ML features\n")
            
            # Run ML-based CME detection (same as endpoint - line 1539)
            print("⏳ Running ML-based CME detection...")
            ml_predictions = detector.predict_cme_events(features)
            print(f"✅ ML predictions complete: {len(ml_predictions)} predictions generated\n")
            
            # Display detection summary
            print(f"{'='*100}")
            print(f"📊 ML DETECTION SUMMARY")
            print(f"{'='*100}\n")
            
            print(f"Total Data Points Analyzed: {len(processed_data):,}")
            print(f"ML Features Extracted: {len(features.columns) if hasattr(features, 'columns') else 0}")
            print(f"ML Predictions Generated: {len(ml_predictions)}")
            
            # Filter predictions with probability > 0.5 (same as endpoint)
            high_confidence_predictions = [p for p in ml_predictions if p.get('probability', 0) > 0.5]
            print(f"High Confidence Events (probability > 0.5): {len(high_confidence_predictions)}")
            
            if len(high_confidence_predictions) > 0:
                probabilities = [p.get('probability', 0) for p in high_confidence_predictions]
                confidences = [p.get('confidence', 0) for p in high_confidence_predictions if 'confidence' in p]
                
                print(f"\n📈 ML Model Statistics:")
                print(f"   Average Probability: {np.mean(probabilities):.2%}")
                print(f"   Maximum Probability: {np.max(probabilities):.2%}")
                print(f"   Minimum Probability: {np.min(probabilities):.2%}")
                if confidences:
                    print(f"   Average Confidence: {np.mean(confidences):.2%}")
            
            # Display detected events with ML details (same format as endpoint)
            if len(high_confidence_predictions) > 0:
                print(f"\n{'='*100}")
                print(f"🎯 DETECTED CME EVENTS (ML Model Output)")
                print(f"{'='*100}\n")
                
                # Sort by probability (highest first)
                sorted_predictions = sorted(high_confidence_predictions, key=lambda x: x.get('probability', 0), reverse=True)
                
                for idx, prediction in enumerate(sorted_predictions[:10]):  # Show top 10
                    print(f"\n{'─'*100}")
                    print(f"Event #{idx + 1}")
                    print(f"{'─'*100}")
                    
                    # ML Metrics
                    probability = prediction.get('probability', 0.0)
                    confidence = prediction.get('confidence', 0.8)
                    anomaly_score = prediction.get('anomaly_score', 0.5)
                    
                    print(f"🤖 ML Model Output:")
                    print(f"   Probability: {probability:.2%}")
                    print(f"   Confidence Score: {confidence:.2%}")
                    print(f"   Anomaly Score: {anomaly_score:.4f}")
                    print(f"   Detection Method: {prediction.get('detection_method', 'Hybrid Statistical + ML')}")
                    
                    # Event details
                    event_idx = int(prediction.get('event_index', 0))
                    if event_idx < len(processed_data):
                        row = processed_data.iloc[event_idx]
                        
                        # Extract parameters
                        velocity = row.get('proton_velocity') if 'proton_velocity' in row.index else (row.get('velocity') if 'velocity' in row.index else (row.get('speed') if 'speed' in row.index else None))
                        density = row.get('proton_density') if 'proton_density' in row.index else (row.get('density') if 'density' in row.index else None)
                        temperature = row.get('proton_temperature') if 'proton_temperature' in row.index else (row.get('temperature') if 'temperature' in row.index else None)
                        
                        # Extract from features if available
                        if event_idx < len(features):
                            feature_row = features.iloc[event_idx]
                            bz_gsm = feature_row.get('bz', -1.0) if 'bz' in feature_row.index else -1.0
                            bt = feature_row.get('bt', 5.0) if 'bt' in feature_row.index else 5.0
                            velocity_enhancement = feature_row.get('velocity_enhancement', 0.0) if 'velocity_enhancement' in feature_row.index else 0.0
                            density_enhancement = feature_row.get('density_enhancement', 0.0) if 'density_enhancement' in feature_row.index else 0.0
                        else:
                            bz_gsm = -1.0
                            bt = 5.0
                            velocity_enhancement = 0.0
                            density_enhancement = 0.0
                        
                        # Timestamp
                        if isinstance(processed_data.index, pd.DatetimeIndex) and event_idx < len(processed_data.index):
                            event_time = processed_data.index[event_idx]
                            event_time_str = event_time.strftime('%Y-%m-%d %H:%M:%S') if hasattr(event_time, 'strftime') else str(event_time)
                        elif 'timestamp' in processed_data.columns and event_idx < len(processed_data):
                            event_time_val = processed_data.iloc[event_idx]['timestamp']
                            if pd.notna(event_time_val):
                                event_time = pd.to_datetime(event_time_val)
                                event_time_str = event_time.strftime('%Y-%m-%d %H:%M:%S')
                            else:
                                event_time_str = "N/A"
                        else:
                            event_time_str = "N/A"
                        
                        print(f"\n⏰ Detection Time: {event_time_str}")
                        
                        # Physical Parameters
                        print(f"\n📊 Physical Parameters at Detection:")
                        if velocity is not None and pd.notna(velocity):
                            print(f"   Velocity: {format_value(velocity)} km/s")
                        if density is not None and pd.notna(density):
                            print(f"   Density: {format_value(density)} cm⁻³")
                        if temperature is not None and pd.notna(temperature):
                            print(f"   Temperature: {format_value(temperature)} K")
                        if bz_gsm is not None and pd.notna(bz_gsm):
                            print(f"   Bz (GSM): {format_value(bz_gsm)} nT")
                        if bt is not None and pd.notna(bt):
                            print(f"   Bt (Total): {format_value(bt)} nT")
                        
                        # Indicators
                        print(f"\n🔍 Detection Indicators:")
                        if velocity_enhancement > 0:
                            print(f"   Velocity Enhancement: {velocity_enhancement:.3f}")
                        if density_enhancement > 0:
                            print(f"   Density Enhancement: {density_enhancement:.3f}")
                        
                        # Triggered indicators (same logic as endpoint)
                        triggered = []
                        if velocity is not None and velocity > 500:
                            triggered.append('Velocity Enhancement')
                        if density is not None and density > 10:
                            triggered.append('Density Compression')
                        if bz_gsm < -5:
                            triggered.append('Strong Southward Bz')
                        if velocity_enhancement > 0.3:
                            triggered.append('Velocity Spike')
                        if density_enhancement > 0.5:
                            triggered.append('Density Surge')
                        
                        if triggered:
                            print(f"   Triggered Indicators: {', '.join(triggered)}")
                        
                        # Severity
                        if velocity is not None:
                            severity = 'High' if velocity > 800 or (velocity > 600 and bz_gsm < -10) else 'Medium' if velocity > 500 else 'Low'
                            print(f"\n⚠️  Severity: {severity}")
            
            if len(high_confidence_predictions) > 10:
                print(f"\n... and {len(high_confidence_predictions) - 10} more events (showing top 10 by probability)")
            
            print(f"\n{'='*100}\n")
            
        except Exception as det_error:
            print(f"❌ Error running CME detection: {det_error}")
            import traceback
            traceback.print_exc()
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading CDF file: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python view_cdf_data.py <cdf_file_path> [max_rows]")
        print("\nExample:")
        print("  python view_cdf_data.py downloads/file.cdf")
        print("  python view_cdf_data.py downloads/file.cdf 50")
        print("\nOptions:")
        print("  max_rows: Maximum number of rows to display (default: 100)")
        
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
                print(f"\n💡 Quick view: python view_cdf_data.py downloads/{cdf_files[0].name}")
        
        sys.exit(1)
    
    cdf_path = sys.argv[1]
    max_rows = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    success = view_cdf_data(cdf_path, max_rows=max_rows)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

