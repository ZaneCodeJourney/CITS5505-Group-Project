from flask import Blueprint

dives_bp = Blueprint('dives', __name__, url_prefix='/api/dives')

from app.dives import routes
