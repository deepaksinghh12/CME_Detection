"""Test the specific file that's failing"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))
sys.path.insert(0, str(Path(__file__).parent))

from scripts.halo_cme_detector import HaloCMEDetector
from scripts.swis_data_loader import SWISDataLoader
import pandas as pd
from datetime import datetime, timedelta

# Test the specific file
cdf_file = Path(__file__).parent / 'downloads' / 'AL1_ASW91_L2_BLK_20251110_UNP_9999_999999_V02.cdf'

print(f"Testing file: {cdf_file.name}")

loader = SWISDataLoader()
detector = HaloCMEDetector()
detector.load_cme_catalog()

swis_data = loader.load_cdf_file(str(cdf_file))
print(f"Loaded: {len(swis_data)} rows")
print(f"Index type: {type(swis_data.index)}")
print(f"Is DatetimeIndex: {isinstance(swis_data.index, pd.DatetimeIndex)}")

processed_data = loader.preprocess_for_analysis(swis_data)
print(f"Processed: {len(processed_data)} rows")
print(f"Processed index type: {type(processed_data.index)}")
print(f"Processed has timestamp col: {'timestamp' in processed_data.columns}")

features = detector.extract_ml_features(processed_data)
print(f"Features: {len(features)} rows, {len(features.columns)} cols")
print(f"Features has timestamp: {'timestamp' in features.columns}")
if 'timestamp' in features.columns:
    print(f"First timestamp type: {type(features['timestamp'].iloc[0])}")
    print(f"First timestamp value: {features['timestamp'].iloc[0]}")

ml_predictions = detector.predict_cme_events(features)
print(f"Predictions: {len(ml_predictions)}")

# Test timestamp extraction like in main.py
test_count = 0
for i, prediction in enumerate(ml_predictions):
    if prediction['probability'] > 0.2:
        test_count += 1
        if test_count > 3:
            break
        event_idx = int(prediction['event_index'])
        print(f"\nPrediction {i+1}: idx={event_idx}, prob={prediction['probability']:.3f}")
        
        # Try to get timestamp from features
        event_time = None
        if 'timestamp' in features.columns and event_idx < len(features):
            timestamp_val = features.iloc[event_idx]['timestamp']
            print(f"  Timestamp from features: {timestamp_val}, type: {type(timestamp_val)}")
            if pd.notna(timestamp_val):
                if isinstance(timestamp_val, (pd.Timestamp, datetime)):
                    event_time = timestamp_val
                else:
                    event_time = pd.to_datetime(timestamp_val)
        
        if event_time is None:
            print(f"  Fallback to processed_data index...")
            if isinstance(processed_data.index, pd.DatetimeIndex):
                if event_idx < len(processed_data.index):
                    event_time = processed_data.index[event_idx]
                    print(f"  Got from DatetimeIndex: {event_time}, type: {type(event_time)}")
        
        if event_time is None:
            print(f"  Final fallback - using current time")
            event_time = datetime.now()
        
        # Test isoformat
        try:
            if isinstance(event_time, (pd.Timestamp, datetime)):
                iso_str = event_time.isoformat()
                print(f"  SUCCESS: ISO format = {iso_str}")
            elif hasattr(event_time, 'isoformat'):
                iso_str = event_time.isoformat()
                print(f"  SUCCESS: ISO format (hasattr) = {iso_str}")
            else:
                print(f"  ERROR: event_time is not datetime! Type: {type(event_time)}, Value: {event_time}")
        except Exception as e:
            print(f"  ERROR in isoformat: {e}")

