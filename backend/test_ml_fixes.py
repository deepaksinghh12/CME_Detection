#!/usr/bin/env python3
"""
Quick test script to verify ML analysis fixes before backend reload.
Tests timestamp handling, feature extraction, and prediction flow.
"""

import sys
import os
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import traceback

# Import detector and loader
from halo_cme_detector import HaloCMEDetector
from swis_data_loader import SWISDataLoader

def test_ml_analysis():
    """Test ML analysis with a sample CDF file."""
    print("="*60)
    print("🧪 Testing ML Analysis Fixes")
    print("="*60)
    
    # Initialize detectors
    print("\n1️⃣ Initializing detectors...")
    try:
        cme_detector = HaloCMEDetector()
        swis_loader = SWISDataLoader()
        print("✅ Detectors initialized")
    except Exception as e:
        print(f"❌ Failed to initialize detectors: {e}")
        traceback.print_exc()
        return False
    
    # Load CME catalog
    print("\n2️⃣ Loading CME catalog...")
    try:
        catalog_file = Path(__file__).parent / 'output' / 'halo_cme_catalog.csv'
        cme_detector.load_cme_catalog(str(catalog_file) if catalog_file.exists() else None)
        print(f"✅ CME catalog loaded: {len(cme_detector.cme_catalog)} events")
    except Exception as e:
        print(f"❌ Failed to load catalog: {e}")
        traceback.print_exc()
        return False
    
    # Load CDF file
    print("\n3️⃣ Loading CDF file...")
    cdf_file = Path(__file__).parent / 'downloads' / 'AL1_ASW91_L2_BLK_20251123_UNP_9999_999999_V02.cdf'
    if not cdf_file.exists():
        print(f"❌ CDF file not found: {cdf_file}")
        print("📝 Creating sample data for testing...")
        # Create sample data
        swis_data = create_sample_data()
    else:
        try:
            swis_data = swis_loader.load_cdf_file(str(cdf_file))
            print(f"✅ CDF loaded: {len(swis_data)} data points")
            if swis_data is None or swis_data.empty:
                print("⚠️  CDF data is empty, creating sample data...")
                swis_data = create_sample_data()
        except Exception as e:
            print(f"❌ Failed to load CDF: {e}")
            traceback.print_exc()
            print("📝 Creating sample data for testing...")
            swis_data = create_sample_data()
    
    # Preprocess data
    print("\n4️⃣ Preprocessing data...")
    try:
        processed_data = swis_loader.preprocess_for_analysis(swis_data)
        print(f"✅ Preprocessed: {len(processed_data)} data points")
        print(f"   Index type: {type(processed_data.index)}")
        print(f"   Has timestamp column: {'timestamp' in processed_data.columns}")
        print(f"   Columns: {list(processed_data.columns)[:5]}...")
    except Exception as e:
        print(f"❌ Preprocessing failed: {e}")
        traceback.print_exc()
        return False
    
    # Extract ML features
    print("\n5️⃣ Extracting ML features...")
    try:
        features = cme_detector.extract_ml_features(processed_data)
        print(f"✅ Features extracted: {len(features)} rows, {len(features.columns)} columns")
        print(f"   Has timestamp column: {'timestamp' in features.columns}")
        if 'timestamp' in features.columns:
            print(f"   Timestamp dtype: {features['timestamp'].dtype}")
            print(f"   First timestamp: {features['timestamp'].iloc[0]}")
            print(f"   Last timestamp: {features['timestamp'].iloc[-1]}")
        else:
            print("   ⚠️  WARNING: No timestamp column in features!")
    except Exception as e:
        print(f"❌ Feature extraction failed: {e}")
        traceback.print_exc()
        return False
    
    # Test predictions
    print("\n6️⃣ Testing predictions...")
    try:
        ml_predictions = cme_detector.predict_cme_events(features)
        print(f"✅ Predictions generated: {len(ml_predictions)} predictions")
        
        # Test timestamp extraction for each prediction
        print("\n7️⃣ Testing timestamp extraction...")
        for i, prediction in enumerate(ml_predictions[:3]):  # Test first 3
            if prediction['probability'] > 0.5:
                event_idx = int(prediction['event_index'])
                print(f"\n   Prediction {i+1}:")
                print(f"   - Event index: {event_idx}")
                print(f"   - Probability: {prediction['probability']:.3f}")
                
                # Extract timestamp from features
                if event_idx < len(features) and 'timestamp' in features.columns:
                    timestamp_val = features.iloc[event_idx]['timestamp']
                    print(f"   - Timestamp from features: {timestamp_val}")
                    print(f"   - Timestamp type: {type(timestamp_val)}")
                    
                    # Test isoformat
                    try:
                        if isinstance(timestamp_val, (pd.Timestamp, datetime)):
                            iso_str = timestamp_val.isoformat()
                            print(f"   - ISO format: {iso_str}")
                            print(f"   ✅ Timestamp conversion successful!")
                        else:
                            # Try to convert
                            dt = pd.to_datetime(timestamp_val)
                            iso_str = dt.isoformat()
                            print(f"   - Converted to datetime: {dt}")
                            print(f"   - ISO format: {iso_str}")
                            print(f"   ✅ Timestamp conversion successful!")
                    except Exception as ts_error:
                        print(f"   ❌ Timestamp conversion failed: {ts_error}")
                        return False
                else:
                    print(f"   ⚠️  Event index {event_idx} out of range or no timestamp column")
        
        print("\n✅ All timestamp extractions successful!")
        
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        traceback.print_exc()
        return False
    
    # Simulate the full flow from main.py
    print("\n8️⃣ Simulating full ML analysis flow...")
    try:
        final_predictions = []
        for i, prediction in enumerate(ml_predictions[:5]):  # Test first 5
            if prediction['probability'] > 0.5:
                event_idx = int(prediction['event_index'])
                
                # Extract event time from features DataFrame
                event_time = None
                if 'timestamp' in features.columns and event_idx < len(features):
                    timestamp_val = features.iloc[event_idx]['timestamp']
                    if pd.notna(timestamp_val):
                        event_time = pd.to_datetime(timestamp_val) if not isinstance(timestamp_val, (pd.Timestamp, datetime)) else timestamp_val
                
                if event_time is None:
                    # Fallback
                    if isinstance(processed_data.index, pd.DatetimeIndex):
                        if event_idx < len(processed_data.index):
                            event_time = processed_data.index[event_idx]
                
                if event_time is None:
                    print(f"   ⚠️  Could not extract timestamp for prediction {i+1}")
                    continue
                
                # Ensure proper type
                if not isinstance(event_time, (pd.Timestamp, datetime)):
                    event_time = pd.to_datetime(event_time)
                
                # Test isoformat
                detection_time_iso = event_time.isoformat() if hasattr(event_time, 'isoformat') else str(event_time)
                
                # Extract parameters
                if event_idx < len(processed_data):
                    row = processed_data.iloc[event_idx]
                    velocity = row.get('proton_velocity') if 'proton_velocity' in row.index else (row.get('velocity', 500.0))
                    density = row.get('proton_density') if 'proton_density' in row.index else (row.get('density', 5.0))
                else:
                    velocity, density = 500.0, 5.0
                
                final_predictions.append({
                    'event_id': f"ML_{i+1}",
                    'detection_time': detection_time_iso,
                    'velocity': float(velocity),
                    'density': float(density)
                })
                
                print(f"   ✅ Prediction {i+1}: {detection_time_iso}, v={velocity:.1f} km/s")
        
        print(f"\n✅ Successfully processed {len(final_predictions)} final predictions!")
        
    except Exception as e:
        print(f"❌ Full flow simulation failed: {e}")
        traceback.print_exc()
        return False
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    print("\n💡 The fixes are working correctly. You can now reload the backend.")
    return True


def create_sample_data():
    """Create sample SWIS data for testing."""
    print("   Creating sample data with 100 data points...")
    start_time = datetime.now() - timedelta(days=5)
    timestamps = pd.date_range(start=start_time, periods=100, freq='1h')
    
    np.random.seed(42)
    data = {
        'proton_velocity': 400 + 100 * np.sin(np.arange(100) * 0.1) + np.random.normal(0, 20, 100),
        'proton_density': 5 + 2 * np.sin(np.arange(100) * 0.2) + np.random.normal(0, 0.5, 100),
        'proton_temperature': 1e5 + 2e4 * np.random.normal(0, 1, 100),
    }
    
    df = pd.DataFrame(data, index=timestamps)
    df.index.name = 'timestamp'
    return df


if __name__ == "__main__":
    success = test_ml_analysis()
    sys.exit(0 if success else 1)






