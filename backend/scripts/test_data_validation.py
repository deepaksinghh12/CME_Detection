#!/usr/bin/env python3
"""
Test Data Validation Script
===========================

Script to test and demonstrate data validation functionality.
This helps verify that real data is being loaded correctly.
"""

import sys
import asyncio
from datetime import datetime
import json

# Import validation modules
from data_validator import DataValidator
from real_data_sync import RealDataSynchronizer

async def test_data_validation():
    """Test data validation for all sources."""
    print("=" * 60)
    print("CME DETECTION SYSTEM - DATA VALIDATION TEST")
    print("=" * 60)
    
    from datetime import datetime, timedelta
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Initialize components
    validator = DataValidator()
    synchronizer = RealDataSynchronizer()
    
    # Test each data source
    sources = ['issdc', 'cactus', 'nasa_spdf']
    all_results = {}
    
    # Set date range for data retrieval
    end_date = datetime.now()
    start_date = end_date - timedelta(days=1)
    
    for source in sources:
        print(f"Testing {source.upper()} data source...")
        print("-" * 40)
        
        try:
            # Get data from source
            if source == 'issdc':
                result = await synchronizer.sync_issdc_data(start_date, end_date)
            elif source == 'cactus':
                result = await synchronizer.sync_cactus_data(start_date, end_date)
            elif source == 'nasa_spdf':
                result = await synchronizer.sync_nasa_spdf_data(start_date, end_date)
            
            if result['success']:
                print(f"✅ Successfully retrieved data from {source}")
                print(f"   Records: {result.get('records_processed', 'Unknown')}")
                
                # Validate data authenticity
                validation = validator.validate_real_data_source(source, result['data'])
                all_results[source] = validation
                
                # Show validation results
                is_real = validation.get('is_real_data', False)
                confidence = validation.get('confidence_score', 0.0)
                
                status = "✅ AUTHENTIC" if is_real else "⚠️ SUSPICIOUS"
                print(f"   Status: {status}")
                print(f"   Confidence: {confidence:.2f}/1.00")
                
                if validation.get('issues'):
                    print(f"   Issues found: {len(validation['issues'])}")
                    for issue in validation['issues'][:3]:  # Show first 3 issues
                        print(f"     • {issue}")
                
                # Quick authenticity check
                quick_check = validator.quick_data_check(result['data'], source)
                print(f"   Quick Check: {'PASS' if quick_check else 'FAIL'}")
                
            else:
                print(f"❌ Failed to retrieve data from {source}")
                print(f"   Error: {result.get('error', 'Unknown error')}")
                all_results[source] = {'error': result.get('error', 'Connection failed')}
            
        except Exception as e:
            print(f"❌ Exception testing {source}: {e}")
            all_results[source] = {'error': str(e)}
        
        print()
    
    # Overall assessment
    print("=" * 60)
    print("OVERALL ASSESSMENT")
    print("=" * 60)
    
    authentic_sources = sum(1 for r in all_results.values() 
                           if r.get('is_real_data', False))
    total_sources = len(all_results)
    
    print(f"Authentic Sources: {authentic_sources}/{total_sources}")
    
    if authentic_sources == total_sources:
        print("🟢 EXCELLENT: All data sources provide authentic data")
    elif authentic_sources > 0:
        print("🟡 PARTIAL: Some data sources have issues")
    else:
        print("🔴 CRITICAL: No authentic data sources detected")
    
    # Recommendations
    print("\nRECOMMENDations:")
    if authentic_sources == 0:
        print("• Check network connectivity")
        print("• Verify API credentials and endpoints")
        print("• Review data source configurations")
    elif authentic_sources < total_sources:
        print("• Investigate failing data sources")
        print("• Monitor data quality regularly")
        print("• Consider backup data sources")
    else:
        print("• Data quality looks good!")
        print("• Continue regular monitoring")
        print("• Archive validation reports for compliance")
    
    # Save detailed results
    from datetime import datetime as dt
    timestamp = dt.now().strftime('%Y%m%d_%H%M%S')
    report_file = f"validation_test_report_{timestamp}.json"
    
    try:
        with open(report_file, 'w') as f:
            json.dump({
                'test_timestamp': dt.now().isoformat(),
                'summary': {
                    'authentic_sources': authentic_sources,
                    'total_sources': total_sources,
                    'overall_status': 'healthy' if authentic_sources == total_sources else 'issues'
                },
                'detailed_results': all_results
            }, f, indent=2, default=str)
        
        print(f"\n📋 Detailed report saved to: {report_file}")
    except Exception as e:
        print(f"\n⚠️ Could not save report: {e}")
    
    return all_results

def test_synthetic_data_detection():
    """Test the validator's ability to detect synthetic/fake data."""
    print("\n" + "=" * 60)
    print("SYNTHETIC DATA DETECTION TEST")
    print("=" * 60)
    
    validator = DataValidator()
    
    # Create obviously synthetic data
    from datetime import datetime as dt
    synthetic_data = {
        'solar_wind_data': {
            'proton_velocity': 400.0,  # Constant value
            'proton_density': 5.0,     # Constant value
            'proton_temperature': 100000.0  # Constant value
        },
        'timestamp': dt.now().isoformat()
    }
    
    print("Testing with synthetic (constant) data...")
    validation = validator.validate_real_data_source('issdc', synthetic_data)
    
    print(f"Detected as real: {validation.get('is_real_data', False)}")
    print(f"Confidence score: {validation.get('confidence_score', 0.0):.2f}")
    print(f"Issues found: {len(validation.get('issues', []))}")
    
    if validation.get('issues'):
        print("Issues detected:")
        for issue in validation['issues']:
            print(f"  • {issue}")
    
    # Test with more realistic synthetic data
    print("\nTesting with more realistic synthetic data...")
    from datetime import datetime as dt
    realistic_synthetic = {
        'solar_wind_data': {
            'proton_velocity': [400.1, 400.2, 400.1, 400.2],  # Very low variation
            'proton_density': [5.01, 5.02, 5.01, 5.02],       # Repeating pattern
            'proton_temperature': [100001, 100002, 100001, 100002]  # Artificial pattern
        },
        'timestamp': dt.now().isoformat()
    }
    
    validation2 = validator.validate_real_data_source('issdc', realistic_synthetic)
    print(f"Detected as real: {validation2.get('is_real_data', False)}")
    print(f"Confidence score: {validation2.get('confidence_score', 0.0):.2f}")
    print(f"Issues found: {len(validation2.get('issues', []))}")

if __name__ == "__main__":
    print("Starting data validation tests...")
    
    # Run async tests
    try:
        results = asyncio.run(test_data_validation())
        
        # Run synthetic data detection test
        test_synthetic_data_detection()
        
        print("\n" + "=" * 60)
        print("DATA VALIDATION TESTS COMPLETED")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        import traceback
        traceback.print_exc()
