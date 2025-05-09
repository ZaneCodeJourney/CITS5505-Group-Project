from flask import Blueprint

dev_bp = Blueprint('dev', __name__)

from app.dev import routes