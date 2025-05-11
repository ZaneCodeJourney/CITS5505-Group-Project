# API blueprint initialization

from flask import Blueprint

bp = Blueprint('api', __name__, url_prefix='/api')

# Import routes at the bottom to avoid circular imports
from app.api import routes 