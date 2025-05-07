from flask import Blueprint

bp = Blueprint('sites', __name__, url_prefix='/sites')

from app.sites import routes