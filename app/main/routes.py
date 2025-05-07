# Main routes
from flask import render_template, redirect, url_for, flash
from flask_login import current_user, login_required
from app.main import bp
from app.models import User, Dive

@bp.route('/')
@bp.route('/index')
def index():
    return render_template('index.html', title='Home')

@bp.route('/profile')
@login_required
def profile():
    # 获取当前用户的潜水记录
    dives = Dive.query.filter_by(user_id=current_user.id).order_by(Dive.start_time.desc()).limit(5).all()
    return render_template('profile/profile.html', title='Profile', user=current_user, dives=dives)

@bp.route('/settings')
@login_required
def settings():
    flash('Settings page will be implemented later', 'info')
    return redirect(url_for('main.profile'))

@bp.route('/edit-profile')
@login_required
def edit_profile():
    return render_template('profile/edit-public-profile.html', title='Edit Profile', user=current_user)

@bp.route('/about')
def about():
    return render_template('about.html', title='About')

@bp.route('/contact')
def contact():
    return render_template('contact.html', title='Contact')

@bp.route('/privacy')
def privacy():
    return render_template('privacy.html', title='Privacy Policy')

@bp.route('/terms')
def terms():
    return render_template('terms.html', title='Terms of Service')

@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', title='Dashboard') 