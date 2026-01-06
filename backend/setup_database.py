#!/usr/bin/env python3
"""
Database Setup Script for CME Detection System
Helps set up PostgreSQL database and creates tables
"""

import os
import subprocess
import sys
from pathlib import Path

def install_requirements():
    """Install database requirements"""
    try:
        print("Installing database requirements...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "sqlalchemy", "alembic"])
        print("✓ Database requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install requirements: {e}")
        return False

def setup_database():
    """Set up database tables"""
    try:
        print("Setting up database tables...")
        from database import create_tables, init_sample_data
        
        create_tables()
        init_sample_data()
        print("✓ Database tables created successfully")
        return True
    except ImportError:
        print("✗ Database modules not found. Please install requirements first.")
        return False
    except Exception as e:
        print(f"✗ Failed to setup database: {e}")
        print("Make sure PostgreSQL is running and accessible.")
        return False

def check_postgresql():
    """Check if PostgreSQL is accessible"""
    try:
        import psycopg2
        # Try to connect to default database
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/cme_detection")
        
        print(f"Testing database connection to: {DATABASE_URL}")
        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        print("✓ PostgreSQL connection successful")
        return True
    except Exception as e:
        print(f"✗ PostgreSQL connection failed: {e}")
        print("\nTo fix this:")
        print("1. Install PostgreSQL if not installed")
        print("2. Create a database named 'cme_detection'")
        print("3. Set the DATABASE_URL environment variable")
        print("   Example: DATABASE_URL=postgresql://username:password@localhost:5432/cme_detection")
        return False

def main():
    """Main setup function"""
    print("CME Detection System - Database Setup")
    print("="*50)
    
    # Step 1: Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Step 2: Check PostgreSQL
    if not check_postgresql():
        print("\nDatabase setup cannot continue without PostgreSQL.")
        print("The system will run in standalone mode without database features.")
        return
    
    # Step 3: Setup database
    if setup_database():
        print("\n✓ Database setup completed successfully!")
        print("The CME Detection System is now ready to use with database support.")
    else:
        print("\n✗ Database setup failed.")
        print("The system will run in standalone mode without database features.")

if __name__ == "__main__":
    main()
