from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, init, migrate, upgrade
from config import Config
import os

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models to create tables
from app.models.user import User
from app.models.dataset import Dataset

# Create the database directory if it doesn't exist
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'app.db')
db_dir = os.path.dirname(db_path)

# Create migrations directory
print("Creating migrations directory...")
with app.app_context():
    try:
        init(directory='migrations')
        print("Migration directory created successfully.")
    except Exception as e:
        print(f"Migration directory may already exist: {e}")

# Create initial migration
print("Creating initial migration...")
with app.app_context():
    try:
        migrate(directory='migrations', message='Initial migration')
        print("Initial migration created successfully.")
    except Exception as e:
        print(f"Error creating migration: {e}")

# Apply migration
print("Applying migration...")
with app.app_context():
    try:
        upgrade(directory='migrations')
        print("Migration applied successfully.")
    except Exception as e:
        print(f"Error applying migration: {e}")

print("Database initialization complete.") 