from flask import jsonify, request, current_app, url_for
from flask_login import login_user, logout_user, current_user
from werkzeug.security import generate_password_hash
from app import db
from app.api import bp
from app.models import User
from datetime import datetime, timedelta
import secrets
import jwt
from functools import wraps
import re

# Utility to validate email format
def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

# Utility to validate password strength
def is_valid_password(password):
    # At least 8 characters, one uppercase, one lowercase, one number
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True

# Decorator to ensure the request has JSON content
def require_json(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 415
        return f(*args, **kwargs)
    return decorated_function

# Register a new user
@bp.route('/auth/register', methods=['POST'])
@require_json
def register():
    if current_user.is_authenticated:
        return jsonify({"error": "Already authenticated"}), 400
    
    data = request.json
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate email format
    if not is_valid_email(data['email']):
        return jsonify({"error": "Invalid email format"}), 400
    
    # Validate password strength
    if not is_valid_password(data['password']):
        return jsonify({"error": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        firstname=data.get('firstname', ''),
        lastname=data.get('lastname', ''),
        bio=data.get('bio', ''),
        dob=datetime.strptime(data.get('dob', '2000-01-01'), '%Y-%m-%d').date() if data.get('dob') else None,
        registration_date=datetime.utcnow(),
        avatar=data.get('avatar', ''),
        status='active'
    )
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "message": "User registered successfully",
            "user_id": user.id,
            "username": user.username
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# User login
@bp.route('/auth/login', methods=['POST'])
@require_json
def login():
    if current_user.is_authenticated:
        return jsonify({"error": "Already logged in"}), 400
    
    data = request.json
    
    # Validate required fields
    if 'email' not in data or 'password' not in data:
        return jsonify({"error": "Both email and password are required"}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    # Check user exists and password is correct
    if user is None or not user.check_password(data['password']):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Check if account is active
    if user.status != 'active':
        return jsonify({"error": "Account is deactivated"}), 403
    
    # Log in the user
    login_user(user, remember=data.get('remember', False))
    
    return jsonify({
        "message": "Login successful",
        "user_id": user.id,
        "username": user.username
    }), 200

# User logout
@bp.route('/auth/logout', methods=['POST'])
def logout():
    if current_user.is_authenticated:
        logout_user()
        return jsonify({"message": "Logout successful"}), 200
    else:
        return jsonify({"error": "Not logged in"}), 401

# Generate password reset token
def generate_reset_token(user):
    payload = {
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    }
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

# Verify password reset token
def verify_reset_token(token):
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        user_id = payload.get('user_id')
        return User.query.get(user_id)
    except:
        return None

# Forgot password - request reset link
@bp.route('/auth/forgot-password', methods=['POST'])
@require_json
def forgot_password():
    data = request.json
    
    if 'email' not in data:
        return jsonify({"error": "Email is required"}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    # Always return success to prevent email enumeration attacks
    if not user:
        return jsonify({"message": "If your email is registered, you will receive a password reset link"}), 200
    
    # Generate token
    token = generate_reset_token(user)
    
    # In a real application, you would send an email here
    # For this example, we'll just return the token in the response
    reset_url = f"/auth/reset-password?token={token}"
    
    # TODO: Send email with reset_url
    
    return jsonify({
        "message": "If your email is registered, you will receive a password reset link",
        "debug_token": token,  # Remove in production
        "debug_url": reset_url  # Remove in production
    }), 200

# Reset password with token
@bp.route('/auth/reset-password', methods=['POST'])
@require_json
def reset_password():
    data = request.json
    
    if 'token' not in data or 'new_password' not in data:
        return jsonify({"error": "Token and new password are required"}), 400
    
    # Validate password strength
    if not is_valid_password(data['new_password']):
        return jsonify({"error": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"}), 400
    
    user = verify_reset_token(data['token'])
    
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 400
    
    # Check if account is active
    if user.status != 'active':
        return jsonify({"error": "Account is deactivated"}), 403
    
    # Update password
    user.set_password(data['new_password'])
    
    try:
        db.session.commit()
        return jsonify({"message": "Password reset successful"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500 