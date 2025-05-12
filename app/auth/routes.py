# Authentication routes
from flask import render_template, redirect, url_for
from app.auth import bp
from flask_login import current_user

@bp.route('/register')
def register():
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    return render_template('auth/register.html', title='Register')

@bp.route('/login')
def login():
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    return render_template('auth/login.html', title='Login')

@bp.route('/forgot-password')
def forgot_password():
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    return render_template('auth/forgot_password.html', title='Forgot Password')

@bp.route('/reset-password')
def reset_password():
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    return render_template('auth/reset_password.html', title='Reset Password')

@bp.route('/profile')
def profile():
    # Redirect to login if not logged in
    if not current_user.is_authenticated:
        return redirect(url_for('auth.login'))
    return render_template('auth/profile.html', title='My Profile')

@bp.route('/sharkwarning')
def sharkwarning():
    # Redirect to login if not logged in
    if not current_user.is_authenticated:
        return redirect(url_for('auth.login'))
    return render_template('auth/sharkwarning.html', title='Shark Warnings')

@bp.route('/reportshark')
def reportshark():
    # Redirect to login if not logged in
    if not current_user.is_authenticated:
        return redirect(url_for('auth.login'))
    return render_template('auth/reportshark.html', title='Report Shark Sighting')