from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from config import Config
import os

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 确保上传文件夹存在
    upload_folder = os.path.join(app.static_folder, 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    app.config['UPLOAD_FOLDER'] = upload_folder

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

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

    from app.dives import bp as dives_bp
    app.register_blueprint(dives_bp)

    from app.sites import bp as sites_bp
    app.register_blueprint(sites_bp)
    
    from app.shared import bp as shared_bp
    app.register_blueprint(shared_bp)

    from app.shark import bp as shark_bp
    app.register_blueprint(shark_bp)

    @app.cli.command("init-db")
    def init_db():
        """Create all database tables."""
        db.create_all()
        print("Database tables created.")

    return app

# Import models here to avoid circular imports
from app import models 
