from flask import Blueprint

bp = Blueprint('shared', __name__, url_prefix='/shared')

from app.shared import routes