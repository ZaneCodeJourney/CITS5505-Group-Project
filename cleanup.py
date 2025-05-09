#!/usr/bin/env python
"""
Cleanup script to remove test data and prepare for production
"""
import os
import glob

def cleanup():
    """Clean up test data files and ensure proper .gitignore"""
    
    # Files to be excluded from git
    test_files = [
        'app.db',  # SQLite database
        'enhanced_test_data.py',
        'test_data.py',
        'modified_test_data.py',
        'simple_fix.py',
        'fix_database.py',
        'migrate_db.py',
        'add_site_id.py',
        'check_missing_columns.py',
        'debug_shark_columns.py',
        'fix_sites_location.py',
        'update_sites_data.py',
        'seed.py',
        'setup_test_sites.py',
        '__pycache__',
        '*.pyc',
        '.DS_Store'
    ]
    
    # Verify .gitignore exists or create it
    if not os.path.exists('.gitignore'):
        print("Creating .gitignore file...")
        with open('.gitignore', 'w') as f:
            f.write("\n".join(test_files))
    else:
        # Update .gitignore with missing entries
        with open('.gitignore', 'r') as f:
            current_ignores = f.readlines()
        
        current_ignores = [line.strip() for line in current_ignores]
        
        with open('.gitignore', 'a') as f:
            for item in test_files:
                if item not in current_ignores:
                    f.write(f"{item}\n")
    
    # Create empty uploads directory if it doesn't exist
    uploads_dir = os.path.join('app', 'static', 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        # Add .gitkeep to ensure directory is tracked by git
        with open(os.path.join(uploads_dir, '.gitkeep'), 'w') as f:
            pass
    
    # Create README.md if it doesn't exist
    if not os.path.exists('README.md') or os.path.getsize('README.md') < 100:
        print("Creating/updating README.md...")
        with open('README.md', 'w') as f:
            f.write("""# Dive Logger

A web application for divers to log their dives and track their underwater adventures.

## Features

- User registration and authentication
- Dive logging with details like depth, duration, and location
- Dive statistics and visualization
- Equipment tracking
- Shark warning system
- Profile management

## Setup Instructions

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Initialize the database: `flask db upgrade`
4. Run the application: `python app.py`

## Technologies Used

- Flask (Python web framework)
- SQLite (Database)
- SQLAlchemy (ORM)
- Flask-Migrate (Database migrations)
- Bootstrap (Frontend)
- Chart.js (Data visualization)

## Contributing

Please refer to our contributing guidelines.

## License

This project is licensed under the MIT License.
""")

    print("Cleanup complete! Project is ready to be pushed to GitHub.")

if __name__ == "__main__":
    cleanup() 