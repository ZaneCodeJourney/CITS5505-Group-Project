from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_wtf import CSRFProtect
from config import Config

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
csrf = CSRFProtect()
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)

# Core Blueprints

    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    from app.errors import bp as errors_bp
    app.register_blueprint(errors_bp)
    
    from app.api import bp as api_bp
    app.register_blueprint(api_bp)

# Feature Blueprints

    from app.dives import dives_bp
    app.register_blueprint(dives_bp)

    from app.sites import sites_bp
    app.register_blueprint(sites_bp)
    
    from app.shared import shared_bp
    app.register_blueprint(shared_bp)

    from app.shark import shark_bp
    app.register_blueprint(shark_bp)

    # Development-only Blueprints

    from app.dev import dev_bp
    app.register_blueprint(dev_bp, url_prefix="/dev")

    @app.cli.command("init-db")
    def init_db():
        """Create all database tables."""
        db.create_all()
        print("Database tables created.")

    # Initialize database tables if they don't exist
    with app.app_context():
        db.create_all()
        app.logger.info("Database tables created or confirmed to exist")

    return app

# Import models here to avoid circular imports
from app import models 
