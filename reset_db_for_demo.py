#!/usr/bin/env python
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import Flask app, db and models
from app import create_app, db

app = create_app()

def reset_database():
    """Reset database and prepare for demo"""
    with app.app_context():
        print("Resetting database for demo...")
        
        # Drop all tables
        db.drop_all()
        
        # Recreate all tables
        db.create_all()
        
        print("Database reset successfully.")
        
        # Now run seed.py to populate the database
        print("Populating database with sample data...")
        import seed
        seed.create_sample_data()
        
        print("Database has been reset and populated with demo data.")
        print("You can now run the application for your presentation.")

if __name__ == '__main__':
    reset_database() 