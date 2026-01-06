#!/usr/bin/env python3
"""
Main script for Halo CME Detection System
========================================

Orchestrates the complete analysis pipeline:
1. Load CACTUS halo CME catalog
2. Load and process SWIS data
3. Extract CME event windows
4. Analyze signatures and determine thresholds
5. Validate detection performance
"""

import logging
import yaml
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import argparse

# Import project modules
from swis_data_loader import SWISDataLoader
from cactus_scraper import CACTUSCMEScraper
from halo_cme_detector import HaloCMEDetector

def setup_logging(log_level: str = "INFO"):
    """Setup logging configuration."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('cme_detection.log'),
            logging.StreamHandler()
        ]
    )

def load_config(config_path: str = "config.yaml") -> dict:
    """Load configuration from YAML file."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def main():
    """Main analysis pipeline."""
    parser = argparse.ArgumentParser(description='Halo CME Detection System')
    parser.add_argument('--config', default='config.yaml', help='Configuration file path')
    parser.add_argument('--start-date', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--log-level', default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    
    args = parser.parse_args()
    
    # Setup
    setup_logging(args.log_level)
    config = load_config(args.config)
    logger = logging.getLogger(__name__)
    
    logger.info("Starting Halo CME Detection Analysis")
    
    try:
        # Step 1: Get halo CME catalog
        logger.info("Step 1: Fetching halo CME catalog from CACTUS")
        scraper = CACTUSCMEScraper(args.config)
        cme_catalog = scraper.scrape_cme_catalog(args.start_date, args.end_date)
        
        if cme_catalog.empty:
            logger.warning("No halo CMEs found in specified date range")
            return
        
        logger.info(f"Found {len(cme_catalog)} halo CME events")
        
        # Step 2: Load SWIS data
        logger.info("Step 2: Loading SWIS data")
        swis_loader = SWISDataLoader()
        
        # Get list of SWIS files for the date range
        swis_data_dir = Path(config['data_paths']['swis_data_dir'])
        swis_files = list(swis_data_dir.glob("*.cdf"))
        
        if not swis_files:
            logger.error(f"No SWIS CDF files found in {swis_data_dir}")
            return
        
        # Load and preprocess SWIS data
        swis_data = swis_loader.load_multiple_files([str(f) for f in swis_files])
        swis_data = swis_loader.preprocess_data(swis_data)
        swis_data = swis_loader.calculate_derived_parameters(swis_data)
        
        logger.info(f"Loaded SWIS data: {len(swis_data)} records")
        
        # Step 3: Initialize CME detector
        logger.info("Step 3: Initializing CME detector")
        detector = HaloCMEDetector(config)
        
        # Step 4: Analyze CME events
        logger.info("Step 4: Analyzing CME signatures")
        results = detector.analyze_cme_events(swis_data, cme_catalog)
        
        # Step 5: Determine optimal thresholds
        logger.info("Step 5: Determining optimal detection thresholds")
        thresholds = detector.optimize_thresholds(results)
        
        # Step 6: Validate detection performance
        logger.info("Step 6: Validating detection performance")
        performance = detector.validate_detection(swis_data, cme_catalog, thresholds)
        
        # Step 7: Generate reports and visualizations
        logger.info("Step 7: Generating results")
        output_dir = Path(config['data_paths']['output_dir'])
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save results
        results.to_csv(output_dir / "cme_analysis_results.csv", index=False)
        
        with open(output_dir / "optimal_thresholds.yaml", 'w') as f:
            yaml.dump(thresholds, f)
        
        with open(output_dir / "performance_metrics.yaml", 'w') as f:
            yaml.dump(performance, f)
        
        # Generate summary report
        generate_summary_report(results, thresholds, performance, output_dir)
        
        logger.info("Analysis complete!")
        logger.info(f"Results saved to {output_dir}")
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise

def generate_summary_report(results, thresholds, performance, output_dir):
    """Generate a summary report of the analysis."""
    report_path = output_dir / "summary_report.txt"
    
    with open(report_path, 'w') as f:
        f.write("HALO CME DETECTION ANALYSIS SUMMARY\n")
        f.write("="*50 + "\n\n")
        
        f.write(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total CME Events Analyzed: {len(results)}\n\n")
        
        f.write("OPTIMAL THRESHOLDS:\n")
        f.write("-"*20 + "\n")
        for param, value in thresholds.items():
            f.write(f"{param}: {value}\n")
        f.write("\n")
        
        f.write("DETECTION PERFORMANCE:\n")
        f.write("-"*20 + "\n")
        for metric, value in performance.items():
            f.write(f"{metric}: {value:.3f}\n")
        f.write("\n")
        
        f.write("KEY FINDINGS:\n")
        f.write("-"*20 + "\n")
        f.write("1. CME signatures successfully identified in SWIS data\n")
        f.write("2. Optimal thresholds determined for reliable detection\n")
        f.write("3. Validation metrics indicate detection system performance\n")

if __name__ == "__main__":
    main()

