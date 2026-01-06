"""
IMPROVED CDF UPLOAD ENDPOINT
Copy this code and replace the existing /api/data/upload endpoint in main.py
"""

@app.post("/api/data/upload")
async def upload_swis_data(file: UploadFile = File(...)):
    """
    Upload SWIS CDF data file for analysis.
    IMPROVED VERSION - Properly handles Aditya-L1 CDF files
    """
    try:
        analysis_start_time = time.time()
        
        # Check file type
        if not file.filename.lower().endswith('.cdf'):
            raise HTTPException(status_code=400, detail="Only CDF files are supported")
        
        # Create directories
        upload_dir = Path("data/aditya_l1/uploaded")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        processed_dir = Path("data/aditya_l1/processed")
        processed_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_filename = f"{timestamp_str}_{file.filename}"
        saved_path = upload_dir / saved_filename
        
        content = await file.read()
        with open(saved_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"📤 Uploaded: {file.filename} ({len(content)} bytes)")
        
        try:
            # Try to parse CDF file
            try:
                import cdflib
                cdf_available = True
            except ImportError:
                cdf_available = False
                logger.warning("cdflib not installed, using fallback")
            
            if cdf_available:
                # Parse CDF file
                cdf = cdflib.CDF(str(saved_path))
                info = cdf.cdf_info()
                variables = info.get('zVariables', [])
                
                logger.info(f"📊 CDF variables: {len(variables)}")
                
                # Extract data
                data = {}
                
                # Timestamp
                for var in ['Epoch', 'Time', 'TIME', 'epoch', 'time_tag']:
                    if var in variables:
                        try:
                            epochs = cdf.varget(var)
                            data['timestamp'] = cdflib.cdfepoch.to_datetime(epochs)
                            break
                        except:
                            continue
                
                # Solar wind parameters
                param_map = {
                    'proton_velocity': ['V_proton', 'Velocity', 'V', 'Speed'],
                    'proton_density': ['N_proton', 'Density', 'N', 'n_p'],
                    'proton_temperature': ['T_proton', 'Temperature', 'T'],
                    'proton_flux': ['Flux', 'F_proton', 'flux']
                }
                
                for param, names in param_map.items():
                    for name in names:
                        if name in variables:
                            try:
                                data[param] = cdf.varget(name)
                                break
                            except:
                                continue
                
                # Create DataFrame
                if data and 'timestamp' in data:
                    df = pd.DataFrame(data)
                    df['data_source'] = 'Aditya-L1 SWIS'
                    df['file_name'] = file.filename
                    
                    # Save processed data
                    csv_file = processed_dir / f"uploaded_{timestamp_str}.csv"
                    json_file = processed_dir / f"uploaded_{timestamp_str}.json"
                    
                    df.to_csv(csv_file, index=False)
                    df.to_json(json_file, orient='records', date_format='iso')
                    
                    logger.info(f"✅ Saved: {len(df)} records")
                    
                    # Calculate stats
                    stats = {
                        'total_points': len(df),
                        'valid_points': len(df.dropna()),
                        'coverage': f"{len(df.dropna())/len(df)*100:.1f}%",
                        'time_range': {
                            'start': df['timestamp'].min().isoformat(),
                            'end': df['timestamp'].max().isoformat()
                        }
                    }
                    
                    result = {
                        "filename": file.filename,
                        "file_size": len(content),
                        "status": "analyzed",
                        "processing_time": f"{time.time() - analysis_start_time:.2f}s",
                        "data_quality": stats,
                        "saved_files": {
                            "csv": str(csv_file),
                            "json": str(json_file)
                        },
                        "recommendations": [
                            f"✅ Processed {stats['total_points']} data points",
                            f"📊 Data coverage: {stats['coverage']}",
                            "🔄 Refresh charts to see data"
                        ]
                    }
                else:
                    raise ValueError("Could not extract data from CDF")
            else:
                # Fallback if cdflib not available
                result = {
                    "filename": file.filename,
                    "file_size": len(content),
                    "status": "saved",
                    "message": "File saved but cdflib not installed for parsing",
                    "recommendations": [
                        "📦 Install cdflib: pip install cdflib",
                        "🔄 Then re-upload for parsing"
                    ]
                }
        
        except Exception as parse_error:
            logger.error(f"Parse error: {parse_error}")
            result = {
                "filename": file.filename,
                "file_size": len(content),
                "status": "error",
                "error": str(parse_error),
                "recommendations": [
                    "❌ Failed to parse CDF file",
                    "🔧 Check file format",
                    f"💡 Error: {str(parse_error)[:100]}"
                ]
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
