"""Quick test without emojis for Windows terminal"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))
sys.path.insert(0, str(Path(__file__).parent))

from scripts.halo_cme_detector import HaloCMEDetector
from scripts.swis_data_loader import SWISDataLoader
import pandas as pd
from datetime import datetime

# Test timestamp extraction
cdf_file = Path(__file__).parent / 'downloads' / 'AL1_ASW91_L2_BLK_20251123_UNP_9999_999999_V02.cdf'

print("Testing timestamp extraction fix...")
loader = SWISDataLoader()
detector = HaloCMEDetector()
detector.load_cme_catalog()

swis_data = loader.load_cdf_file(str(cdf_file))
processed_data = loader.preprocess_for_analysis(swis_data)
features = detector.extract_ml_features(processed_data)

# Test timestamp extraction
if 'timestamp' in features.columns:
    test_idx = 100
    timestamp_val = features.iloc[test_idx]['timestamp']
    print(f"Timestamp type: {type(timestamp_val)}")
    print(f"Timestamp value: {timestamp_val}")
    
    # Test isoformat
    if hasattr(timestamp_val, 'isoformat'):
        iso_str = timestamp_val.isoformat()
        print(f"ISO format: {iso_str}")
        print("SUCCESS: Timestamp extraction working!")
    else:
        dt = pd.to_datetime(timestamp_val)
        iso_str = dt.isoformat()
        print(f"Converted ISO format: {iso_str}")
        print("SUCCESS: Timestamp conversion working!")
else:
    print("ERROR: No timestamp column in features")






