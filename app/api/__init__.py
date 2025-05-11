# API blueprint initialization

from flask import Blueprint

bp = Blueprint('api', __name__, url_prefix='/api')

# Import routes at the bottom to avoid circular imports
from app.api import routes, auth, shared_routes

# Register shared routes blueprint
from app.api.shared_routes import api_shared_bp
bp.register_blueprint(api_shared_bp, url_prefix='/shared') 