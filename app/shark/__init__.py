from flask import Blueprint

bp = Blueprint('shark', __name__, url_prefix='/shark')

from app.shark import routes