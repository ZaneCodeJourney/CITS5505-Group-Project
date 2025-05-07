# Main routes
from flask import render_template, current_app
from app.main import bp

@bp.route('/')
@bp.route('/index')
def index():
    return render_template('index.html', title='Home')

@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', title='Dashboard')

@bp.route('/new-log')
def new_log():
    return render_template('new_log.html', title='Add New Dive Log') 