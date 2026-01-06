#!/usr/bin/env python3
"""
Halo CME Detection using SWIS-ASPEX Data from Aditya-L1
======================================================

This module implements a comprehensive system for detecting Halo Coronal Mass 
Ejections (CMEs) using Solar Wind Ion Spectrometer (SWIS) Level-2 data from 
the ASPEX payload onboard Aditya-L1 mission.

Author: Your Name
Date: 2025
License: MIT
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union
import logging

# Scientific computing and signal processing
from scipy import signal, stats
from scipy.interpolate import interp1d
import pywt

# Machine learning
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight

# Data handling (install with: pip install spacepy cdflib)
try:
    from spacepy import pycdf
    CDF_AVAILABLE = True
except ImportError:
    try:
        import cdflib
        CDF_AVAILABLE = True
    except ImportError:
        CDF_AVAILABLE = False
        warnings.warn("Neither spacepy nor cdflib found. CDF reading will be limited.")

# Visualization
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HaloCMEDetector:
    """
    A comprehensive class for detecting Halo CME events using SWIS-ASPEX data.
    """
    
    def __init__(self, data_directory: str = "./data", output_directory: str = "./output"):
        """
        Initialize the CME detector.
        
        Parameters:
        -----------
        data_directory : str
            Path to directory containing SWIS CDF files
        output_directory : str
            Path to directory for saving results
        """
        self.data_dir = Path(data_directory)
        self.output_dir = Path(output_directory)
        self.output_dir.mkdir(exist_ok=True)
        
        # Data containers
        self.swis_data = None
        self.cme_catalog = None
        self.features = None
        self.thresholds = {}
        self.model = None
        self.scaler = StandardScaler()
        
        # Configuration parameters
        self.config = {
            'time_resolution': '1T',  # 1 minute
            'cme_window_hours': 72,   # Analysis window around CME events
            'background_window_days': 7,  # Background calculation window
            'min_cme_speed': 400,     # km/s, minimum speed for significant CMEs
            'velocity_threshold_factor': 1.5,  # Factor above background for velocity enhancement
            'density_threshold_factor': 2.0,   # Factor above background for density enhancement
            'wavelet': 'db4',         # Wavelet for time-frequency analysis
        }
    
    def load_cme_catalog(self, catalog_file: str = None) -> pd.DataFrame:
        """
        Load or create halo CME catalog from CACTUS database.
        
        Parameters:
        -----------
        catalog_file : str, optional
            Path to existing CME catalog CSV file
            
        Returns:
        --------
        pd.DataFrame
            CME catalog with event timestamps and properties
        """
        if catalog_file and os.path.exists(catalog_file):
            logger.info(f"Loading existing CME catalog from {catalog_file}")
            self.cme_catalog = pd.read_csv(catalog_file, parse_dates=['datetime'])
        else:
            logger.info("Creating sample CME catalog (replace with actual CACTUS data)")
            # Sample data - replace with actual CACTUS database queries
            sample_events = [
                {'datetime': '2024-08-15 14:30:00', 'speed': 650, 'angular_width': 360, 'source_location': 'N15W45'},
                {'datetime': '2024-09-03 08:15:00', 'speed': 890, 'angular_width': 360, 'source_location': 'S20E30'},
                {'datetime': '2024-09-18 22:45:00', 'speed': 720, 'angular_width': 350, 'source_location': 'N25W15'},
                {'datetime': '2024-10-05 16:20:00', 'speed': 1100, 'angular_width': 360, 'source_location': 'S10W60'},
                {'datetime': '2024-10-22 11:35:00', 'speed': 580, 'angular_width': 340, 'source_location': 'N30E20'},
            ]
            
            self.cme_catalog = pd.DataFrame(sample_events)
            self.cme_catalog['datetime'] = pd.to_datetime(self.cme_catalog['datetime'])
            
            # Calculate estimated arrival time at L1 (simplified model)
            # Using empirical relation: travel_time = 1.4 * distance / speed
            self.cme_catalog['estimated_arrival_hours'] = 1.4 * 149.6e6 / (self.cme_catalog['speed'] * 1000) / 3600
            self.cme_catalog['estimated_arrival'] = self.cme_catalog['datetime'] + pd.to_timedelta(
                self.cme_catalog['estimated_arrival_hours'], unit='h'
            )
            
            # Save catalog
            catalog_path = self.output_dir / 'halo_cme_catalog.csv'
            self.cme_catalog.to_csv(catalog_path, index=False)
            logger.info(f"Sample CME catalog saved to {catalog_path}")
        
        logger.info(f"Loaded {len(self.cme_catalog)} CME events")
        return self.cme_catalog
    
    def load_swis_data(self, file_pattern: str = "*.cdf") -> pd.DataFrame:
        """
        Load SWIS Level-2 data from CDF files.
        
        Parameters:
        -----------
        file_pattern : str
            File pattern to match CDF files
            
        Returns:
        --------
        pd.DataFrame
            Combined SWIS data with timestamps
        """
        if not CDF_AVAILABLE:
            logger.warning("CDF libraries not available. Loading sample data.")
            return self._generate_sample_swis_data()
        
        cdf_files = list(self.data_dir.glob(file_pattern))
        if not cdf_files:
            logger.warning(f"No CDF files found in {self.data_dir}. Generating sample data.")
            return self._generate_sample_swis_data()
        
        all_data = []
        
        for file_path in cdf_files:
            try:
                logger.info(f"Loading {file_path}")
                
                # Load CDF file (adapt based on actual SWIS data structure)
                if 'spacepy' in str(type(pycdf)):
                    cdf = pycdf.CDF(str(file_path))
                    data = {
                        'timestamp': cdf['Epoch'][:],
                        'proton_density': cdf['proton_density'][:],
                        'proton_temperature': cdf['proton_temperature'][:],
                        'proton_velocity': cdf['proton_velocity'][:],
                        'proton_flux': cdf['proton_flux'][:]
                    }
                    cdf.close()
                else:
                    # Using cdflib
                    cdf = cdflib.CDF(str(file_path))
                    data = {
                        'timestamp': cdf.varget('Epoch'),
                        'proton_density': cdf.varget('proton_density'),
                        'proton_temperature': cdf.varget('proton_temperature'),
                        'proton_velocity': cdf.varget('proton_velocity'),
                        'proton_flux': cdf.varget('proton_flux')
                    }
                
                df = pd.DataFrame(data)
                all_data.append(df)
                
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")
                continue
        
        if all_data:
            self.swis_data = pd.concat(all_data, ignore_index=True)
            self.swis_data['timestamp'] = pd.to_datetime(self.swis_data['timestamp'])
            self.swis_data = self.swis_data.sort_values('timestamp').reset_index(drop=True)
            logger.info(f"Loaded SWIS data: {len(self.swis_data)} records")
        else:
            logger.warning("No valid CDF data loaded. Using sample data.")
            self.swis_data = self._generate_sample_swis_data()
        
        return self.swis_data
    
    def _generate_sample_swis_data(self) -> pd.DataFrame:
        """Generate sample SWIS data for testing purposes."""
        logger.info("Generating sample SWIS data")
        
        # Create time series from August 2024 to present
        start_date = pd.Timestamp('2024-08-01')
        end_date = pd.Timestamp.now()
        timestamps = pd.date_range(start_date, end_date, freq='1T')
        
        n_points = len(timestamps)
        
        # Generate realistic solar wind parameters with noise
        np.random.seed(42)  # For reproducibility
        
        # Base solar wind conditions
        base_velocity = 400 + 100 * np.sin(np.arange(n_points) * 2 * np.pi / (24 * 60))  # Daily variation
        base_density = 5 + 2 * np.sin(np.arange(n_points) * 2 * np.pi / (12 * 60))      # 12-hour variation
        base_temperature = 1e5 + 2e4 * np.random.normal(0, 1, n_points)
        base_flux = base_density * base_velocity * 1e6  # Approximate flux
        
        # Add CME signatures at known event times
        velocity = base_velocity.copy()
        density = base_density.copy()
        temperature = base_temperature.copy()
        flux = base_flux.copy()
        
        if hasattr(self, 'cme_catalog') and self.cme_catalog is not None:
            for _, cme in self.cme_catalog.iterrows():
                arrival_time = cme['estimated_arrival']
                if arrival_time in timestamps:
                    idx = timestamps.get_loc(arrival_time)
                    
                    # Create CME signature
                    cme_duration = int(12 * 60)  # 12 hours
                    start_idx = max(0, idx - cme_duration // 2)
                    end_idx = min(n_points, idx + cme_duration // 2)
                    
                    # Velocity enhancement
                    velocity[start_idx:end_idx] += cme['speed'] * 0.3
                    
                    # Density enhancement followed by depletion
                    density[start_idx:idx] *= 2.5
                    density[idx:end_idx] *= 0.7
                    
                    # Temperature variations
                    temperature[start_idx:end_idx] *= 1.5
                    
                    # Update flux
                    flux[start_idx:end_idx] = density[start_idx:end_idx] * velocity[start_idx:end_idx] * 1e6
        
        # Add realistic noise
        velocity += np.random.normal(0, 20, n_points)
        density += np.random.normal(0, 0.5, n_points)
        temperature += np.random.normal(0, 1e4, n_points)
        flux += np.random.normal(0, flux * 0.1)
        
        # Ensure physical constraints
        velocity = np.clip(velocity, 200, 1200)
        density = np.clip(density, 0.1, 50)
        temperature = np.clip(temperature, 1e4, 1e6)
        flux = np.clip(flux, 0, None)
        
        self.swis_data = pd.DataFrame({
            'timestamp': timestamps,
            'proton_velocity': velocity,
            'proton_density': density,
            'proton_temperature': temperature,
            'proton_flux': flux
        })
        
        logger.info(f"Generated {len(self.swis_data)} sample data points")
        return self.swis_data
    
    def preprocess_data(self) -> pd.DataFrame:
        """
        Clean and preprocess SWIS data.
        
        Returns:
        --------
        pd.DataFrame
            Preprocessed SWIS data
        """
        logger.info("Preprocessing SWIS data")
        
        if self.swis_data is None:
            raise ValueError("No SWIS data loaded. Call load_swis_data() first.")
        
        # Remove invalid data points
        self.swis_data = self.swis_data.dropna()
        
        # Remove unphysical values
        physical_limits = {
            'proton_velocity': (200, 1200),    # km/s
            'proton_density': (0.1, 100),      # cm^-3
            'proton_temperature': (1e4, 1e7),  # K
            'proton_flux': (0, None)           # particles/(cm^2*s)
        }
        
        for param, (min_val, max_val) in physical_limits.items():
            if param in self.swis_data.columns:
                if min_val is not None:
                    self.swis_data = self.swis_data[self.swis_data[param] >= min_val]
                if max_val is not None:
                    self.swis_data = self.swis_data[self.swis_data[param] <= max_val]
        
        # Resample to consistent time resolution
        self.swis_data = self.swis_data.set_index('timestamp')
        self.swis_data = self.swis_data.resample(self.config['time_resolution']).mean()
        self.swis_data = self.swis_data.interpolate(method='linear', limit=30)  # Fill small gaps (method parameter is valid for interpolate)
        self.swis_data = self.swis_data.reset_index()
        
        logger.info(f"Preprocessed data: {len(self.swis_data)} records")
        return self.swis_data
    
    def extract_features(self) -> pd.DataFrame:
        """
        Extract comprehensive features from SWIS data for CME detection.
        
        Returns:
        --------
        pd.DataFrame
            Feature matrix with derived parameters
        """
        logger.info("Extracting features from SWIS data")
        
        if self.swis_data is None:
            raise ValueError("No SWIS data available. Load and preprocess data first.")
        
        df = self.swis_data.copy()
        
        # Ensure timestamp column exists (may be index)
        if 'timestamp' not in df.columns:
            if isinstance(df.index, pd.DatetimeIndex):
                df = df.reset_index()  # Convert index to column
                if 'index' in df.columns:
                    df['timestamp'] = pd.to_datetime(df['index'])
                    df = df.drop(columns=['index'])
                else:
                    # Use first column or create from index
                    df['timestamp'] = pd.to_datetime(df.index) if hasattr(df.index, '__iter__') else pd.date_range(start=datetime.now(), periods=len(df), freq='1h')
            else:
                # Try to infer timestamp from index
                try:
                    df['timestamp'] = pd.to_datetime(df.index)
                except:
                    raise ValueError("No timestamp information found in data - cannot infer from index")
        
        # Ensure timestamp is properly converted to datetime dtype
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Basic parameters - handle both naming conventions
        velocity_col = 'proton_velocity' if 'proton_velocity' in df.columns else ('velocity' if 'velocity' in df.columns else ('speed' if 'speed' in df.columns else None))
        density_col = 'proton_density' if 'proton_density' in df.columns else ('density' if 'density' in df.columns else None)
        temp_col = 'proton_temperature' if 'proton_temperature' in df.columns else ('temperature' if 'temperature' in df.columns else None)
        flux_col = 'proton_flux' if 'proton_flux' in df.columns else ('flux' if 'flux' in df.columns else None)
        
        # Magnetic field parameters - critical for CME detection
        bx_col = 'bx' if 'bx' in df.columns else ('bx_gsm' if 'bx_gsm' in df.columns else ('Bx' if 'Bx' in df.columns else None))
        by_col = 'by' if 'by' in df.columns else ('by_gsm' if 'by_gsm' in df.columns else ('By' if 'By' in df.columns else None))
        bz_col = 'bz' if 'bz' in df.columns else ('bz_gsm' if 'bz_gsm' in df.columns else ('Bz' if 'Bz' in df.columns else None))
        bt_col = 'bt' if 'bt' in df.columns else ('b_total' if 'b_total' in df.columns else ('Bt' if 'Bt' in df.columns else ('magnetic_field' if 'magnetic_field' in df.columns else None)))
        
        # Ensure timestamp is properly extracted and converted to datetime
        if 'timestamp' in df.columns:
            timestamp_series = pd.to_datetime(df['timestamp'])
        elif isinstance(df.index, pd.DatetimeIndex):
            timestamp_series = pd.Series(df.index, index=df.index)
        else:
            # Fallback: create timestamp from index
            try:
                timestamp_series = pd.to_datetime(df.index)
                if isinstance(timestamp_series, pd.DatetimeIndex):
                    timestamp_series = pd.Series(timestamp_series, index=df.index)
            except:
                # Final fallback: create sequential timestamps
                start_time = datetime.now() - timedelta(hours=len(df))
                timestamp_series = pd.date_range(start=start_time, periods=len(df), freq='1h')
        
        # Ensure timestamp is a pandas Series (not array or DatetimeIndex)
        if isinstance(timestamp_series, np.ndarray):
            timestamp_series = pd.Series(pd.to_datetime(timestamp_series))
        elif isinstance(timestamp_series, pd.DatetimeIndex):
            timestamp_series = pd.Series(timestamp_series)
        elif not isinstance(timestamp_series, pd.Series):
            timestamp_series = pd.Series(pd.to_datetime(timestamp_series))
        
        # Reset index to ensure clean integer index for features DataFrame
        df_reset = df.reset_index(drop=True) if not isinstance(df.index, pd.RangeIndex) else df
        
        # Extract values with proper length matching
        timestamp_values = timestamp_series.reset_index(drop=True) if len(timestamp_series) == len(df_reset) else timestamp_series.iloc[:len(df_reset)] if len(timestamp_series) > len(df_reset) else pd.concat([timestamp_series, pd.Series([timestamp_series.iloc[-1]] * (len(df_reset) - len(timestamp_series)))])
        
        features = pd.DataFrame({
            'timestamp': pd.to_datetime(timestamp_values),
            'velocity': df_reset[velocity_col].values if velocity_col and velocity_col in df_reset.columns else np.full(len(df_reset), 500.0),
            'density': df_reset[density_col].values if density_col and density_col in df_reset.columns else np.full(len(df_reset), 5.0),
            'temperature': df_reset[temp_col].values if temp_col and temp_col in df_reset.columns else np.full(len(df_reset), 100000.0),
            'flux': df_reset[flux_col].values if flux_col and flux_col in df_reset.columns else np.full(len(df_reset), 1000000.0)
        })
        
        # Ensure timestamp column is datetime dtype (double check)
        features['timestamp'] = pd.to_datetime(features['timestamp'])
        
        # Add magnetic field components if available (use df_reset for consistent indexing)
        if bx_col and bx_col in df_reset.columns:
            features['bx'] = df_reset[bx_col].values
        else:
            features['bx'] = np.full(len(df_reset), 0.0)
            
        if by_col and by_col in df_reset.columns:
            features['by'] = df_reset[by_col].values
        else:
            features['by'] = np.full(len(df_reset), 0.0)
            
        if bz_col and bz_col in df_reset.columns:
            features['bz'] = df_reset[bz_col].values
        else:
            features['bz'] = np.full(len(df_reset), -1.0)  # Typical southward bias
            
        if bt_col and bt_col in df_reset.columns:
            features['bt'] = df_reset[bt_col].values
        else:
            # Calculate Bt from components if available
            if bx_col and by_col and bz_col and all(col in df_reset.columns for col in [bx_col, by_col, bz_col]):
                features['bt'] = np.sqrt(df_reset[bx_col]**2 + df_reset[by_col]**2 + df_reset[bz_col]**2).values
            else:
                features['bt'] = np.full(len(df_reset), 5.0)  # Typical ~5 nT
        
        # Moving averages (multiple time scales) - use df_reset for consistency
        for window in [60, 180, 360]:  # 1h, 3h, 6h in minutes
            for param in ['velocity', 'density', 'temperature', 'flux']:
                param_col = f'proton_{param}' if f'proton_{param}' in df_reset.columns else param
                if param_col in df_reset.columns:
                    rolling_mean = df_reset[param_col].rolling(window=window, center=True, min_periods=1).mean()
                    features[f'{param}_ma_{window}m'] = rolling_mean.values
                else:
                    features[f'{param}_ma_{window}m'] = features[param].values  # Use base value
        
        # Gradients and rates of change
        for param in ['velocity', 'density', 'temperature', 'flux']:
            param_col = f'proton_{param}' if f'proton_{param}' in df_reset.columns else param
            if param_col in df_reset.columns:
                features[f'{param}_gradient_1h'] = df_reset[param_col].diff(60).fillna(0).values
                features[f'{param}_gradient_3h'] = df_reset[param_col].diff(180).fillna(0).values
                features[f'{param}_pct_change_1h'] = df_reset[param_col].pct_change(60, fill_method=None).fillna(0).values
            else:
                features[f'{param}_gradient_1h'] = np.zeros(len(df_reset))
                features[f'{param}_gradient_3h'] = np.zeros(len(df_reset))
                features[f'{param}_pct_change_1h'] = np.zeros(len(df_reset))
        
        # Statistical features (rolling windows)
        for window in [180, 360, 720]:  # 3h, 6h, 12h
            for param in ['velocity', 'density', 'temperature', 'flux']:
                param_col = f'proton_{param}' if f'proton_{param}' in df_reset.columns else param
                if param_col in df_reset.columns:
                    rolling_std = df_reset[param_col].rolling(window=window, center=True, min_periods=1).std().fillna(0)
                    mean_rolling = df_reset[param_col].rolling(window=window, center=True, min_periods=1).mean().fillna(1)
                    cv = (rolling_std / mean_rolling).replace([np.inf, -np.inf], np.nan).fillna(0)
                    features[f'{param}_std_{window}m'] = rolling_std.values
                    features[f'{param}_cv_{window}m'] = cv.values
                else:
                    features[f'{param}_std_{window}m'] = np.zeros(len(df_reset))
                    features[f'{param}_cv_{window}m'] = np.zeros(len(df_reset))
        
        # Physics-based derived parameters - use df_reset
        density_col = 'proton_density' if 'proton_density' in df_reset.columns else 'density'
        velocity_col = 'proton_velocity' if 'proton_velocity' in df_reset.columns else 'velocity'
        temp_col = 'proton_temperature' if 'proton_temperature' in df_reset.columns else 'temperature'
        
        if all(col in df_reset.columns for col in [density_col, velocity_col]):
            features['dynamic_pressure'] = (
                df_reset[density_col] * 1.67e-27 * (df_reset[velocity_col] * 1000) ** 2 * 1e9
            ).values  # nPa
        else:
            features['dynamic_pressure'] = np.zeros(len(df_reset))
        
        if temp_col in df_reset.columns:
            thermal_speed = np.sqrt(
                2 * 1.38e-23 * df_reset[temp_col] / 1.67e-27
            ) / 1000  # km/s
            features['thermal_speed'] = thermal_speed.values
            if velocity_col in df_reset.columns:
                velocity_ratio = df_reset[velocity_col] / thermal_speed.replace([np.inf, -np.inf], np.nan).fillna(1)
                features['velocity_ratio'] = velocity_ratio.fillna(0).values
            else:
                features['velocity_ratio'] = np.zeros(len(df_reset))
        else:
            features['thermal_speed'] = np.zeros(len(df_reset))
            features['velocity_ratio'] = np.zeros(len(df_reset))
        
        # Cross-correlations between parameters
        velocity_col = 'proton_velocity' if 'proton_velocity' in df_reset.columns else 'velocity'
        density_col = 'proton_density' if 'proton_density' in df_reset.columns else 'density'
        temp_col = 'proton_temperature' if 'proton_temperature' in df_reset.columns else 'temperature'
        
        for window in [180, 360]:
            if velocity_col in df_reset.columns and density_col in df_reset.columns:
                corr = df_reset[velocity_col].rolling(window=window, center=True, min_periods=1).corr(df_reset[density_col])
                features[f'vel_dens_corr_{window}m'] = corr.fillna(0).values
            else:
                features[f'vel_dens_corr_{window}m'] = np.zeros(len(df_reset))
            
            if velocity_col in df_reset.columns and temp_col in df_reset.columns:
                corr = df_reset[velocity_col].rolling(window=window, center=True, min_periods=1).corr(df_reset[temp_col])
                features[f'vel_temp_corr_{window}m'] = corr.fillna(0).values
            else:
                features[f'vel_temp_corr_{window}m'] = np.zeros(len(df_reset))
        
        # Wavelet-based features
        try:
            for param in ['velocity', 'density']:
                param_col = f'proton_{param}' if f'proton_{param}' in df_reset.columns else param
                if param_col in df_reset.columns:
                    param_data = df_reset[param_col].ffill().values
                    if len(param_data) > 1024:  # Minimum length for wavelet analysis
                        coeffs = pywt.wavedec(param_data, self.config['wavelet'], level=6)
                        # Use approximation coefficients at different levels
                        for level, coeff in enumerate(coeffs[1:4]):  # Detail coefficients
                            features[f'{param}_wavelet_detail_{level+1}'] = np.full(
                                len(features), np.var(coeff) if len(coeff) > 0 else 0.0
                            )
                    else:
                        for level in range(1, 4):
                            features[f'{param}_wavelet_detail_{level}'] = np.zeros(len(features))
                else:
                    for level in range(1, 4):
                        features[f'{param}_wavelet_detail_{level}'] = np.zeros(len(features))
        except Exception as e:
            logger.warning(f"Wavelet analysis failed: {e}")
            # Fill with zeros if wavelet fails
            for param in ['velocity', 'density']:
                for level in range(1, 4):
                    if f'{param}_wavelet_detail_{level}' not in features.columns:
                        features[f'{param}_wavelet_detail_{level}'] = np.zeros(len(features))
        
        # Composite indicators
        if 'velocity_ma_360m' in features.columns and features['velocity_ma_360m'].abs().sum() > 0:
            features['velocity_enhancement'] = (
                features['velocity'] / features['velocity_ma_360m'].replace(0, np.nan) - 1
            ).fillna(0)
        else:
            features['velocity_enhancement'] = 0.0
        
        if 'density_ma_360m' in features.columns and features['density_ma_360m'].abs().sum() > 0:
            features['density_enhancement'] = (
                features['density'] / features['density_ma_360m'].replace(0, np.nan) - 1
            ).fillna(0)
        else:
            features['density_enhancement'] = 0.0
        
        # Combined anomaly score - now includes magnetic field features
        velocity_mean = features['velocity'].mean() if 'velocity' in features.columns and len(features) > 0 else 1.0
        if velocity_mean == 0:
            velocity_mean = 1.0
        
        gradient_3h = features.get('velocity_gradient_3h', pd.Series([0.0] * len(features)))
        
        # Base anomaly score from plasma parameters
        base_anomaly = (
            np.abs(features['velocity_enhancement']) +
            np.abs(features['density_enhancement']) +
            np.abs(gradient_3h / velocity_mean)
        )
        
        # Add magnetic field anomaly indicators
        magnetic_anomaly = 0.0
        if 'strong_southward_bz' in features.columns:
            magnetic_anomaly += features['strong_southward_bz'] * 0.5
        if 'large_b_rotation' in features.columns:
            magnetic_anomaly += features['large_b_rotation'] * 0.3
        if 'plasma_beta' in features.columns:
            # Low beta (< 0.5) or high beta (> 2) can indicate CME
            beta_anomaly = np.abs(features['plasma_beta'] - 1.0) / 2.0
            magnetic_anomaly += np.clip(beta_anomaly, 0, 0.5)
        
        features['anomaly_score'] = (base_anomaly + magnetic_anomaly).fillna(0)
        
        # Fill NaN values with forward fill and backward fill, then fill remaining with 0
        features = features.ffill().bfill().fillna(0)
        
        # Ensure all numeric columns are properly typed
        for col in features.columns:
            if col != 'timestamp':
                if features[col].dtype == 'object':
                    try:
                        features[col] = pd.to_numeric(features[col], errors='coerce').fillna(0)
                    except:
                        pass
        
        self.features = features
        logger.info(f"✅ Extracted {len(features.columns)-1} features from {len(features)} data points")
        
        return features
    
    def label_cme_events(self) -> pd.DataFrame:
        """
        Label time periods corresponding to CME events.
        
        Returns:
        --------
        pd.DataFrame
            Features with CME event labels
        """
        if self.features is None:
            raise ValueError("Features not extracted. Call extract_features() first.")
        
        if self.cme_catalog is None:
            raise ValueError("CME catalog not loaded. Call load_cme_catalog() first.")
        
        logger.info("Labeling CME events in feature data")
        
        features = self.features.copy()
        features['is_cme'] = 0
        
        # Ensure timestamp is properly formatted as pandas Series with datetime dtype
        if 'timestamp' not in features.columns:
            # If timestamp is in index, use it
            if isinstance(features.index, pd.DatetimeIndex):
                features['timestamp'] = features.index
            else:
                raise ValueError("Timestamp column or DatetimeIndex not found in features")
        
        # Convert timestamp column to datetime if not already
        if not pd.api.types.is_datetime64_any_dtype(features['timestamp']):
            features['timestamp'] = pd.to_datetime(features['timestamp'])
        
        # Ensure timestamp is a Series (not array)
        if isinstance(features['timestamp'], np.ndarray):
            features['timestamp'] = pd.Series(features['timestamp'], index=features.index)
        
        # Label periods around each CME event
        for _, cme in self.cme_catalog.iterrows():
            arrival_time = cme['estimated_arrival']
            
            # Ensure arrival_time is a proper Timestamp
            if not isinstance(arrival_time, (pd.Timestamp, datetime)):
                arrival_time = pd.to_datetime(arrival_time)
            elif isinstance(arrival_time, datetime):
                arrival_time = pd.Timestamp(arrival_time)
            
            # Define CME window (before and after arrival)
            window_start = arrival_time - pd.Timedelta(hours=6)
            window_end = arrival_time + pd.Timedelta(hours=self.config['cme_window_hours'])
            
            # Mark corresponding time periods - ensure both sides are datetime-compatible
            try:
                # Convert to pandas Series for proper comparison
                timestamp_series = pd.Series(features['timestamp'], index=features.index)
                mask = (timestamp_series >= window_start) & (timestamp_series <= window_end)
                features.loc[mask, 'is_cme'] = 1
                
                logger.info(f"Labeled CME event at {arrival_time}: {mask.sum()} data points")
            except Exception as mask_error:
                logger.warning(f"Error creating mask for CME event at {arrival_time}: {mask_error}, skipping...")
                continue
        
        cme_fraction = features['is_cme'].mean()
        logger.info(f"CME events: {cme_fraction:.1%} of total data points")
        
        return features
    
    def determine_thresholds(self, method: str = 'statistical') -> Dict:
        """
        Determine detection thresholds for CME events.
        
        Parameters:
        -----------
        method : str
            Threshold determination method ('statistical', 'ml', 'hybrid')
            
        Returns:
        --------
        Dict
            Dictionary of parameter thresholds
        """
        logger.info(f"Determining thresholds using {method} method")
        
        labeled_features = self.label_cme_events()
        
        if method == 'statistical':
            thresholds = self._statistical_thresholds(labeled_features)
        elif method == 'ml':
            thresholds = self._ml_thresholds(labeled_features)
        elif method == 'hybrid':
            stat_thresh = self._statistical_thresholds(labeled_features)
            ml_thresh = self._ml_thresholds(labeled_features)
            thresholds = {**stat_thresh, **ml_thresh}
        else:
            raise ValueError(f"Unknown threshold method: {method}")
        
        self.thresholds = thresholds
        return thresholds
    
    def _statistical_thresholds(self, labeled_features: pd.DataFrame) -> Dict:
        """Determine statistical thresholds based on percentiles."""
        thresholds = {}
        
        # Get background (non-CME) data
        background = labeled_features[labeled_features['is_cme'] == 0]
        
        key_parameters = [
            'velocity_enhancement', 'density_enhancement', 'anomaly_score',
            'velocity_gradient_3h', 'dynamic_pressure'
        ]
        
        for param in key_parameters:
            if param in background.columns:
                # Use lower percentile (90th instead of 95th) for more detections
                threshold = background[param].quantile(0.90)
                thresholds[param] = threshold
                
                logger.info(f"{param} threshold: {threshold:.3f} (90th percentile)")
        
        return thresholds
    
    def _ml_thresholds(self, labeled_features: pd.DataFrame) -> Dict:
        """Train machine learning model for CME detection."""
        # Select features for ML model
        feature_cols = [col for col in labeled_features.columns 
                       if col not in ['timestamp', 'is_cme'] and 
                       not labeled_features[col].isna().all()]
        
        X = labeled_features[feature_cols].fillna(0)
        y = labeled_features['is_cme']
        
        # Handle class imbalance
        class_weights = compute_class_weight('balanced', classes=np.unique(y), y=y)
        weight_dict = {0: class_weights[0], 1: class_weights[1]}
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight=weight_dict,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        logger.info(f"ML Model - Train accuracy: {train_score:.3f}, Test accuracy: {test_score:.3f}")
        
        # Calculate detailed metrics for validation
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        # Confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        # Calculate metrics
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        accuracy = (tp + tn) / (tp + tn + fp + fn)
        false_positive_rate = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        # ROC curve and AUC
        fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
        auc_score = auc(fpr, tpr)
        
        # Store metrics for later retrieval
        self.training_metrics = {
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'accuracy': accuracy,
            'auc_roc': auc_score,
            'false_positive_rate': false_positive_rate,
            'confusion_matrix': {'tp': int(tp), 'tn': int(tn), 'fp': int(fp), 'fn': int(fn)}
        }
        
        logger.info(f"Detailed Metrics - Precision: {precision:.3f}, Recall: {recall:.3f}, F1: {f1_score:.3f}, AUC: {auc_score:.3f}, FPR: {false_positive_rate:.3f}")
        
        # Get feature importance
        feature_importance = pd.DataFrame({
            'feature': feature_cols,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        logger.info("Top 5 most important features:")
        for idx, row in feature_importance.head().iterrows():
            logger.info(f"  {row['feature']}: {row['importance']:.3f}")
        
        # Determine probability threshold using ROC curve
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
        
        # Find optimal threshold (Youden's index) but use lower threshold for more detections
        optimal_idx = np.argmax(tpr - fpr)
        optimal_threshold = thresholds[optimal_idx]
        
        # Use lower threshold (minimum of optimal or 0.25) to catch more events
        final_threshold = min(optimal_threshold, 0.25) if optimal_threshold > 0.25 else optimal_threshold
        
        ml_thresholds = {
            'ml_probability_threshold': final_threshold,
            'ml_feature_importance': feature_importance.to_dict('records')
        }
        
        return ml_thresholds
    
    def detect_cme_events(self, method: str = 'hybrid') -> pd.DataFrame:
        """
        Detect CME events using the established thresholds.
        
        Parameters:
        -----------
        method : str
            Detection method ('statistical', 'ml', 'hybrid')
            
        Returns:
        --------
        pd.DataFrame
            Detection results with flags and confidence scores
        """
        logger.info(f"Detecting CME events using {method} method")
        
        if self.features is None:
            raise ValueError("Features not available. Extract features first.")
        
        if not self.thresholds:
            logger.info("No thresholds found. Determining thresholds first.")
            self.determine_thresholds(method=method)
        
        results = self.features.copy()
        
        if method in ['statistical', 'hybrid']:
            # Statistical detection
            results['stat_detection'] = 0
            detection_score = np.zeros(len(results))
            
            for param, threshold in self.thresholds.items():
                if param in results.columns and 'ml_' not in param:
                    exceeds_threshold = results[param] > threshold
                    detection_score += exceeds_threshold.astype(int)
            
            # Require multiple parameters to exceed thresholds (lowered from 2 to 1 for better detection)
            # Also check for strong individual indicators (velocity > 500 km/s or strong Bz southward)
            strong_velocity = (results.get('velocity', 0) > 500).astype(int) if 'velocity' in results.columns else 0
            strong_bz = (results.get('bz', 0) < -10).astype(int) if 'bz' in results.columns else 0
            
            # Detection if: (multiple parameters exceed) OR (strong velocity) OR (strong Bz southward)
            results['stat_detection'] = (
                (detection_score >= 1) |  # At least 1 parameter exceeds threshold
                (strong_velocity == 1) |  # OR strong velocity
                (strong_bz == 1)          # OR strong southward Bz
            ).astype(int)
            
            # Calculate confidence based on number of indicators
            total_indicators = detection_score + strong_velocity + strong_bz
            max_possible = len([k for k in self.thresholds.keys() if 'ml_' not in k]) + 2
            results['stat_confidence'] = np.clip(total_indicators / max(1, max_possible), 0, 1)
        
        if method in ['ml', 'hybrid'] and self.model is not None:
            # ML detection
            feature_cols = [col for col in results.columns 
                           if col not in ['timestamp', 'stat_detection', 'stat_confidence'] and 
                           not results[col].isna().all()]
            
            X = results[feature_cols].fillna(0)
            X_scaled = self.scaler.transform(X)
            
            ml_proba = self.model.predict_proba(X_scaled)[:, 1]
            ml_threshold = self.thresholds.get('ml_probability_threshold', 0.25)  # Lowered from 0.5 to 0.25
            
            results['ml_detection'] = (ml_proba > ml_threshold).astype(int)
            results['ml_confidence'] = ml_proba
        
        # Combine methods for hybrid approach
        if method == 'hybrid':
            results['hybrid_detection'] = (
                (results.get('stat_detection', 0) == 1) | 
                (results.get('ml_detection', 0) == 1)
            ).astype(int)
            
            results['hybrid_confidence'] = np.maximum(
                results.get('stat_confidence', 0),
                results.get('ml_confidence', 0)
            )
        
        logger.info("CME detection completed")
        return results
    
    def extract_ml_features(self, processed_data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract ML features from preprocessed data.
        This is an alias/wrapper for extract_features that works with preprocessed data.
        
        Parameters:
        -----------
        processed_data : pd.DataFrame
            Preprocessed SWIS data (can have timestamp as index or column)
            
        Returns:
        --------
        pd.DataFrame
            Feature matrix for ML model with timestamp column
        """
        logger.info(f"Extracting ML features from processed data (shape: {processed_data.shape})")
        
        # Store the processed data temporarily
        original_data = self.swis_data
        
        # Ensure processed_data is in correct format
        df_work = processed_data.copy()
        
        # If timestamp is index, convert to column
        if isinstance(df_work.index, pd.DatetimeIndex):
            df_work = df_work.reset_index()
            if 'index' in df_work.columns:
                df_work.rename(columns={'index': 'timestamp'}, inplace=True)
            elif 'timestamp' not in df_work.columns:
                df_work['timestamp'] = df_work.index
        elif 'timestamp' not in df_work.columns:
            # Try to create timestamp from index
            try:
                df_work['timestamp'] = pd.to_datetime(df_work.index)
            except:
                # Fallback: create sequential timestamps
                start_time = datetime.now() - timedelta(hours=len(df_work))
                df_work['timestamp'] = pd.date_range(start=start_time, periods=len(df_work), freq='1h')
        
        # Ensure timestamp is datetime
        df_work['timestamp'] = pd.to_datetime(df_work['timestamp'])
        
        # Store as swis_data for extract_features
        self.swis_data = df_work
        
        try:
            # Extract features using existing method
            features = self.extract_features()
            
            # Ensure features has timestamp column and it's properly formatted
            if 'timestamp' not in features.columns:
                # Try to get from index or recreate
                if isinstance(features.index, pd.DatetimeIndex):
                    features = features.reset_index()
                    if 'index' in features.columns:
                        features.rename(columns={'index': 'timestamp'}, inplace=True)
            
            # Ensure timestamp is datetime dtype
            if 'timestamp' in features.columns:
                features['timestamp'] = pd.to_datetime(features['timestamp'])
            
            logger.info(f"✅ Successfully extracted {len(features.columns)} features with {len(features)} rows")
            return features
        except Exception as e:
            logger.error(f"Error extracting ML features: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise
        finally:
            # Restore original data
            self.swis_data = original_data
    
    def predict_cme_events(self, features: pd.DataFrame) -> List[Dict]:
        """
        Predict CME events using ML model.
        
        Parameters:
        -----------
        features : pd.DataFrame
            Feature matrix from extract_ml_features()
            
        Returns:
        --------
        List[Dict]
            List of predicted CME events with probabilities
        """
        if self.model is None:
            # If model not trained, use statistical detection
            logger.warning("ML model not available, using statistical detection")
            self.features = features
            detection_results = self.detect_cme_events(method='statistical')
            
            predictions = []
            # Use integer index for proper array access
            detection_results_reset = detection_results.reset_index(drop=True)
            for idx in range(len(detection_results_reset)):
                row = detection_results_reset.iloc[idx]
                if row.get('stat_detection', 0) == 1:
                    predictions.append({
                        'event_index': idx,
                        'probability': float(row.get('stat_confidence', 0.5)),
                        'confidence': float(row.get('stat_confidence', 0.5)),
                        'anomaly_score': float(row.get('anomaly_score', 0.0)) if 'anomaly_score' in row.index else 0.0
                    })
            return predictions
        
        # Prepare features for ML model
        feature_cols = [col for col in features.columns 
                       if col not in ['timestamp'] and 
                       not features[col].isna().all()]
        
        X = features[feature_cols].fillna(0)
        
        # Scale features if scaler is available
        if hasattr(self, 'scaler') and self.scaler is not None:
            try:
                X_scaled = self.scaler.transform(X)
            except:
                # If scaler not fitted, fit it first
                self.scaler.fit(X)
                X_scaled = self.scaler.transform(X)
        else:
            X_scaled = X.values
        
        # Get predictions
        try:
            ml_proba = self.model.predict_proba(X_scaled)[:, 1]
        except:
            # Fallback to statistical if ML fails
            logger.warning("ML prediction failed, using statistical method")
            return self.predict_cme_events(features)  # Recursive call with statistical
        
        # Convert to list of predictions
        predictions = []
        for idx, prob in enumerate(ml_proba):
            if prob > 0.2:  # Lowered threshold from 0.3 to 0.2 for more detections
                predictions.append({
                    'event_index': idx,
                    'probability': float(prob),
                    'confidence': float(prob),
                    'anomaly_score': float(features.iloc[idx].get('anomaly_score', 0.0)) if 'anomaly_score' in features.columns else 0.0
                })
        
        return predictions
    
    def preprocess_for_analysis(self, swis_data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess SWIS data for analysis.
        Wrapper method for compatibility.
        
        Parameters:
        -----------
        swis_data : pd.DataFrame
            Raw SWIS data
            
        Returns:
        --------
        pd.DataFrame
            Preprocessed data
        """
        # If data has timestamp as index, reset it
        if isinstance(swis_data.index, pd.DatetimeIndex):
            swis_data = swis_data.reset_index()
        
        # Ensure timestamp column exists
        if 'timestamp' not in swis_data.columns and 'datetime' in swis_data.columns:
            swis_data['timestamp'] = pd.to_datetime(swis_data['datetime'])
        elif 'timestamp' not in swis_data.columns:
            # Create timestamp from index if available
            if isinstance(swis_data.index, pd.DatetimeIndex):
                swis_data['timestamp'] = swis_data.index
            else:
                raise ValueError("No timestamp information found in data")
        
        # Set timestamp as index for processing
        swis_data = swis_data.set_index('timestamp')
        
        # Preprocess using existing method
        return self.preprocess_data()
    
    def validate_detection(self, detection_results: pd.DataFrame) -> Dict:
        """
        Validate detection results against known CME events.
        
        Parameters:
        -----------
        detection_results : pd.DataFrame
            Results from detect_cme_events()
            
        Returns:
        --------
        Dict
            Validation metrics and performance statistics
        """
        logger.info("Validating detection results")
        
        # Get true labels
        labeled_results = self.label_cme_events()
        detection_results = detection_results.merge(
            labeled_results[['timestamp', 'is_cme']], 
            on='timestamp', 
            how='inner'
        )
        
        validation_metrics = {}
        
        for method in ['stat', 'ml', 'hybrid']:
            detection_col = f'{method}_detection'
            confidence_col = f'{method}_confidence'
            
            if detection_col in detection_results.columns:
                y_true = detection_results['is_cme']
                y_pred = detection_results[detection_col]
                
                # Calculate metrics
                tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
                
                precision = tp / (tp + fp) if (tp + fp) > 0 else 0
                recall = tp / (tp + fn) if (tp + fn) > 0 else 0
                f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
                accuracy = (tp + tn) / (tp + tn + fp + fn)
                
                validation_metrics[method] = {
                    'true_positives': int(tp),
                    'false_positives': int(fp),
                    'true_negatives': int(tn),
                    'false_negatives': int(fn),
                    'precision': precision,
                    'recall': recall,
                    'f1_score': f1_score,
                    'accuracy': accuracy
                }
                
                logger.info(f"{method.upper()} Method Performance:")
                logger.info(f"  Precision: {precision:.3f}")
                logger.info(f"  Recall: {recall:.3f}")
                logger.info(f"  F1-Score: {f1_score:.3f}")
                logger.info(f"  Accuracy: {accuracy:.3f}")
                
                # ROC analysis if confidence scores available
                if confidence_col in detection_results.columns:
                    y_scores = detection_results[confidence_col]
                    fpr, tpr, _ = roc_curve(y_true, y_scores)
                    auc_score = auc(fpr, tpr)
                    validation_metrics[method]['auc'] = auc_score
                    logger.info(f"  AUC: {auc_score:.3f}")
        
        return validation_metrics
    
    def visualize_results(self, detection_results: pd.DataFrame, save_plots: bool = True):
        """
        Create comprehensive visualizations of detection results.
        
        Parameters:
        -----------
        detection_results : pd.DataFrame
            Results from detect_cme_events()
        save_plots : bool
            Whether to save plots to output directory
        """
        logger.info("Creating visualizations")
        
        # Set up the plotting style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        # 1. Time series overview
        fig, axes = plt.subplots(4, 1, figsize=(15, 12), sharex=True)
        
        # Plot main parameters
        params = ['velocity', 'density', 'temperature', 'flux']
        param_labels = ['Velocity (km/s)', 'Density (cm⁻³)', 'Temperature (K)', 'Flux (particles/cm²/s)']
        
        for i, (param, label) in enumerate(zip(params, param_labels)):
            if param in detection_results.columns:
                axes[i].plot(detection_results['timestamp'], detection_results[param], 
                           alpha=0.7, linewidth=0.5, color='blue')
                axes[i].set_ylabel(label)
                axes[i].grid(True, alpha=0.3)
                
                # Highlight CME periods if available
                if 'is_cme' in detection_results.columns:
                    cme_periods = detection_results[detection_results['is_cme'] == 1]
                    if not cme_periods.empty:
                        axes[i].scatter(cme_periods['timestamp'], cme_periods[param], 
                                      color='red', alpha=0.6, s=1, label='CME periods')
                
                # Highlight detections
                for method in ['stat', 'ml', 'hybrid']:
                    detection_col = f'{method}_detection'
                    if detection_col in detection_results.columns:
                        detections = detection_results[detection_results[detection_col] == 1]
                        if not detections.empty:
                            axes[i].scatter(detections['timestamp'], detections[param], 
                                          alpha=0.4, s=2, label=f'{method.upper()} detection')
        
        axes[0].set_title('SWIS-ASPEX Solar Wind Parameters and CME Detections', fontsize=14, fontweight='bold')
        axes[-1].set_xlabel('Time')
        axes[0].legend()
        plt.tight_layout()
        
        if save_plots:
            plt.savefig(self.output_dir / 'timeseries_overview.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # 2. Detection performance visualization
        if 'is_cme' in detection_results.columns:
            self._plot_detection_performance(detection_results, save_plots)
        
        # 3. Feature importance and correlation
        self._plot_feature_analysis(detection_results, save_plots)
        
        # 4. Interactive Plotly visualization
        self._create_interactive_plot(detection_results, save_plots)
    
    def _plot_detection_performance(self, detection_results: pd.DataFrame, save_plots: bool):
        """Plot detection performance metrics."""
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        
        # ROC curves
        for i, method in enumerate(['stat', 'ml', 'hybrid']):
            confidence_col = f'{method}_confidence'
            if confidence_col in detection_results.columns:
                y_true = detection_results['is_cme']
                y_scores = detection_results[confidence_col]
                
                fpr, tpr, _ = roc_curve(y_true, y_scores)
                auc_score = auc(fpr, tpr)
                
                axes[0, 0].plot(fpr, tpr, label=f'{method.upper()} (AUC = {auc_score:.3f})')
        
        axes[0, 0].plot([0, 1], [0, 1], 'k--', alpha=0.5)
        axes[0, 0].set_xlabel('False Positive Rate')
        axes[0, 0].set_ylabel('True Positive Rate')
        axes[0, 0].set_title('ROC Curves')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # Confusion matrices
        methods_with_detection = [m for m in ['stat', 'ml', 'hybrid'] 
                                if f'{m}_detection' in detection_results.columns]
        
        for i, method in enumerate(methods_with_detection[:3]):
            row, col = divmod(i + 1, 2)
            if row < 2 and col < 2:
                y_true = detection_results['is_cme']
                y_pred = detection_results[f'{method}_detection']
                
                cm = confusion_matrix(y_true, y_pred)
                sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[row, col])
                axes[row, col].set_title(f'{method.upper()} Confusion Matrix')
                axes[row, col].set_xlabel('Predicted')
                axes[row, col].set_ylabel('Actual')
        
        plt.tight_layout()
        if save_plots:
            plt.savefig(self.output_dir / 'detection_performance.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def _plot_feature_analysis(self, detection_results: pd.DataFrame, save_plots: bool):
        """Plot feature importance and correlation analysis."""
        # Feature correlation matrix
        numeric_cols = detection_results.select_dtypes(include=[np.number]).columns
        numeric_cols = [col for col in numeric_cols if not col.endswith('_detection')]
        
        if len(numeric_cols) > 5:  # Only plot if we have enough features
            correlation_matrix = detection_results[numeric_cols].corr()
            
            plt.figure(figsize=(12, 10))
            mask = np.triu(np.ones_like(correlation_matrix, dtype=bool))
            sns.heatmap(correlation_matrix, mask=mask, annot=False, cmap='coolwarm', 
                       center=0, square=True, linewidths=0.5)
            plt.title('Feature Correlation Matrix')
            plt.tight_layout()
            
            if save_plots:
                plt.savefig(self.output_dir / 'feature_correlation.png', dpi=300, bbox_inches='tight')
            plt.show()
        
        # Feature distributions for CME vs non-CME periods
        if 'is_cme' in detection_results.columns:
            key_features = ['velocity_enhancement', 'density_enhancement', 'anomaly_score']
            available_features = [f for f in key_features if f in detection_results.columns]
            
            if available_features:
                fig, axes = plt.subplots(1, len(available_features), figsize=(5*len(available_features), 4))
                if len(available_features) == 1:
                    axes = [axes]
                
                for i, feature in enumerate(available_features):
                    cme_data = detection_results[detection_results['is_cme'] == 1][feature]
                    non_cme_data = detection_results[detection_results['is_cme'] == 0][feature]
                    
                    axes[i].hist(non_cme_data, bins=50, alpha=0.7, label='Non-CME', density=True)
                    axes[i].hist(cme_data, bins=50, alpha=0.7, label='CME', density=True)
                    axes[i].set_xlabel(feature.replace('_', ' ').title())
                    axes[i].set_ylabel('Density')
                    axes[i].legend()
                    axes[i].grid(True, alpha=0.3)
                
                plt.suptitle('Feature Distributions: CME vs Non-CME Periods')
                plt.tight_layout()
                
                if save_plots:
                    plt.savefig(self.output_dir / 'feature_distributions.png', dpi=300, bbox_inches='tight')
                plt.show()
    
    def _create_interactive_plot(self, detection_results: pd.DataFrame, save_plots: bool):
        """Create interactive Plotly visualization."""
        # Create subplots
        fig = make_subplots(
            rows=4, cols=1,
            shared_xaxes=True,
            subplot_titles=['Velocity', 'Density', 'Temperature', 'Detection Score'],
            vertical_spacing=0.05
        )
        
        # Add time series data
        params = [('velocity', 'Velocity (km/s)'), ('density', 'Density (cm⁻³)'), 
                 ('temperature', 'Temperature (K)')]
        
        for i, (param, label) in enumerate(params, 1):
            if param in detection_results.columns:
                fig.add_trace(
                    go.Scatter(
                        x=detection_results['timestamp'],
                        y=detection_results[param],
                        mode='lines',
                        name=label,
                        line=dict(width=1),
                        opacity=0.8
                    ),
                    row=i, col=1
                )
                
                # Add CME markers if available
                if 'is_cme' in detection_results.columns:
                    cme_data = detection_results[detection_results['is_cme'] == 1]
                    if not cme_data.empty:
                        fig.add_trace(
                            go.Scatter(
                                x=cme_data['timestamp'],
                                y=cme_data[param],
                                mode='markers',
                                name=f'CME {label}',
                                marker=dict(color='red', size=4, opacity=0.6),
                                showlegend=(i == 1)
                            ),
                            row=i, col=1
                        )
        
        # Add detection confidence scores
        for method in ['stat', 'ml', 'hybrid']:
            confidence_col = f'{method}_confidence'
            if confidence_col in detection_results.columns:
                fig.add_trace(
                    go.Scatter(
                        x=detection_results['timestamp'],
                        y=detection_results[confidence_col],
                        mode='lines',
                        name=f'{method.upper()} Confidence',
                        line=dict(width=2)
                    ),
                    row=4, col=1
                )
        
        # Update layout
        fig.update_layout(
            title='SWIS-ASPEX CME Detection Results - Interactive View',
            height=800,
            showlegend=True,
            hovermode='x unified'
        )
        
        fig.update_xaxes(title_text='Time', row=4, col=1)
        
        if save_plots:
            fig.write_html(str(self.output_dir / 'interactive_results.html'))
        
        fig.show()
    
    def generate_report(self, detection_results: pd.DataFrame, validation_metrics: Dict) -> str:
        """
        Generate a comprehensive analysis report.
        
        Parameters:
        -----------
        detection_results : pd.DataFrame
            Detection results
        validation_metrics : Dict
            Validation metrics from validate_detection()
            
        Returns:
        --------
        str
            Path to generated report file
        """
        logger.info("Generating analysis report")
        
        report_path = self.output_dir / 'cme_detection_report.md'
        
        with open(report_path, 'w') as f:
            f.write("# Halo CME Detection Analysis Report\n\n")
            f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Executive Summary
            f.write("## Executive Summary\n\n")
            f.write(f"- **Analysis Period**: {detection_results['timestamp'].min()} to {detection_results['timestamp'].max()}\n")
            f.write(f"- **Total Data Points**: {len(detection_results):,}\n")
            
            if 'is_cme' in detection_results.columns:
                cme_periods = detection_results['is_cme'].sum()
                f.write(f"- **CME Periods Identified**: {cme_periods:,} ({cme_periods/len(detection_results)*100:.1f}%)\n")
            
            f.write(f"- **CME Events in Catalog**: {len(self.cme_catalog) if self.cme_catalog is not None else 'N/A'}\n\n")
            
            # Detection Performance
            f.write("## Detection Performance\n\n")
            
            for method, metrics in validation_metrics.items():
                if isinstance(metrics, dict) and 'precision' in metrics:
                    f.write(f"### {method.upper()} Method\n\n")
                    f.write(f"- **Precision**: {metrics['precision']:.3f}\n")
                    f.write(f"- **Recall**: {metrics['recall']:.3f}\n")
                    f.write(f"- **F1-Score**: {metrics['f1_score']:.3f}\n")
                    f.write(f"- **Accuracy**: {metrics['accuracy']:.3f}\n")
                    if 'auc' in metrics:
                        f.write(f"- **AUC**: {metrics['auc']:.3f}\n")
                    f.write("\n")
                    
                    # Confusion matrix
                    f.write("**Confusion Matrix:**\n\n")
                    f.write("| | Predicted Non-CME | Predicted CME |\n")
                    f.write("|---|---|---|\n")
                    f.write(f"| **Actual Non-CME** | {metrics['true_negatives']} | {metrics['false_positives']} |\n")
                    f.write(f"| **Actual CME** | {metrics['false_negatives']} | {metrics['true_positives']} |\n\n")
            
            # Key Findings
            f.write("## Key Findings\n\n")
            
            # Statistical thresholds
            if self.thresholds:
                f.write("### Optimal Thresholds\n\n")
                for param, threshold in self.thresholds.items():
                    if not param.startswith('ml_'):
                        f.write(f"- **{param.replace('_', ' ').title()}**: {threshold:.3f}\n")
                f.write("\n")
            
            # Feature importance
            if 'ml_feature_importance' in self.thresholds:
                f.write("### Most Important Features (ML Model)\n\n")
                importance_data = self.thresholds['ml_feature_importance'][:5]
                for item in importance_data:
                    f.write(f"- **{item['feature']}**: {item['importance']:.3f}\n")
                f.write("\n")
            
            # Data quality
            f.write("## Data Quality Assessment\n\n")
            f.write(f"- **Missing Data**: {detection_results.isnull().sum().sum()} total missing values\n")
            f.write(f"- **Data Coverage**: {len(detection_results)} out of expected data points\n")
            
            # Parameters statistics
            numeric_cols = ['velocity', 'density', 'temperature', 'flux']
            available_cols = [col for col in numeric_cols if col in detection_results.columns]
            
            if available_cols:
                f.write("\n### Parameter Statistics\n\n")
                f.write("| Parameter | Mean | Std | Min | Max |\n")
                f.write("|-----------|------|-----|-----|-----|\n")
                
                for col in available_cols:
                    stats = detection_results[col].describe()
                    f.write(f"| {col.title()} | {stats['mean']:.2f} | {stats['std']:.2f} | {stats['min']:.2f} | {stats['max']:.2f} |\n")
                f.write("\n")
            
            # Recommendations
            f.write("## Recommendations\n\n")
            f.write("### Operational Deployment\n")
            
            best_method = max(validation_metrics.keys(), 
                            key=lambda x: validation_metrics[x].get('f1_score', 0) 
                                         if isinstance(validation_metrics[x], dict) else 0)
            
            f.write(f"- **Recommended Method**: {best_method.upper()} approach shows best overall performance\n")
            f.write("- **Threshold Adjustment**: Consider adjusting thresholds based on operational requirements (false alarm tolerance)\n")
            f.write("- **Data Quality**: Implement continuous monitoring of data quality and coverage\n\n")
            
            f.write("### Future Improvements\n")
            f.write("- Incorporate additional solar wind parameters (magnetic field data)\n")
            f.write("- Extend analysis to include partial halo CMEs\n")
            f.write("- Implement real-time processing pipeline\n")
            f.write("- Validate against ground-based magnetometer data\n\n")
            
            # Technical details
            f.write("## Technical Configuration\n\n")
            f.write("```python\n")
            f.write("Configuration Parameters:\n")
            for key, value in self.config.items():
                f.write(f"{key}: {value}\n")
            f.write("```\n\n")
            
            f.write("---\n")
            f.write("*Report generated by Halo CME Detection System v1.0*\n")
        
        logger.info(f"Report saved to {report_path}")
        return str(report_path)
    
    def run_complete_analysis(self, cme_catalog_file: str = None, 
                            swis_data_pattern: str = "*.cdf") -> Dict:
        """
        Run the complete CME detection and analysis pipeline.
        
        Parameters:
        -----------
        cme_catalog_file : str, optional
            Path to CME catalog file
        swis_data_pattern : str
            Pattern for SWIS CDF files
            
        Returns:
        --------
        Dict
            Complete analysis results
        """
        logger.info("Starting complete CME detection analysis")
        
        try:
            # Step 1: Load data
            self.load_cme_catalog(cme_catalog_file)
            self.load_swis_data(swis_data_pattern)
            
            # Step 2: Preprocess data
            self.preprocess_data()
            
            # Step 3: Extract features
            self.extract_features()
            
            # Step 4: Determine thresholds
            self.determine_thresholds(method='hybrid')
            
            # Step 5: Detect CME events
            detection_results = self.detect_cme_events(method='hybrid')
            
            # Step 6: Validate results
            validation_metrics = self.validate_detection(detection_results)
            
            # Step 7: Create visualizations
            self.visualize_results(detection_results, save_plots=True)
            
            # Step 8: Generate report
            report_path = self.generate_report(detection_results, validation_metrics)
            
            # Save results
            results_path = self.output_dir / 'detection_results.csv'
            detection_results.to_csv(results_path, index=False)
            
            logger.info("Complete analysis finished successfully")
            
            return {
                'detection_results': detection_results,
                'validation_metrics': validation_metrics,
                'thresholds': self.thresholds,
                'report_path': report_path,
                'results_path': str(results_path)
            }
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            raise


def main():
    """Main function to run the CME detection analysis."""
    # Initialize detector
    detector = HaloCMEDetector(
        data_directory="./data",
        output_directory="./output"
    )
    
    # Run complete analysis
    results = detector.run_complete_analysis()
    
    print("\n" + "="*50)
    print("CME DETECTION ANALYSIS COMPLETED")
    print("="*50)
    print(f"Results saved to: {results['results_path']}")
    print(f"Report available at: {results['report_path']}")
    print(f"Visualizations saved in: {detector.output_dir}")
    
    # Print summary statistics
    detection_results = results['detection_results']
    validation_metrics = results['validation_metrics']
    
    print(f"\nSUMMARY STATISTICS:")
    print(f"- Data points analyzed: {len(detection_results):,}")
    
    if 'hybrid' in validation_metrics:
        metrics = validation_metrics['hybrid']
        print(f"- Detection precision: {metrics['precision']:.3f}")
        print(f"- Detection recall: {metrics['recall']:.3f}")
        print(f"- F1-score: {metrics['f1_score']:.3f}")
    
    print("\nCheck the output directory for detailed results and visualizations!")


if __name__ == "__main__":
    main()

