from flask import Blueprint

bp = Blueprint('dives', __name__, url_prefix='/dives')

from app.dives import routes