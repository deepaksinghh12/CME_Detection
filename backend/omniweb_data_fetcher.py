#!/usr/bin/env python3
"""
OMNIWeb Data Fetcher — Clean, robust rewrite
============================================

Fetches heliospheric / near-Earth solar wind and geomagnetic parameters
from NASA OMNIWeb (nx1.cgi).

Features:
- Clean parameter handling (no pre-use of variables)
- POST (form-encoded) first, GET fallback
- Safe retries with backoff
- Strict date cleaning (YYYYMMDD)
- Minimal and single-parameter fallbacks on server error messages
- Robust text parser for common OMNIWeb response formats
- Helpful logging

Author: Assistant (adapted for your CME Detection Team)
Date: 2025
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Sequence

import numpy as np
import pandas as pd
import requests

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())


class OMNIWebDataFetcher:
    BASE_URL = "https://omniweb.gsfc.nasa.gov/cgi/nx1.cgi"
    FORM_URL = "https://omniweb.gsfc.nasa.gov/form/dx2_adv.html"
    # NASA SPDF pre-combined files (BEST APPROACH - all parameters in one file)
    # Try multiple possible locations
    SPDF_BASE_URLS = [
        "https://spdf.gsfc.nasa.gov/pub/data/omni/omni_cdaweb/hro_1hr/",
        "https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/",
        "https://cdaweb.gsfc.nasa.gov/pub/data/omni/omni_cdaweb/hro_1hr/",
    ]
    MAX_AVAILABLE_DATE = datetime(2025, 11, 24, 23, 0, 0)

    # Parameter codes - VERIFIED OMNIWeb API codes (from OMNIWeb form)
    # Reference: https://omniweb.gsfc.nasa.gov/form/dx2_adv.html
    # Using ONLY verified codes that are known to work
    PARAMETER_CODES = {
        # ============= MAGNETIC FIELD (VERIFIED) =============
        "bt": 9,                       # IMF Magnitude Avg, nT - VERIFIED
        "bx_gsm": 16,                  # Bx, GSM, nT - VERIFIED
        "by_gsm": 17,                  # By, GSM, nT - VERIFIED
        "bz_gsm": 18,                  # Bz, GSM, nT - VERIFIED
        "bz_gse": 15,                  # Bz, GSE, nT - VERIFIED (from form)
        "imf_latitude": 13,            # Lat. of Avg. IMF, deg. - VERIFIED (from form)
        "imf_longitude": 14,            # Long. of Avg. IMF, deg. - VERIFIED (from form)
        "imf_magnitude_avg": 9,        # Alias for bt
        "bx_gse_gsm": 16,              # Alias (Bx same in GSE/GSM)
        
        # ============= PLASMA (VERIFIED) =============
        "speed": 21,                   # Flow Speed, km/sec - VERIFIED
        "density": 22,                 # Proton Density, n/cc - VERIFIED
        "temperature": 23,             # Proton Temperature, K - VERIFIED
        "flow_longitude": 28,          # Flow Longitude, deg. - VERIFIED
        "flow_latitude": 29,           # Flow Latitude, deg. - VERIFIED
        "alpha_proton_ratio": 30,      # Alpha/Proton Density Ratio - VERIFIED
        
        # Aliases for common names
        "proton_density": 22,
        "proton_temperature": 23,
        "velocity": 21,
        
        # ============= DERIVED PARAMETERS (VERIFIED) =============
        "electric_field": 24,          # Ey - Electric Field, mV/m - VERIFIED
        "plasma_beta": 25,             # Plasma Beta - VERIFIED
        "alfven_mach": 26,             # Alfven Mach Number - VERIFIED
        "flow_pressure": 31,           # Flow Pressure, nPa - VERIFIED
        "magnetosonic_mach": 27,       # Magnetosonic Mach Number - VERIFIED (from form)
        
        # ============= INDICES (VERIFIED) =============
        "kp": 38,                      # Kp*10 Index - VERIFIED
        "dst": 40,                     # Dst Index, nT - VERIFIED
        "ae": 39,                      # AE Index, nT - VERIFIED
        "ap": 46,                      # ap index, nT - VERIFIED
        "f10_7": 47,                   # Solar index F10.7 - VERIFIED
        "sunspot_number": 45,          # R Sunspot Number - VERIFIED
        "al": 48,                      # AL Index, nT - VERIFIED (from form)
        "au": 49,                      # AU Index, nT - VERIFIED (from form)
        
        # ============= PROTON FLUX (VERIFIED from form) =============
        "proton_flux_1mev": 51,        # Proton Flux > 1 MeV - VERIFIED
        "proton_flux_2mev": 52,        # Proton Flux > 2 MeV - VERIFIED
        "proton_flux_4mev": 53,        # Proton Flux > 4 MeV - VERIFIED
        "proton_flux_10mev": 54,       # Proton Flux > 10 MeV - VERIFIED
        "proton_flux_30mev": 55,       # Proton Flux > 30 MeV - VERIFIED
        "proton_flux_60mev": 56,       # Proton Flux > 60 MeV - VERIFIED
    }

    PARAMETER_ALIASES = {
        "alfven_mach_number": "alfven_mach",
        "alfvenmach": "alfven_mach",
        "alfven_machnum": "alfven_mach",
        "alfven_mach_num": "alfven_mach",
        "mach_alfven": "alfven_mach",
        "mach_number_alfven": "alfven_mach",
        "plasma_beta_ratio": "plasma_beta",
        "dynamic_pressure": "flow_pressure",
    }

    def __init__(self, user_agent: str = "CME-Detection-System/1.0 (Research)"):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
        self.max_available_date = self.MAX_AVAILABLE_DATE
        # Consider setting a session.verify=False only if you have to skip TLS verify (not recommended)

    # -------------------------
    # Public fetch methods
    # -------------------------
    def fetch_data(
        self,
        start_date: datetime,
        end_date: datetime,
        parameters: Optional[List[str]] = None,
        resolution: str = "hourly",
        retries: int = 2,
        retry_backoff: float = 1.0,
        use_multi_request: bool = True,
        use_csv_approach: bool = True,  # NEW: Use pre-combined CSV files (BEST)
    ) -> pd.DataFrame:
        """
        Fetch OMNIWeb data between start_date and end_date (inclusive/exclusive per OMNI behavior).

        Parameters:
            start_date, end_date : datetime
            parameters: list of keys from PARAMETER_CODES (if None, uses a common default)
            resolution: 'hourly' or '5min'
            retries: number of extra attempts on network errors
            retry_backoff: seconds multiplier for backoff

        Returns:
            pandas.DataFrame with 'timestamp' + parameter columns (may be empty on failure)
        """
        if parameters is None:
            parameters = [
                "bx_gsm",
                "by_gsm",
                "bz_gsm",
                "bt",
                "speed",
                "density",
                "temperature",
                "plasma_beta",
                "alfven_mach",
            ]

        normalized_parameters: List[str] = []
        for param in parameters:
            normalized = self.PARAMETER_ALIASES.get(param, param)
            if normalized != param:
                logger.debug("Normalized OMNI parameter '%s' -> '%s'", param, normalized)
            normalized_parameters.append(normalized)

        # Preserve order but drop duplicates after normalization
        seen = set()
        parameters = []
        for param in normalized_parameters:
            if param not in seen:
                parameters.append(param)
                seen.add(param)

        # Sanitize incoming dates (strip timezone info/microseconds if present)
        start_date = start_date.replace(minute=0, second=0, microsecond=0)
        end_date = end_date.replace(second=0, microsecond=0)
        
        # PRIORITY 1: Try local CSV file first (pre-converted from HTML - FASTEST!)
        # If CSV exists, use it and STOP - no need to try HTML or NASA SPDF
        csv_file_path = "downloads/omni_complete_data.csv"
        try:
            from pathlib import Path
            if Path(csv_file_path).exists():
                csv_df = pd.read_csv(csv_file_path, parse_dates=['timestamp'])
                csv_df = csv_df[(csv_df['timestamp'] >= start_date) & (csv_df['timestamp'] <= end_date)]
                
                if not csv_df.empty:
                    # Filter to requested parameters if specified
                    if parameters:
                        available_params = [p for p in parameters if p in csv_df.columns]
                        csv_df = csv_df[['timestamp'] + available_params].copy()
                        
                        # Add missing parameters as NaN
                        for param in parameters:
                            if param not in csv_df.columns:
                                csv_df[param] = np.nan
                    
                    # Clean fill values from CSV data
                    numeric_cols = csv_df.select_dtypes(include=[np.number]).columns
                    fill_values = [999.9, 99999.9, 999999.99, 9999999.0, -999.9, -99999.9, -999999.99]
                    for col in numeric_cols:
                        if col == 'timestamp':
                            continue
                        # Replace fill values with NaN
                        for fill_val in fill_values:
                            csv_df.loc[csv_df[col] == fill_val, col] = np.nan
                        # Replace extreme values
                        csv_df.loc[csv_df[col].abs() > 9e4, col] = np.nan
                    
                    return csv_df
        except Exception as e:
            logger.warning(f"CSV file loading failed: {e}, will try other sources")
        
        # FALLBACK 2: Try HTML file (ONLY if CSV not available)
        html_file_paths = [
            "downloads/OMNIWeb Results_2.html",  # New complete file
            "downloads/OMNIWeb Results.html",     # Original file
            "downloads/omniweb_results.html",    # Alternative name
        ]
        
        for html_file_path in html_file_paths:
            try:
                from pathlib import Path
                if Path(html_file_path).exists():
                    logger.info(f"📥 CSV not available, trying HTML file: {html_file_path}...")
                    html_df = self._fetch_from_html_file(html_file_path, start_date, end_date, parameters)
                    if not html_df.empty:
                        logger.info(f"✅ Successfully parsed {len(html_df)} rows from HTML file: {html_file_path}")
                        return html_df
            except Exception as e:
                logger.debug(f"HTML file parsing failed for {html_file_path}: {e}")
                continue
        
        # FALLBACK 3: Try NASA SPDF CSV files (ONLY if local CSV and HTML not available)
        if use_csv_approach and resolution == "hourly":
            try:
                logger.info("📥 Local CSV/HTML not available, attempting to fetch from NASA SPDF...")
                csv_df = self._fetch_from_csv_files(start_date, end_date, parameters)
                if not csv_df.empty:
                    logger.info(f"✅ Successfully fetched {len(csv_df)} rows from NASA SPDF CSV files")
                    return csv_df
                else:
                    logger.warning("⚠️ NASA SPDF CSV fetch returned empty, falling back to CGI API...")
            except Exception as e:
                logger.warning(f"⚠️ NASA SPDF CSV fetch failed ({e}), falling back to CGI API...")
        
        # FALLBACK: Original CGI API approach
        # OMNIWeb API LIMITATION: Cannot fetch all parameters in single request
        # Split into compatible groups and fetch separately, then merge
        if use_multi_request and len(parameters) > 15:
            logger.info(f"⚠️ OMNIWeb limitation: {len(parameters)} parameters requested. Splitting into groups...")
            return self._fetch_data_multi_request(start_date, end_date, parameters, resolution, retries, retry_backoff)

        requested_span = end_date - start_date
        if requested_span <= timedelta(0):
            requested_span = timedelta(hours=6)

        if self.max_available_date and end_date > self.max_available_date:
            logger.warning(
                "OMNIWeb currently provides data only up to %s UTC; clamping requested end_date %s",
                self.max_available_date,
                end_date,
            )
            end_date = self.max_available_date

        if start_date > end_date:
            logger.warning(
                "Requested start_date %s exceeds OMNI availability; shifting window backwards by %s",
                start_date,
                requested_span,
            )
            start_date = end_date - requested_span
        logger.debug("caller start_date: %s (%s)", start_date, type(start_date).__name__)
        logger.debug("caller end_date: %s (%s)", end_date, type(end_date).__name__)

        logger.info("Fetching OMNIWeb data from %s to %s", start_date, end_date)
        logger.info("Requested parameters: %s; resolution=%s", parameters, resolution)

        # Clean & validate dates
        start_str = self._clean_date(start_date)
        end_str = self._clean_date(end_date)
        if not start_str or not end_str:
            logger.error("Invalid start/end dates after cleaning")
            return pd.DataFrame()

        logger.info("OMNIWeb CLEAN date range: start_date='%s', end_date='%s'", start_str, end_str)

        # Resolve parameter codes (parameters are already normalized above)
        param_codes = []
        skipped_params = []
        for p in parameters:
            if p in self.PARAMETER_CODES:
                code = self.PARAMETER_CODES[p]
                # Avoid duplicate codes
                if code not in param_codes:
                    param_codes.append(code)
                else:
                    logger.debug(f"Parameter '{p}' (code {code}) already included, skipping duplicate")
            else:
                skipped_params.append(p)
                # Don't warn for parameters that are aliases (they should have been normalized)
                if p not in self.PARAMETER_ALIASES:
                    logger.debug("Unknown parameter requested: %s (skipping) - Available parameters: %s", p, list(self.PARAMETER_CODES.keys())[:10])
        
        if skipped_params:
            # Only warn if there are actually unknown parameters (not just aliases)
            unknown_params = [p for p in skipped_params if p not in self.PARAMETER_ALIASES]
            if unknown_params:
                logger.warning(f"⚠️ Skipped {len(unknown_params)} unknown parameters: {unknown_params}")
            else:
                logger.debug(f"⚠️ Skipped {len(skipped_params)} parameters (aliases): {skipped_params}")
        logger.info(f"✅ Using {len(param_codes)} parameter codes: {param_codes}")

        if not param_codes:
            logger.error("No valid parameter codes to request")
            return pd.DataFrame()

        # Build vars string safely - ensure param_codes_int is always defined
        param_codes_int = []  # Initialize before try block to avoid scope issues
        try:
            param_codes_int = [int(x) for x in param_codes if x is not None]
            if not param_codes_int:
                logger.error("No valid parameter codes after conversion to int")
                return pd.DataFrame()
        except (ValueError, TypeError) as e:
            logger.error("Invalid param codes: %s (%s)", param_codes, e)
            return pd.DataFrame()
        
        # Ensure param_codes_int is always defined (defensive programming)
        if not param_codes_int:
            logger.error("param_codes_int is empty after processing")
            return pd.DataFrame()

        def _clean(value: str) -> str:
            return str(value).strip().replace("\n", "").replace("\r", "")

        res_value = "hour" if resolution == "hourly" else "5min"

        params_list: List[Tuple[str, str]] = [
            ("activity", _clean("retrieve")),
            ("res", _clean(res_value)),
            ("spacecraft", _clean("omni2")),
            ("start_date", _clean(start_str)),
            ("end_date", _clean(end_str)),  # CRITICAL: NASA uses 'end_date' not 'stop_date'
            ("format", _clean("text")),
        ]
        for code in param_codes_int:
            params_list.append(("vars", _clean(str(code))))

        logger.debug(
            "Prepared OMNIWeb params: %s",
            "&".join(f"{k}={v}" for k, v in params_list),
        )

        # Try requests (GET first - more reliable for OMNIWeb)
        attempt = 0
        last_exc: Optional[Exception] = None
        last_error_text = None
        
        while attempt <= retries:
            try:
                # Try GET first (more reliable for OMNIWeb API)
                logger.debug(f"Attempt {attempt + 1}/{retries + 1}: Trying GET request")
                response = self._send_omni_request("GET", params_list)
                text = response.text
                logger.info("OMNIWeb GET response length: %d", len(text))
                
                # Quick check for server-side error messages
                if self._looks_like_omni_error(text):
                    last_error_text = self._preview(text, 500)
                    logger.error("OMNIWeb GET returned error: %s", last_error_text)
                    # Try POST as fallback
                    try:
                        logger.debug("Trying POST as fallback")
                        response = self._send_omni_request("POST", params_list)
                        text = response.text
                        logger.info("OMNIWeb POST fallback response length: %d", len(text))
                        if self._looks_like_omni_error(text):
                            last_error_text = self._preview(text, 500)
                            logger.error("OMNIWeb POST also returned error: %s", last_error_text)
                            # Try minimal parameters
                            if attempt == retries:  # Only on last attempt
                                logger.info("Attempting minimal parameter fallback...")
                                df = self._try_minimal_and_single(res_value, start_str, end_str, resolution)
                                if not df.empty:
                                    return df
                            raise ValueError(f"OMNIWeb error: {last_error_text}")
                    except requests.RequestException:
                        pass  # Continue to retry
                
                # If response looks ok, parse it
                df = self._parse_omniweb_response(text, parameters)
                if df.empty:
                    logger.warning("Parsed DataFrame is empty after parsing OMNI response.")
                    if attempt < retries:
                        logger.info("Retrying with different approach...")
                        attempt += 1
                        time.sleep(retry_backoff * (1.5 ** attempt))
                        continue
                    # Last attempt - try minimal
                    logger.info("Trying minimal parameter fallback as last resort...")
                    df = self._try_minimal_and_single(res_value, start_str, end_str, resolution)
                    return df
                else:
                    # Log actual date range of fetched data
                    if not df.empty and 'timestamp' in df.columns:
                        df['timestamp'] = pd.to_datetime(df['timestamp'])
                        min_date = df['timestamp'].min()
                        max_date = df['timestamp'].max()
                        logger.info("✅ Successfully fetched %d data points from OMNIWeb", len(df))
                        logger.info("   Actual data range: %s to %s (requested: %s to %s)", 
                                   min_date.date(), max_date.date(), start_date.date(), end_date.date())
                    else:
                        logger.info("✅ Successfully fetched %d data points from OMNIWeb", len(df))
                    return df
                    
            except requests.RequestException as rexc:
                last_exc = rexc
                logger.warning("Network/request error (attempt %d/%d): %s", attempt + 1, retries + 1, rexc)
                if attempt < retries:
                    time.sleep(retry_backoff * (1.5 ** attempt))
                attempt += 1
            except ValueError as vexc:
                # OMNIWeb API error (not network error)
                last_exc = vexc
                logger.error("OMNIWeb API error: %s", vexc)
                if attempt < retries:
                    # Try with fewer parameters
                    logger.info("Retrying with reduced parameter set...")
                    # Reduce to core parameters only
                    core_params = ['speed', 'density', 'temperature', 'bt', 'bz_gsm']
                    core_codes = [self.PARAMETER_CODES.get(p) for p in core_params if p in self.PARAMETER_CODES]
                    if core_codes:
                        # Convert to int list safely
                        try:
                            core_codes_int = [int(c) for c in core_codes if c is not None]
                        except (ValueError, TypeError):
                            core_codes_int = []
                        
                        if core_codes_int:
                            params_list_core = [
                                ("activity", "retrieve"),
                                ("res", res_value),
                                ("spacecraft", "omni2"),
                                ("start_date", start_str),
                                ("end_date", end_str),
                                ("format", "text"),
                            ]
                            params_list_core.extend([("vars", str(c)) for c in core_codes_int])
                            params_list = params_list_core
                            parameters = core_params
                            logger.info(f"Retrying with {len(core_params)} core parameters: {core_params}")
                attempt += 1
            except Exception as exc:
                last_exc = exc
                logger.exception("Unexpected error while fetching OMNIWeb data: %s", exc)
                if attempt < retries:
                    time.sleep(retry_backoff * (1.5 ** attempt))
                attempt += 1

        # Final fallback: try minimal parameters
        logger.warning("All retry attempts failed. Trying minimal parameter fallback...")
        df = self._try_minimal_and_single(res_value, start_str, end_str, resolution)
        if df.empty:
            logger.error("❌ OMNIWeb fetch completely failed. Last error: %s", last_exc or last_error_text or "Unknown")
        return df

    # -------------------------
    # Helper: send request
    # -------------------------
    def _send_omni_request(self, method: str, params: Sequence[Tuple[str, str]]) -> requests.Response:
        """
        Send the OMNIWeb request. POST uses form-encoded body (application/x-www-form-urlencoded).
        GET uses URL params.
        """
        method = method.upper()
        if method == "POST":
            logger.debug("Sending OMNIWeb POST (form-encoded)")
            resp = self.session.post(
                self.BASE_URL,
                data=params,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=90,
            )
        else:
            logger.debug("Sending OMNIWeb GET")
            resp = self.session.get(self.BASE_URL, params=params, timeout=90)
        resp.raise_for_status()
        return resp

    # -------------------------
    # Fallback attempts
    # -------------------------
    def _try_minimal_and_single(self, res_value: str, start_str: str, end_str: str, resolution: str) -> pd.DataFrame:
        """
        Try minimal parameters (speed,density,temperature), then single parameter (speed=21).
        Used when server returns textual error messages.
        """
        minimal_params = ["speed", "density", "temperature"]
        minimal_codes = [self.PARAMETER_CODES[p] for p in minimal_params if p in self.PARAMETER_CODES]
        if minimal_codes:
            params_min: List[Tuple[str, str]] = [
                ("activity", "retrieve"),
                ("res", res_value),
                ("spacecraft", "omni2"),
                ("start_date", start_str),
                ("end_date", end_str),  # CRITICAL: NASA uses 'end_date' not 'stop_date'
                ("format", "text"),
            ]
            params_min.extend([("vars", str(code)) for code in minimal_codes])
            try:
                resp = self._send_omni_request("GET", params_min)
                txt = resp.text
                if not self._looks_like_omni_error(txt) and len(txt) > 100:
                    df = self._parse_omniweb_response(txt, minimal_params)
                    if not df.empty:
                        logger.info("Minimal-parameter request succeeded with %d rows", len(df))
                        return df
            except Exception as e:
                logger.warning("Minimal parameter attempt failed: %s", e)

        # Try single parameter: speed=21
        params_single: List[Tuple[str, str]] = [
            ("activity", "retrieve"),
            ("res", res_value),
            ("spacecraft", "omni2"),
            ("start_date", start_str),
            ("end_date", end_str),  # CRITICAL: NASA uses 'end_date' not 'stop_date'
            ("format", "text"),
            ("vars", "21"),
        ]
        try:
            resp = self._send_omni_request("GET", params_single)
            txt = resp.text
            if not self._looks_like_omni_error(txt) and len(txt) > 100:
                df = self._parse_omniweb_response(txt, ["speed"])
                logger.info("Single-parameter (speed) request succeeded with %d rows", len(df))
                return df
        except Exception as e:
            logger.warning("Single-parameter attempt failed: %s", e)

        logger.error("Minimal and single-parameter fallbacks both failed.")
        return pd.DataFrame()

    # -------------------------
    # Parser
    # -------------------------
    def _parse_omniweb_response(self, text: str, parameters: List[str]) -> pd.DataFrame:
        """
        Parse the OMNIWeb text response into a DataFrame with 'timestamp' + requested parameters.

        The parser handles:
        - YEAR DOY HR <values...>
        - YYYYMMDD HH <values...>
        - Skips HTML blocks and server error blocks
        """
        if not text or len(text.strip()) < 10:
            logger.warning("Empty or too-short OMNIWeb response.")
            return pd.DataFrame()

        # Quick check for HTML error block
        lowered = text.lower()
        if "<html" in lowered and ("error" in lowered or "wrong value" in lowered):
            logger.error("OMNIWeb HTML error returned.")
            return pd.DataFrame()

        lines = text.splitlines()
        # Remove purely HTML lines upfront
        filtered = [ln for ln in lines if not ln.strip().lower().startswith("<")]

        # Find header / start of data and extract parameter order from OMNIWeb response
        data_start = None
        parameter_order = []  # Will be populated from header
        header_param_map = {}  # Maps column index -> parameter name (must be accessible later)
        
        # Look for parameter header lines (format: "1 BZ, nT (GSM)")
        # These appear before the data starts
        for idx, ln in enumerate(filtered):
            up = ln.upper()
            # Check if this line starts with a number followed by parameter description
            # This indicates the parameter list header
            if ln.strip() and ln.strip()[0].isdigit() and any(keyword in up for keyword in ['BZ', 'BX', 'BY', 'MAGNITUDE', 'SPEED', 'DENSITY', 'TEMPERATURE']):
                # Found parameter header - parse backwards and forwards
                header_start = max(0, idx - 5)  # Look a few lines before
                header_end = min(len(filtered), idx + 20)  # Look ahead for more parameters
                
                # Parse all parameter header lines
                for j in range(header_start, header_end):
                    header_line = filtered[j].strip()
                    header_upper = header_line.upper()
                    
                    # Stop when we hit data (YEAR DOY HR format)
                    if header_line and header_line[0].isdigit() and len(header_line.split()) > 3:
                        parts = header_line.split()
                        if len(parts) >= 3 and parts[0].isdigit() and len(parts[0]) == 4:
                            try:
                                year = int(parts[0])
                                if 1950 <= year <= 2100:  # Valid year range
                                    break
                            except:
                                pass
                    
                    # Skip if not a parameter description line (should start with number)
                    if not header_line or not header_line[0].isdigit():
                        continue
                    
                    # Extract column number (format: "1 BZ, nT (GSM)")
                    try:
                        col_num = int(header_line.split()[0])
                        col_idx = col_num - 1  # Convert to 0-based index
                    except:
                        continue
                    
                    # Match this header line to one of our requested parameters
                    matched_param = None
                    
                    # Magnetic field parameters
                    if 'BZ' in header_upper and ('GSM' in header_upper or 'GSE' in header_upper) and 'bz_gsm' in parameters:
                        matched_param = 'bz_gsm'
                    elif 'BX' in header_upper and ('GSM' in header_upper or 'GSE' in header_upper) and 'bx_gsm' in parameters:
                        matched_param = 'bx_gsm'
                    elif 'BY' in header_upper and ('GSM' in header_upper or 'GSE' in header_upper) and 'by_gsm' in parameters:
                        matched_param = 'by_gsm'
                    elif ('VECTOR' in header_upper and 'B' in header_upper and 'MAGNITUDE' in header_upper) and 'bt' in parameters:
                        matched_param = 'bt'
                    elif ('MAGNITUDE' in header_upper and 'B' in header_upper and 'VECTOR' not in header_upper) and 'bt' in parameters:
                        matched_param = 'bt'
                    
                    # Plasma parameters
                    elif ('SPEED' in header_upper or 'VELOCITY' in header_upper or 'FLOW SPEED' in header_upper) and 'speed' in parameters:
                        matched_param = 'speed'
                    elif 'DENSITY' in header_upper and 'PROTON' in header_upper and 'density' in parameters:
                        matched_param = 'density'
                    elif 'TEMPERATURE' in header_upper and ('PLASMA' in header_upper or 'PROTON' in header_upper) and 'temperature' in parameters:
                        matched_param = 'temperature'
                    elif ('LONGITUDE' in header_upper or 'PHI' in header_upper) and 'flow_longitude' in parameters:
                        matched_param = 'flow_longitude'
                    elif ('LATITUDE' in header_upper or 'THETA' in header_upper) and 'flow_latitude' in parameters:
                        matched_param = 'flow_latitude'
                    elif ('PRESSURE' in header_upper or 'PDYN' in header_upper) and 'flow_pressure' in parameters:
                        matched_param = 'flow_pressure'
                    elif ('ALPHA' in header_upper or 'HE++' in header_upper) and 'alpha_proton_ratio' in parameters:
                        matched_param = 'alpha_proton_ratio'
                    
                    # Derived parameters
                    elif ('ELECTRIC' in header_upper or 'E-FIELD' in header_upper or 'EY' in header_upper) and 'electric_field' in parameters:
                        matched_param = 'electric_field'
                    elif 'BETA' in header_upper and 'plasma_beta' in parameters:
                        matched_param = 'plasma_beta'
                    elif 'ALFVEN' in header_upper and 'MACH' in header_upper and 'alfven_mach' in parameters:
                        matched_param = 'alfven_mach'
                    elif 'MAGNETOSONIC' in header_upper and 'magnetosonic_mach' in parameters:
                        matched_param = 'magnetosonic_mach'
                    
                    # Geomagnetic indices
                    elif 'DST' in header_upper and 'INDEX' in header_upper and 'dst' in parameters:
                        matched_param = 'dst'
                    elif 'KP' in header_upper and ('INDEX' in header_upper or '*' in header_line) and 'kp' in parameters:
                        matched_param = 'kp'
                    elif 'AE' in header_upper and 'INDEX' in header_upper and 'ae' in parameters:
                        matched_param = 'ae'
                    elif 'AP' in header_upper and 'INDEX' in header_upper and 'ap' in parameters:
                        matched_param = 'ap'
                    elif 'AL' in header_upper and 'INDEX' in header_upper and 'al' in parameters:
                        matched_param = 'al'
                    elif 'AU' in header_upper and 'INDEX' in header_upper and 'au' in parameters:
                        matched_param = 'au'
                    
                    # Solar indices
                    elif ('F10.7' in header_line or 'F107' in header_upper) and 'f10_7' in parameters:
                        matched_param = 'f10_7'
                    elif 'SUNSPOT' in header_upper and 'sunspot_number' in parameters:
                        matched_param = 'sunspot_number'
                    
                    # Proton flux
                    elif '10' in header_line and 'MEV' in header_upper and 'proton_flux_10mev' in parameters:
                        matched_param = 'proton_flux_10mev'
                    elif '30' in header_line and 'MEV' in header_upper and 'proton_flux_30mev' in parameters:
                        matched_param = 'proton_flux_30mev'
                    
                    # Only map if parameter is requested and not already mapped
                    if matched_param and matched_param in parameters and matched_param not in header_param_map.values():
                        header_param_map[col_idx] = matched_param
                        parameter_order.append(matched_param)
                        logger.debug(f"Mapped OMNIWeb column {col_idx+1} '{header_line}' → '{matched_param}'")
                
                if parameter_order:
                    logger.info(f"✅ Extracted {len(parameter_order)}/{len(parameters)} parameters from OMNIWeb header")
                    logger.debug(f"   Parameter order: {parameter_order}")
                    logger.debug(f"   Column mapping: {header_param_map}")
                    break
            
            # Also check for "SELECTED PARAMETERS" text (fallback)
            if "SELECTED PARAMETERS" in up:
                # Parse header lines that list parameters with numbers
                # OMNIWeb format: "1 BZ, nT (GSM)" - number indicates column position
                for j in range(idx + 1, min(idx + 100, len(filtered))):
                    header_line = filtered[j].strip()
                    header_upper = header_line.upper()
                    
                    # Stop when we hit data (YEAR DOY HR format)
                    if header_line and header_line[0].isdigit() and len(header_line.split()) > 3:
                        # Check if it's a data line (has year like 2023)
                        parts = header_line.split()
                        if len(parts) >= 3 and parts[0].isdigit() and len(parts[0]) == 4:
                            try:
                                year = int(parts[0])
                                if 1950 <= year <= 2100:  # Valid year range
                                    break
                            except:
                                pass
                    
                    # Skip if not a parameter description line (should start with number)
                    if not header_line or not header_line[0].isdigit():
                        continue
                    
                    # Extract column number (format: "1 BZ, nT (GSM)")
                    try:
                        col_num = int(header_line.split()[0])
                        col_idx = col_num - 1  # Convert to 0-based index
                    except:
                        continue
                    
                    # Match this header line to one of our requested parameters
                    # Use comprehensive matching based on actual OMNIWeb header formats
                    matched_param = None
                    
                    # Magnetic field parameters - check BZ/BX/BY with coordinate system
                    if 'BZ' in header_upper and 'GSM' in header_upper and 'bz_gsm' in parameters and 'RMS' not in header_upper:
                        matched_param = 'bz_gsm'
                    elif 'BZ' in header_upper and 'GSE' in header_upper and 'bz_gse' in parameters and 'RMS' not in header_upper:
                        matched_param = 'bz_gse'
                    elif 'BX' in header_upper and ('GSM' in header_upper or 'GSE' in header_upper) and 'bx_gsm' in parameters and 'RMS' not in header_upper:
                        matched_param = 'bx_gsm'
                    elif 'BY' in header_upper and 'GSM' in header_upper and 'by_gsm' in parameters and 'RMS' not in header_upper:
                        matched_param = 'by_gsm'
                    elif 'BY' in header_upper and 'GSE' in header_upper and 'by_gsm' in parameters and 'RMS' not in header_upper:
                        # BY GSE can map to by_gsm
                        matched_param = 'by_gsm'
                    elif ('VECTOR' in header_upper and 'B' in header_upper and 'MAGNITUDE' in header_upper) and 'bt' in parameters:
                        matched_param = 'bt'
                    elif ('MAGNITUDE' in header_upper and 'B' in header_upper and 'VECTOR' not in header_upper and 'RMS' not in header_upper) and 'bt' in parameters:
                        matched_param = 'bt'
                    elif ('LAT' in header_upper and 'IMF' in header_upper) and 'imf_latitude' in parameters:
                        matched_param = 'imf_latitude'
                    elif ('LONG' in header_upper and 'IMF' in header_upper) and 'imf_longitude' in parameters:
                        matched_param = 'imf_longitude'
                    
                    # Plasma parameters
                    elif ('SPEED' in header_upper or 'VELOCITY' in header_upper or 'FLOW SPEED' in header_upper) and 'speed' in parameters:
                        matched_param = 'speed'
                    elif 'DENSITY' in header_upper and 'PROTON' in header_upper and 'density' in parameters:
                        matched_param = 'density'
                    elif 'TEMPERATURE' in header_upper and ('PLASMA' in header_upper or 'PROTON' in header_upper) and 'temperature' in parameters:
                        matched_param = 'temperature'
                    elif ('FLOW' in header_upper and 'LONGITUDE' in header_upper) and 'flow_longitude' in parameters:
                        matched_param = 'flow_longitude'
                    elif ('FLOW' in header_upper and 'LATITUDE' in header_upper) and 'flow_latitude' in parameters:
                        matched_param = 'flow_latitude'
                    elif ('PRESSURE' in header_upper or 'PDYN' in header_upper or 'FLOW PRESSURE' in header_upper) and 'flow_pressure' in parameters:
                        matched_param = 'flow_pressure'
                    elif ('ALPHA' in header_upper or 'HE++' in header_upper) and 'alpha_proton_ratio' in parameters:
                        matched_param = 'alpha_proton_ratio'
                    
                    # Derived parameters
                    elif ('ELECTRIC' in header_upper or 'E-FIELD' in header_upper or 'EY' in header_upper) and 'electric_field' in parameters:
                        matched_param = 'electric_field'
                    elif 'BETA' in header_upper and 'PLASMA' in header_upper and 'plasma_beta' in parameters:
                        matched_param = 'plasma_beta'
                    elif 'ALFVEN' in header_upper and 'MACH' in header_upper and 'alfven_mach' in parameters:
                        matched_param = 'alfven_mach'
                    elif ('MAGNETOSONIC' in header_upper or 'MUCH' in header_upper) and 'MACH' in header_upper and 'magnetosonic_mach' in parameters:
                        matched_param = 'magnetosonic_mach'
                    
                    # Geomagnetic indices - more flexible matching
                    elif ('DST' in header_upper or 'DST-INDEX' in header_upper) and 'dst' in parameters:
                        matched_param = 'dst'
                    elif ('KP' in header_upper or 'KP INDEX' in header_upper) and 'kp' in parameters:
                        matched_param = 'kp'
                    elif ('AE' in header_upper and 'INDEX' in header_upper) and 'ae' in parameters:
                        matched_param = 'ae'
                    elif ('AP' in header_upper and ('INDEX' in header_upper or 'index' in header_line.lower())) and 'ap' in parameters:
                        matched_param = 'ap'
                    elif ('AL' in header_upper and ('INDEX' in header_upper or 'AL-INDEX' in header_upper)) and 'al' in parameters:
                        matched_param = 'al'
                    elif ('AU' in header_upper and ('INDEX' in header_upper or 'AU-INDEX' in header_upper)) and 'au' in parameters:
                        matched_param = 'au'
                    
                    # Solar indices
                    elif ('F10.7' in header_line or 'F107' in header_upper) and 'f10_7' in parameters:
                        matched_param = 'f10_7'
                    elif ('SUNSPOT' in header_upper or ('R' in header_line and 'SUNSPOT' in header_upper)) and 'sunspot_number' in parameters:
                        matched_param = 'sunspot_number'
                    
                    # Proton flux - check all energy levels (order matters - check higher energies first to avoid false matches)
                    elif '60' in header_line and 'MEV' in header_upper and 'proton_flux_60mev' in parameters:
                        matched_param = 'proton_flux_60mev'
                    elif '30' in header_line and 'MEV' in header_upper and 'proton_flux_30mev' in parameters and '60' not in header_line:
                        matched_param = 'proton_flux_30mev'
                    elif '10' in header_line and 'MEV' in header_upper and 'proton_flux_10mev' in parameters and '30' not in header_line and '60' not in header_line:
                        matched_param = 'proton_flux_10mev'
                    elif '4' in header_line and 'MEV' in header_upper and 'proton_flux_4mev' in parameters and '10' not in header_line and '30' not in header_line and '60' not in header_line:
                        matched_param = 'proton_flux_4mev'
                    elif '2' in header_line and 'MEV' in header_upper and 'proton_flux_2mev' in parameters and '4' not in header_line and '10' not in header_line and '30' not in header_line and '60' not in header_line:
                        matched_param = 'proton_flux_2mev'
                    elif '1' in header_line and 'MEV' in header_upper and 'proton_flux_1mev' in parameters and '2' not in header_line and '4' not in header_line and '10' not in header_line and '30' not in header_line and '60' not in header_line:
                        matched_param = 'proton_flux_1mev'
                    
                    # Only map if parameter is requested and not already mapped
                    if matched_param and matched_param in parameters and matched_param not in header_param_map.values():
                        header_param_map[col_idx] = matched_param
                        parameter_order.append(matched_param)
                        logger.debug(f"Mapped OMNIWeb column {col_idx+1} '{header_line}' → '{matched_param}'")
                
                if parameter_order:
                    logger.info(f"✅ Extracted {len(parameter_order)}/{len(parameters)} parameters from OMNIWeb header")
                    logger.debug(f"   Parameter order: {parameter_order}")
                    logger.debug(f"   Column mapping: {header_param_map}")
                    break
            
            if any(h in up for h in ("YEAR", "DATE", "TIME")):
                data_start = idx + 1
                break

        if data_start is None:
            # find first numeric-looking line (year or YYYYMMDD)
            for idx, ln in enumerate(filtered):
                parts = ln.strip().split()
                if len(parts) >= 3:
                    first = parts[0]
                    if first.isdigit() and (len(first) == 4 or len(first) == 8):
                        data_start = idx
                        break

        if data_start is None:
            logger.warning("Could not find data start in OMNI response.")
            return pd.DataFrame()
        
        # If we couldn't extract order from header, we need a fallback
        # But we should ONLY use header_param_map for parameters we found
        # Missing parameters will be set to NaN (they're not in OMNIWeb response)
        if len(parameter_order) < len(parameters):
            missing_params = [p for p in parameters if p not in parameter_order]
            if missing_params:
                logger.warning(f"⚠️ {len(missing_params)} parameters not found in OMNIWeb response: {missing_params}")
                logger.info(f"✅ Using header mapping for {len(parameter_order)} found parameters")
        else:
            logger.info(f"✅ Successfully mapped all {len(parameter_order)} parameters from OMNIWeb header")
        
        # Use parameter_order for mapping (OMNIWeb's order, not our request order)
        parameters = parameter_order

        data_rows = []
        for ln in filtered[data_start:]:
            ln = ln.strip()
            if not ln or ln.startswith("#"):
                continue
            parts = ln.split()
            if len(parts) < 3:
                continue
            first = parts[0].strip()
            try:
                if first.isdigit() and len(first) == 4:
                    # YEAR DOY HR ...
                    year = int(first)
                    doy = int(parts[1])
                    hour = int(parts[2]) if len(parts) > 2 else 0
                    dt = datetime(year, 1, 1) + timedelta(days=doy - 1)
                    dt = dt.replace(hour=hour, minute=0, second=0, microsecond=0)
                    values = parts[3:]
                elif first.isdigit() and len(first) == 8:
                    # YYYYMMDD HH ...
                    date_str = first
                    year = int(date_str[0:4])
                    month = int(date_str[4:6])
                    day = int(date_str[6:8])
                    hour = int(parts[1]) if len(parts) > 1 else 0
                    dt = datetime(year, month, day, hour, 0, 0)
                    values = parts[2:]
                else:
                    # unknown format
                    continue

                # Convert values to floats, map typical OMNI fill values -> NaN
                float_vals = []
                fill_values = [999.9, 999.99, 9999.9, 9999.99, 99999.9, 99999.99, 999999.9, 9999999.0, 99999999.0]
                for v in values:
                    try:
                        fv = float(v)
                        # Check for fill values (OMNIWeb uses various sentinel values)
                        if abs(fv) > 9e4 or fv in fill_values:
                            float_vals.append(np.nan)
                        else:
                            float_vals.append(fv)
                    except (ValueError, TypeError):
                        float_vals.append(np.nan)

                # Map parsed floats to requested parameters
                # IMPORTANT: Use header_param_map to map column positions to parameter names
                if float_vals:
                    row = {"timestamp": dt}
                    
                    # CRITICAL: Map values using header_param_map (column index -> parameter name)
                    # This ensures we use the EXACT column mapping from OMNIWeb header
                    for col_idx, pname in header_param_map.items():
                        if col_idx < len(float_vals):
                            val = float_vals[col_idx]
                            # Double-check for fill values
                            if pd.isna(val) or (isinstance(val, (int, float)) and (abs(val) > 9e4 or val in [999.9, 999.99, 9999.9, 9999999.0])):
                                row[pname] = np.nan
                            else:
                                row[pname] = val
                        else:
                            row[pname] = np.nan
                    
                    # Also ensure all ORIGINALLY requested parameters are in the row (set to NaN if missing)
                    # Use the original parameters list stored at fetch start
                    if hasattr(self, '_original_params') and self._original_params:
                        for pname in self._original_params:
                            if pname not in row:
                                row[pname] = np.nan
                    else:
                        # Fallback to current parameters list
                        for pname in parameters:
                            if pname not in row:
                                row[pname] = np.nan
                    
                    data_rows.append(row)
            except Exception:
                # Skip and continue (individual lines sometimes malformed)
                continue

        if not data_rows:
            logger.warning("No data parsed from OMNI response. Response preview: %s", self._preview(text, 200))
            return pd.DataFrame()

        df = pd.DataFrame(data_rows)
        if df.empty:
            logger.warning("DataFrame is empty after parsing.")
            return pd.DataFrame()
        
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors='coerce')
        # Remove rows with invalid timestamps
        df = df[df["timestamp"].notna()].copy()
        
        if df.empty:
            logger.warning("No valid timestamps after parsing.")
            return pd.DataFrame()
        
        df = df.sort_values("timestamp").drop_duplicates(subset=["timestamp"]).reset_index(drop=True)
        
        # Log actual date range of parsed data
        if not df.empty:
            min_date = df["timestamp"].min()
            max_date = df["timestamp"].max()
            logger.info(f"✅ Parsed {len(df)} valid data rows with {len(parameters)} parameters")
            logger.info(f"   Parsed data date range: {min_date.date()} to {max_date.date()}")
        else:
            logger.info(f"✅ Parsed {len(df)} valid data rows with {len(parameters)} parameters")
        
        return df

    # -------------------------
    # Utilities
    # -------------------------
    @staticmethod
    def _clean_date(dt: datetime) -> Optional[str]:
        """Return strict YYYYMMDD string (digits only) or None on invalid input."""
        if not isinstance(dt, datetime):
            logger.error("Date is not a datetime instance: %r", dt)
            return None
        try:
            s = dt.strftime("%Y%m%d")
            s = "".join(ch for ch in s if ch.isdigit())
            if len(s) != 8:
                return None
            return s
        except Exception:
            return None

    @staticmethod
    def _looks_like_omni_error(text: str) -> bool:
        if not text:
            return True
        low = text.lower()
        # These substrings are common in OMNIWeb error pages
        return any(kw in low for kw in ("wrong value", "missing or invalid", "<h1>error", "not alpha/numerical"))

    @staticmethod
    def _preview(text: str, n: int = 300) -> str:
        return text[:n].replace("\n", " ").replace("\r", " ")

    # -------------------------
    # Convenience methods
    # -------------------------
    def fetch_realtime_data(self, hours_back: int = 24) -> pd.DataFrame:
        """Fetch recent real-time data (hours_back from now)."""
        end = datetime.utcnow().replace(second=0, microsecond=0)
        start = (end - timedelta(hours=hours_back)).replace(second=0, microsecond=0)
        return self.fetch_data(start, end)
    
    def _fetch_data_multi_request(
        self,
        start_date: datetime,
        end_date: datetime,
        parameters: List[str],
        resolution: str,
        retries: int,
        retry_backoff: float,
    ) -> pd.DataFrame:
        """
        Fetch OMNIWeb data using multiple requests (to overcome API limitations).
        
        OMNIWeb API has hard limits:
        - Cannot fetch all parameters in single request
        - Some parameters cannot be combined
        - Maximum ~25-30 columns per request
        
        Solution: Split parameters into compatible groups, fetch separately, merge by timestamp.
        """
        # Define compatible parameter groups based on OMNIWeb API behavior
        # These groups are tested to work together
        param_groups = {
            'magnetic_field': [
                'bt', 'bx_gsm', 'by_gsm', 'bz_gsm', 'bz_gse', 
                'imf_latitude', 'imf_longitude'
            ],
            'plasma': [
                'speed', 'density', 'temperature', 
                'flow_longitude', 'flow_latitude', 
                'alpha_proton_ratio', 'flow_pressure'
            ],
            'derived': [
                'electric_field', 'plasma_beta', 
                'alfven_mach', 'magnetosonic_mach'
            ],
            'geomagnetic': [
                'dst', 'kp', 'ae', 'ap', 'al', 'au'
            ],
            'solar': [
                'f10_7', 'sunspot_number'
            ],
            'proton_flux': [
                'proton_flux_1mev', 'proton_flux_2mev', 'proton_flux_4mev',
                'proton_flux_10mev', 'proton_flux_30mev', 'proton_flux_60mev'
            ]
        }
        
        # Assign each requested parameter to a group
        param_to_group = {}
        for group_name, group_params in param_groups.items():
            for param in group_params:
                param_to_group[param] = group_name
        
        # Group requested parameters by their compatible groups
        grouped_params = {}
        ungrouped_params = []
        
        for param in parameters:
            if param in param_to_group:
                group = param_to_group[param]
                if group not in grouped_params:
                    grouped_params[group] = []
                grouped_params[group].append(param)
            else:
                ungrouped_params.append(param)
        
        # Add ungrouped parameters to magnetic_field group (most compatible)
        if ungrouped_params:
            if 'magnetic_field' not in grouped_params:
                grouped_params['magnetic_field'] = []
            grouped_params['magnetic_field'].extend(ungrouped_params)
            logger.warning(f"⚠️ {len(ungrouped_params)} ungrouped parameters added to magnetic_field group: {ungrouped_params}")
        
        logger.info(f"📦 Split {len(parameters)} parameters into {len(grouped_params)} groups: {list(grouped_params.keys())}")
        
        # Fetch each group separately
        all_dataframes = []
        for group_name, group_params_list in grouped_params.items():
            if not group_params_list:
                continue
            
            logger.info(f"📥 Fetching group '{group_name}' with {len(group_params_list)} parameters: {group_params_list[:5]}...")
            try:
                # Fetch this group (use_multi_request=False to avoid recursion)
                group_df = self.fetch_data(
                    start_date, end_date, 
                    parameters=group_params_list,
                    resolution=resolution,
                    retries=retries,
                    retry_backoff=retry_backoff,
                    use_multi_request=False  # Don't recurse
                )
                
                if not group_df.empty:
                    logger.info(f"✅ Group '{group_name}': Fetched {len(group_df)} rows with {len(group_df.columns)-1} parameters")
                    all_dataframes.append(group_df)
                else:
                    logger.warning(f"⚠️ Group '{group_name}': No data returned")
            except Exception as e:
                logger.error(f"❌ Group '{group_name}' fetch failed: {e}")
                continue
        
        if not all_dataframes:
            logger.error("❌ All parameter groups failed to fetch data")
            return pd.DataFrame()
        
        # Merge all dataframes by timestamp
        logger.info(f"🔗 Merging {len(all_dataframes)} dataframes by timestamp...")
        merged_df = all_dataframes[0].copy()
        
        for df in all_dataframes[1:]:
            if 'timestamp' in df.columns and 'timestamp' in merged_df.columns:
                # Merge on timestamp, keeping all columns
                merged_df = pd.merge(
                    merged_df, df,
                    on='timestamp',
                    how='outer',
                    suffixes=('', '_dup')
                )
                # Remove duplicate columns (keep first occurrence)
                merged_df = merged_df.loc[:, ~merged_df.columns.str.endswith('_dup')]
            else:
                logger.warning("⚠️ Skipping merge - missing timestamp column")
        
        # Sort by timestamp
        if 'timestamp' in merged_df.columns:
            merged_df = merged_df.sort_values('timestamp').reset_index(drop=True)
        
        # Ensure all requested parameters are present (set to NaN if missing)
        for param in parameters:
            if param not in merged_df.columns:
                merged_df[param] = np.nan
                logger.debug(f"⚠️ Parameter '{param}' not found in any group - set to NaN")
        
        logger.info(f"✅ Merged result: {len(merged_df)} rows, {len(merged_df.columns)-1} parameters")
        logger.info(f"   Parameters with data: {sum(merged_df[col].notna().any() for col in merged_df.columns if col != 'timestamp')}")
        
        return merged_df
    
    def _fetch_from_html_file(
        self,
        html_file_path: str,
        start_date: datetime,
        end_date: datetime,
        parameters: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """
        Parse OMNIWeb Results.html file (downloaded from browser).
        
        This is the BEST approach when user downloads HTML file directly.
        """
        try:
            from pathlib import Path
            import re
            
            html_path = Path(html_file_path)
            if not html_path.exists():
                logger.warning(f"HTML file not found: {html_file_path}")
                return pd.DataFrame()
            
            with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Extract data from <pre> tag
            pre_match = re.search(r'<pre>(.*?)</pre>', content, re.DOTALL)
            if not pre_match:
                logger.warning("Could not find <pre> tag in HTML file")
                return pd.DataFrame()
            
            pre_content = pre_match.group(1)
            lines = pre_content.split('\n')
            
            # Find header line
            header_line_idx = None
            for i, line in enumerate(lines):
                if line.strip().startswith('YEAR') and 'DOY' in line and 'HR' in line:
                    header_line_idx = i
                    break
            
            if header_line_idx is None:
                logger.warning("Could not find header line in HTML file")
                return pd.DataFrame()
            
            # Parse data lines
            data_lines = []
            for line in lines[header_line_idx + 1:]:
                line = line.strip()
                if line and re.match(r'^\d{4}\s+\d+\s+\d+', line):
                    data_lines.append(line)
            
            if not data_lines:
                logger.warning("No data lines found in HTML file")
                return pd.DataFrame()
            
            # Parse into DataFrame
            all_rows = []
            for line in data_lines:
                parts = line.split()
                if len(parts) < 3:
                    continue
                
                try:
                    year = int(parts[0])
                    doy = int(parts[1])
                    hr = int(parts[2])
                    
                    # Create timestamp
                    date_str = f"{year}-{doy:03d}"
                    base_date = datetime.strptime(date_str, "%Y-%j")
                    timestamp = base_date.replace(hour=hr)
                    
                    # Extract values (space-separated, need to map columns)
                    # Based on OMNIWeb format: YEAR DOY HR col1 col2 col3 ...
                    row_data = {'timestamp': timestamp}
                    
                    # Use different column mapping based on format type
                    if format_type == 'reduced':
                        # New format: 26 parameters (1-26)
                        # Data line: 2010   1  0   3.0   3.0  17.4  89.8   0.0   2.8   0.9   2.5   1.6   36035.   3.7  283.   1.9  -2.2  0  18     5   0  72.7 999999.99 99999.99 99999.99     0.24     0.13     0.11 -1
                        # Indices: 0=YEAR, 1=DOY, 2=HR, 3=ScalarB, 4=VectorB, 5=Lat, 6=Long, 7=BX, 8=BY_GSE, 9=BZ_GSE, 10=BY_GSM, 11=BZ_GSM, 12=Temp, 13=Density, 14=Speed, 15=FlowLong, 16=FlowLat, 17=Kp, 18=Sunspot, 19=Dst, 20=ap, 21=f10.7, 22-26=Proton fluxes, 27=Flag
                        col_mapping = {
                            4: 'bt',  # Vector B Magnitude (param 2)
                            5: 'imf_latitude',  # Lat. Angle (param 3)
                            6: 'imf_longitude',  # Long. Angle (param 4)
                            7: 'bx_gsm',  # BX (param 5)
                            8: 'by_gsm',  # BY GSE (param 6, will be overwritten)
                            9: 'bz_gse',  # BZ GSE (param 7)
                            10: 'by_gsm',  # BY GSM (param 8, overwrites index 8)
                            11: 'bz_gsm',  # BZ GSM (param 9)
                            12: 'temperature',  # SW Plasma Temperature (param 10)
                            13: 'density',  # SW Proton Density (param 11)
                            14: 'speed',  # SW Plasma Speed (param 12)
                            15: 'flow_longitude',  # Flow long (param 13)
                            16: 'flow_latitude',  # Flow lat (param 14)
                            17: 'kp',  # Kp index (param 15)
                            18: 'sunspot_number',  # R Sunspot (param 16)
                            19: 'dst',  # Dst-index (param 17)
                            20: 'ap',  # ap_index (param 18)
                            21: 'f10_7',  # f10.7_index (param 19)
                            22: 'proton_flux_1mev',  # Proton flux >1 Mev (param 20)
                            23: 'proton_flux_2mev',  # Proton flux >2 Mev (param 21)
                            24: 'proton_flux_4mev',  # Proton flux >4 Mev (param 22)
                            25: 'proton_flux_10mev',  # Proton flux >10 Mev (param 23)
                            26: 'proton_flux_30mev',  # Proton flux >30 Mev (param 24)
                            27: 'proton_flux_60mev',  # Proton flux >60 Mev (param 25)
                        }
                    else:
                        # Original format: 40 parameters
                        # Map based on actual OMNIWeb column order from HTML file
                        # Data line example: 2010 274  2   5.2   4.9 -25.7 263.2  -0.5  -4.4  -2.1  -4.8  -0.7   0.2   1.7   1.3   0.6   1.0   35781.   3.8  387.  -1.0  -1.7 0.021  1.03   0.27   0.96   7.3  5.4 0.0226  7  36    -5   3  86.9   23    -8    14 999999.99 99999.99 99999.99     0.19     0.11     0.08
                        # Split indices: 0=YEAR, 1=DOY, 2=HR, 3=ScalarB, 4=VectorB, 5=Lat, 6=Long, 7=BX, 8=BY_GSE, 9=BZ_GSE, 10=BY_GSM, 11=BZ_GSM, 12-15=RMS, 16=Temp, 17=Density, 18=Speed, 19=FlowLong, 20=FlowLat, 21=Alpha, 22=Pressure, 23=E, 24=Beta, 25=Alfven, 26=Magnetosonic, 27=Quasy, 28=Kp, 29=Sunspot, 30=Dst, 31=ap, 32=f10.7, 33=AE, 34=AL, 35=AU, 36=Flux1, 37=Flux2, 38=Flux4, 39=Flux10, 40=Flux30, 41=Flux60
                        col_mapping = {
                        4: 'bt',  # Vector B Magnitude
                        5: 'imf_latitude',  # Lat. Angle of B
                        6: 'imf_longitude',  # Long. Angle of B
                        7: 'bx_gsm',  # BX
                        8: 'by_gsm',  # BY GSE (temporary, will be overwritten)
                        9: 'bz_gse',  # BZ GSE
                        10: 'by_gsm',  # BY GSM (overwrites index 8)
                        11: 'bz_gsm',  # BZ GSM
                        17: 'temperature',  # SW Plasma Temperature (parts[17] = 35781. K)
                        18: 'density',  # SW Proton Density (parts[18] = 3.8 cm^-3)
                        19: 'speed',  # SW Plasma Speed (parts[19] = 387. km/s)
                        20: 'flow_longitude',  # Flow long angle (parts[20] = -1.0)
                        21: 'flow_latitude',  # Flow lat angle (parts[21] = -1.7)
                        22: 'alpha_proton_ratio',  # Alpha/Prot ratio (parts[22] = 0.021)
                        23: 'flow_pressure',  # Flow pressure (parts[23] = 1.03)
                        24: 'electric_field',  # E electric field (parts[24] = 0.27)
                        25: 'plasma_beta',  # Plasma Beta (parts[25] = 0.96)
                        26: 'alfven_mach',  # Alfven mach (parts[26] = 7.3)
                        27: 'magnetosonic_mach',  # Magnetosonic (parts[27] = 5.4)
                        29: 'kp',  # Kp index (parts[29] = 7)
                        30: 'sunspot_number',  # R Sunspot (parts[30] = 36)
                        31: 'dst',  # Dst-index (parts[31] = -5)
                        32: 'ap',  # ap_index (parts[32] = 3)
                        33: 'f10_7',  # f10.7_index (parts[33] = 86.9)
                        34: 'ae',  # AE-index (parts[34] = 23)
                        35: 'al',  # AL-index (parts[35] = -8)
                        36: 'au',  # AU-index (parts[36] = 14)
                        37: 'proton_flux_1mev',  # Proton flux >1 Mev (parts[37] = 999999.99, fill)
                        38: 'proton_flux_2mev',  # Proton flux >2 Mev (parts[38] = 99999.99, fill)
                        39: 'proton_flux_4mev',  # Proton flux >4 Mev (parts[39] = 99999.99, fill)
                        40: 'proton_flux_10mev',  # Proton flux >10 Mev (parts[40] = 0.19)
                        41: 'proton_flux_30mev',  # Proton flux >30 Mev (parts[41] = 0.11)
                        42: 'proton_flux_60mev',  # Proton flux >60 Mev (parts[42] = 0.08)
                        }
                    
                    for col_idx, param_name in col_mapping.items():
                        if col_idx < len(parts):
                            try:
                                value = float(parts[col_idx])
                                if value >= 99999.0 or value <= -99999.0:
                                    value = np.nan
                                row_data[param_name] = value
                            except (ValueError, IndexError):
                                row_data[param_name] = np.nan
                    
                    all_rows.append(row_data)
                    
                except (ValueError, IndexError):
                    continue
            
            if not all_rows:
                return pd.DataFrame()
            
            df = pd.DataFrame(all_rows)
            df = df.sort_values('timestamp').reset_index(drop=True)
            
            # Filter by date range
            df = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)]
            
            # Filter to requested parameters if specified
            if parameters:
                available_params = [p for p in parameters if p in df.columns]
                df = df[['timestamp'] + available_params].copy()
                
                for param in parameters:
                    if param not in df.columns:
                        df[param] = np.nan
            
            logger.info(f"✅ Parsed HTML file: {len(df)} rows, {len(df.columns)-1} parameters")
            return df
            
        except Exception as e:
            logger.error(f"Failed to parse HTML file: {e}")
            return pd.DataFrame()
    
    def _fetch_from_csv_files(
        self,
        start_date: datetime,
        end_date: datetime,
        parameters: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """
        Fetch OMNIWeb data from NASA SPDF pre-combined files (ASCII/CSV format).
        
        This is the BEST approach because:
        - All parameters are in one file
        - No API limitations
        - More stable and faster
        - No need for multiple requests
        
        Files are typically at:
        - https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/ (ASCII format)
        - Format: omni2_YYYY.dat or similar
        
        NOTE: If this fails, automatically falls back to CGI API approach.
        """
        # Get years in date range
        years = set()
        current = start_date
        while current <= end_date:
            years.add(current.year)
            current += timedelta(days=365)
        
        all_dataframes = []
        
        for year in sorted(years):
            # Try multiple possible file formats and locations
            file_urls = []
            for base_url in self.SPDF_BASE_URLS:
                file_urls.extend([
                    f"{base_url}omni2_{year}.dat",  # ASCII format
                    f"{base_url}omni2_hro_1hr_{year}0101_v01.dat",
                    f"{base_url}omni2_hro_1hr_{year}.dat",
                    f"{base_url}omni_hro_1hr_{year}.dat",
                ])
            
            for file_url in file_urls:
                try:
                    logger.debug(f"📥 Trying file URL: {file_url}")
                    response = self.session.get(file_url, timeout=30, stream=True)
                    
                    if response.status_code == 200:
                        # Read first chunk to check if it's valid data
                        content = response.content[:5000].decode('utf-8', errors='ignore')
                        
                        if len(content) > 100 and ('YEAR' in content.upper() or any(c.isdigit() for c in content[:100])):
                            # This looks like a data file
                            # Read full content
                            response.raw.decode_content = True
                            full_content = response.text
                            
                            if len(full_content) > 1000:
                                # Parse ASCII/space-separated format
                                df = self._parse_omni_ascii_file(full_content, year)
                                
                                if not df.empty and 'timestamp' in df.columns:
                                    # Filter by date range
                                    df = df[df['timestamp'].notna()]
                                    df = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)]
                                    
                                    if not df.empty:
                                        logger.info(f"✅ Fetched {len(df)} rows from {year} file: {file_url.split('/')[-1]}")
                                        all_dataframes.append(df)
                                        break  # Success, move to next year
                
                except Exception as e:
                    logger.debug(f"Failed to fetch {file_url}: {e}")
                    continue
        
        if not all_dataframes:
            logger.warning("⚠️ No pre-combined file data found")
            return pd.DataFrame()
        
        # Merge all years
        merged_df = pd.concat(all_dataframes, ignore_index=True)
        merged_df = merged_df.sort_values('timestamp').reset_index(drop=True)
        
        # Map OMNI column names to our parameter names
        self._map_omni_columns(merged_df)
        
        # Filter to requested parameters if specified
        if parameters:
            # Keep timestamp and requested parameters
            available_params = [p for p in parameters if p in merged_df.columns]
            merged_df = merged_df[['timestamp'] + available_params].copy()
            
            # Add missing parameters as NaN
            for param in parameters:
                if param not in merged_df.columns:
                    merged_df[param] = np.nan
        
        logger.info(f"✅ Pre-combined file fetch complete: {len(merged_df)} rows, {len(merged_df.columns)-1} parameters")
        return merged_df
    
    def _parse_omni_ascii_file(self, content: str, year: int) -> pd.DataFrame:
        """Parse OMNI ASCII/space-separated file format."""
        from io import StringIO
        
        lines = content.split('\n')
        
        # Find header line (usually contains column names)
        header_idx = None
        for i, line in enumerate(lines[:50]):
            line_upper = line.upper()
            if 'YEAR' in line_upper and ('DOY' in line_upper or 'DAY' in line_upper):
                header_idx = i
                break
        
        if header_idx is None:
            # Try to infer from first data line
            for i, line in enumerate(lines[:100]):
                parts = line.strip().split()
                if len(parts) > 10 and parts[0].isdigit() and len(parts[0]) == 4:
                    # Likely a data line
                    header_idx = i - 1 if i > 0 else 0
                    break
        
        if header_idx is None:
            header_idx = 0
        
        # Read data (skip comment lines starting with #)
        data_lines = []
        for line in lines[header_idx:]:
            line = line.strip()
            if line and not line.startswith('#'):
                data_lines.append(line)
        
        if not data_lines:
            return pd.DataFrame()
        
        # Try to parse as space-separated
        try:
            # Use pandas read_csv with whitespace separator
            df = pd.read_csv(StringIO('\n'.join(data_lines)), sep=r'\s+', header=0, low_memory=False, engine='python')
            
            # Parse timestamp
            if 'YEAR' in df.columns and 'DOY' in df.columns:
                if 'HR' in df.columns:
                    df['timestamp'] = pd.to_datetime(
                        df['YEAR'].astype(str) + ' ' + 
                        df['DOY'].astype(int).astype(str) + ' ' + 
                        df['HR'].astype(int).astype(str),
                        format='%Y %j %H',
                        errors='coerce'
                    )
                elif 'HOUR' in df.columns:
                    df['timestamp'] = pd.to_datetime(
                        df['YEAR'].astype(str) + ' ' + 
                        df['DOY'].astype(int).astype(str) + ' ' + 
                        df['HOUR'].astype(int).astype(str),
                        format='%Y %j %H',
                        errors='coerce'
                    )
            
            return df
            
        except Exception as e:
            logger.debug(f"Failed to parse ASCII file: {e}")
            return pd.DataFrame()
    
    def _map_omni_columns(self, df: pd.DataFrame) -> None:
        """Map OMNI column names to our internal parameter names."""
        column_mapping = {
            # Magnetic Field
            'BX_GSE': 'bx_gsm', 'BX': 'bx_gsm',
            'BY_GSE': 'by_gsm', 'BY': 'by_gsm',
            'BZ_GSE': 'bz_gse', 'BZ': 'bz_gsm',
            'BY_GSM': 'by_gsm',
            'BZ_GSM': 'bz_gsm',
            'BT': 'bt', 'B': 'bt', 'IMF_MAGNITUDE': 'bt',
            'LAT_IMF': 'imf_latitude', 'LAT': 'imf_latitude',
            'LON_IMF': 'imf_longitude', 'LON': 'imf_longitude',
            
            # Plasma
            'V': 'speed', 'V_GSE': 'speed', 'SPEED': 'speed', 'VELOCITY': 'speed',
            'N': 'density', 'NP': 'density', 'DENSITY': 'density',
            'T': 'temperature', 'TEMP': 'temperature', 'TEMPERATURE': 'temperature',
            'FLOW_LONGITUDE': 'flow_longitude', 'PHI': 'flow_longitude',
            'FLOW_LATITUDE': 'flow_latitude', 'THETA': 'flow_latitude',
            'ALPHA_PROTON_RATIO': 'alpha_proton_ratio', 'ALPHA': 'alpha_proton_ratio',
            'PDYN': 'flow_pressure', 'PRESSURE': 'flow_pressure',
            
            # Derived
            'EY': 'electric_field', 'ELECTRIC_FIELD': 'electric_field',
            'BETA': 'plasma_beta',
            'ALFVEN_MACH': 'alfven_mach', 'MA': 'alfven_mach',
            'MAGNETOSONIC_MACH': 'magnetosonic_mach',
            
            # Indices
            'DST': 'dst',
            'KP': 'kp',
            'AE': 'ae',
            'AP': 'ap',
            'AL': 'al',
            'AU': 'au',
            'F10_7': 'f10_7', 'F107': 'f10_7',
            'SUNSPOT': 'sunspot_number', 'R': 'sunspot_number',
            
            # Proton Flux
            'FP1': 'proton_flux_1mev', 'P1': 'proton_flux_1mev',
            'FP2': 'proton_flux_2mev', 'P2': 'proton_flux_2mev',
            'FP4': 'proton_flux_4mev', 'P4': 'proton_flux_4mev',
            'FP10': 'proton_flux_10mev', 'P10': 'proton_flux_10mev',
            'FP30': 'proton_flux_30mev', 'P30': 'proton_flux_30mev',
            'FP60': 'proton_flux_60mev', 'P60': 'proton_flux_60mev',
        }
        
        # Apply column mapping (case-insensitive)
        df_columns_upper = {col.upper(): col for col in df.columns}
        for csv_col_upper, param_name in column_mapping.items():
            if csv_col_upper in df_columns_upper:
                original_col = df_columns_upper[csv_col_upper]
                if param_name not in df.columns:
                    df[param_name] = df[original_col]
                else:
                    # Merge if both exist (take non-null values)
                    df[param_name] = df[param_name].fillna(df[original_col])

    def get_cme_relevant_data(self, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """Fetch a comprehensive set of CME-relevant parameters."""
        params = [
            # Magnetic Field
            "bt",                      # IMF Magnitude Avg
            "bz_gsm",                  # Bz, GSM
            "bz_gse",                  # Bz, GSE
            "bx_gsm",                  # Bx, GSM
            "by_gsm",                  # By, GSM
            "imf_latitude",            # Lat. of Avg. IMF
            "imf_longitude",           # Long. of Avg. IMF
            
            # Plasma
            "speed",                   # Flow Speed
            "density",                 # Proton Density
            "temperature",             # Proton Temperature
            "flow_longitude",          # Flow Longitude
            "flow_latitude",           # Flow Latitude
            "alpha_proton_ratio",      # Alpha/Proton Ratio
            
            # Derived Parameters
            "flow_pressure",           # Flow Pressure
            "plasma_beta",            # Plasma Beta
            "alfven_mach",            # Alfven Mach
            "magnetosonic_mach",      # Magnetosonic Mach
            "electric_field",         # Electric Field
            
            # Geomagnetic Indices
            "dst",                    # Dst Index
            "kp",                     # Kp Index
            "ae",                     # AE Index
            "ap",                     # ap Index
            "al",                     # AL Index
            "au",                     # AU Index
            
            # Solar Indices
            "f10_7",                  # F10.7 Solar Index
            "sunspot_number",         # Sunspot Number
            
            # Proton Flux
            "proton_flux_1mev",       # Proton Flux > 1 MeV
            "proton_flux_2mev",       # Proton Flux > 2 MeV
            "proton_flux_4mev",       # Proton Flux > 4 MeV
            "proton_flux_10mev",      # Proton Flux > 10 MeV
            "proton_flux_30mev",      # Proton Flux > 30 MeV
            "proton_flux_60mev",      # Proton Flux > 60 MeV
        ]
        # Try pre-combined files first (BEST), fallback to CGI API multi-request
        return self.fetch_data(start_date, end_date, parameters=params, use_csv_approach=True, use_multi_request=True)

    def merge_with_existing_data(self, omni_data: pd.DataFrame, existing_data: pd.DataFrame) -> pd.DataFrame:
        """Merge OMNIWeb data with an existing dataset on 'timestamp' with preference to OMNI values where missing."""
        if omni_data is None or omni_data.empty:
            return existing_data
        if existing_data is None or existing_data.empty:
            return omni_data

        merged = pd.merge(existing_data, omni_data, on="timestamp", how="outer", suffixes=("", "_omni"))
        for col in omni_data.columns:
            if col == "timestamp":
                continue
            omni_col = f"{col}_omni"
            if omni_col in merged.columns:
                mask = merged[col].isna() & merged[omni_col].notna()
                merged.loc[mask, col] = merged.loc[mask, omni_col]
                merged = merged.drop(columns=[omni_col], errors="ignore")
        merged = merged.sort_values("timestamp").reset_index(drop=True)
        return merged


# Convenience function
def get_omniweb_data(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, hours_back: int = 24) -> Dict:
    """
    Convenience wrapper returning a dict with 'success', 'data', 'message'.
    """
    fetcher = OMNIWebDataFetcher()
    if start_date is None:
        end_date = datetime.utcnow().replace(second=0, microsecond=0)
        start_date = (end_date - timedelta(hours=hours_back)).replace(second=0, microsecond=0)
    elif end_date is None:
        end_date = datetime.utcnow().replace(second=0, microsecond=0)
    else:
        start_date = start_date.replace(second=0, microsecond=0)
        end_date = end_date.replace(second=0, microsecond=0)

    try:
        df = fetcher.get_cme_relevant_data(start_date, end_date)
        if df.empty:
            return {"success": False, "data": None, "message": "No data retrieved from OMNIWeb"}
        return {"success": True, "data": df, "message": f"Retrieved {len(df)} data points from OMNIWeb", "source": "OMNIWeb", "start_date": start_date.isoformat(), "end_date": end_date.isoformat()}
    except Exception as e:
        logger.exception("Error fetching OMNIWeb data: %s", e)
        return {"success": False, "data": None, "message": f"Error: {e}"}


# Quick test harness (only runs when executed directly)
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    f = OMNIWebDataFetcher()
    end_dt = datetime.utcnow()
    start_dt = end_dt - timedelta(days=7)
    print(f"Fetching OMNIWeb data from {start_dt.isoformat()} to {end_dt.isoformat()} (UTC)...")
    df = f.get_cme_relevant_data(start_dt, end_dt)
    print(f"Retrieved rows: {len(df)}")
    if not df.empty:
        print("Columns:", df.columns.tolist())
        print(df.head())
