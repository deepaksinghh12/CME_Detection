#!/usr/bin/env python3
"""
CACTUS CME Database Scraper
==========================

Module for downloading and parsing halo CME data from CACTUS database.
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import logging
import yaml
from pathlib import Path
import time
import re

logger = logging.getLogger(__name__)

class CACTUSCMEScraper:
    """Scraper for CACTUS CME database."""
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize scraper with configuration."""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.base_url = self.config['cactus']['base_url']
        self.halo_threshold = self.config['cactus']['halo_angle_threshold']
        
    def scrape_cme_catalog(self, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Scrape CME catalog for specified date range.
        
        Parameters:
        -----------
        start_date : str
            Start date in YYYY-MM-DD format
        end_date : str
            End date in YYYY-MM-DD format
            
        Returns:
        --------
        pd.DataFrame
            CME catalog data
        """
        logger.info(f"Scraping CACTUS catalog from {start_date} to {end_date}")
        
        # Convert dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        all_cmes = []
        
        # Iterate through months
        current_date = start_dt.replace(day=1)
        while current_date <= end_dt:
            try:
                month_data = self._scrape_monthly_catalog(current_date)
                all_cmes.extend(month_data)
                
                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
                
                # Be nice to the server
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Failed to scrape {current_date.strftime('%Y-%m')}: {e}")
                continue
        
        # Convert to DataFrame and filter
        df = pd.DataFrame(all_cmes)
        if not df.empty:
            df = self._filter_halo_cmes(df)
            df = df[(df['datetime'] >= start_dt) & (df['datetime'] <= end_dt)]
        
        logger.info(f"Found {len(df)} halo CMEs")
        return df
    
    def _scrape_monthly_catalog(self, date: datetime) -> list:
        """Scrape CME catalog for a specific month."""
        # Construct URL for monthly catalog
        year = date.year
        month = date.month
        url = f"{self.base_url}/catalog{year:04d}{month:02d}.html"
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Parse CME data from HTML table
            cmes = []
            tables = soup.find_all('table')
            
            for table in tables:
                rows = table.find_all('tr')
                for row in rows[1:]:  # Skip header
                    cols = row.find_all('td')
                    if len(cols) >= 6:  # Ensure sufficient columns
                        try:
                            cme_data = self._parse_cme_row(cols)
                            if cme_data:
                                cmes.append(cme_data)
                        except Exception as e:
                            logger.debug(f"Failed to parse CME row: {e}")
                            continue
            
            return cmes
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return []
    
    def _parse_cme_row(self, cols) -> dict:
        """Parse a single CME row from HTML table."""
        # This is a template - actual parsing depends on CACTUS HTML structure
        # You'll need to adjust based on the actual CACTUS catalog format
        
        try:
            date_str = cols[0].get_text().strip()
            time_str = cols[1].get_text().strip()
            
            # Parse datetime
            dt = datetime.strptime(f"{date_str} {time_str}", "%Y/%m/%d %H:%M")
            
            # Extract other parameters
            velocity = float(cols[2].get_text().strip())
            width = float(cols[3].get_text().strip())
            angle = float(cols[4].get_text().strip())
            
            return {
                'datetime': dt,
                'velocity': velocity,
                'width': width,
                'angle': angle,
                'is_halo': width >= self.halo_threshold
            }
            
        except (ValueError, AttributeError) as e:
            logger.debug(f"Failed to parse CME data: {e}")
            return None
    
    def _filter_halo_cmes(self, df: pd.DataFrame) -> pd.DataFrame:
        """Filter for halo CMEs only."""
        if 'width' in df.columns:
            halo_cmes = df[df['width'] >= self.halo_threshold].copy()
        else:
            halo_cmes = df[df['is_halo'] == True].copy()
        
        return halo_cmes
    
    def save_cme_catalog(self, df: pd.DataFrame, output_path: str) -> None:
        """Save CME catalog to file."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        df.to_csv(output_path, index=False)
        logger.info(f"CME catalog saved to {output_path}")

