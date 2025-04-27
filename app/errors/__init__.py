# Error handling module initialization file
from flask import Blueprint

bp = Blueprint('errors', __name__)

from app.errors import routes 