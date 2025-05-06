from flask import Blueprint

sites_bp = Blueprint('sites', __name__, url_prefix='/api/sites')

from app.sites import routes