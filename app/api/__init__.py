# API blueprint initialization

from flask import Blueprint
from app import csrf

bp = Blueprint('api', __name__, url_prefix='/api')

# Disable CSRF protection for the API endpoints as they use token-based authentication
csrf.exempt(bp)

# Import routes at the bottom to avoid circular imports
from app.api import auth, users, stats 