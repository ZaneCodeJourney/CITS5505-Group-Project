# API blueprint initialization

from flask import Blueprint

bp = Blueprint('api', __name__, url_prefix='/api')

# Import routes at the bottom to avoid circular imports
from app.api import routes, auth, users, shared_routes, species

# Register shared routes blueprint
from app.api.shared_routes import api_shared_bp
bp.register_blueprint(api_shared_bp, url_prefix='/shared')

# Register species routes blueprint
from app.api.species import species_api
bp.register_blueprint(species_api, url_prefix='/species') 