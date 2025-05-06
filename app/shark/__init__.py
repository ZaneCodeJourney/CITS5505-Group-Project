from flask import Blueprint

shark_bp = Blueprint('shark_warnings', __name__, url_prefix='/api/shark-warnings')

from app.shark import routes