from flask import Blueprint

shared_bp = Blueprint('shared', __name__, url_prefix='/api/shared')

from app.shared import routes