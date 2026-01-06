"""
Enhanced CDF Upload Endpoint
Add this to main.py to get latest uploaded Aditya-L1 data
"""

# Add this endpoint to main.py after the existing /api/data/upload endpoint

@app.get("/api/aditya-l1/latest")
async def get_latest_aditya_data():
    """
    Get the most recently uploaded Aditya-L1 data
    """
    try:
        processed_dir = Path("data/aditya_l1/processed")
        
        if not processed_dir.exists():
            return {
                'success': False,
                'message': 'No Aditya-L1 data uploaded yet',
                'data': []
            }
        
        # Find latest JSON file
        json_files = list(processed_dir.glob('uploaded_*.json'))
        
        if not json_files:
            return {
                'success': False,
                'message': 'No processed Aditya-L1 data found',
                'data': []
            }
        
        # Get most recent file
        latest_file = max(json_files, key=lambda x: x.stat().st_mtime)
        
        # Load data
        with open(latest_file, 'r') as f:
            data = json.load(f)
        
        return {
            'success': True,
            'data_source': 'Aditya-L1 SWIS (Uploaded)',
            'total_records': len(data),
            'file': latest_file.name,
            'last_modified': datetime.fromtimestamp(latest_file.stat().st_mtime).isoformat(),
            'data': data,
            'note': 'Real Aditya-L1 data from uploaded CDF files'
        }
        
    except Exception as e:
        logger.error(f"Failed to load Aditya-L1 data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
