import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from logging.handlers import RotatingFileHandler
from config import Config
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'
csrf = CSRFProtect()

logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)
    
    # Set up CORS for API routes in development
    if app.debug:
        CORS(app, resources={r"/api/*": {"origins": "*"}})
        logger.info("CORS enabled for /api/* routes in debug mode")
    
    # Register blueprints
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)
    
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    from app.errors import bp as errors_bp
    app.register_blueprint(errors_bp)
    
    # Register API blueprint
    from app.api import bp as api_bp
    app.register_blueprint(api_bp)
    
    # Make sure API modules are imported
    from app.api import routes, auth, users, shared_routes
    
    # Feature Blueprints
    from app.dives import dives_bp
    app.register_blueprint(dives_bp)
    
    from app.sites import sites_bp
    app.register_blueprint(sites_bp)
    
    from app.shared import shared_bp
    app.register_blueprint(shared_bp)
    
    from app.shark import shark_bp
    app.register_blueprint(shark_bp)
    
    # Register dev blueprints only in development
    if app.debug:
        from app.dev import dev_bp
        app.register_blueprint(dev_bp, url_prefix="/dev")
    
    # Create database tables
    with app.app_context():
        db.create_all()
        logger.info("Database tables created or confirmed to exist")
    
    return app

# Import models here to avoid circular imports
from app import models 
