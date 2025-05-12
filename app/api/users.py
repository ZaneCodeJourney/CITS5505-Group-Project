from flask import jsonify, request, g, current_app
from flask_login import login_required, current_user
from app import db
from app.api import bp
from app.models import User
from datetime import datetime
from functools import wraps
import re
from sqlalchemy import or_

# Decorator to ensure the request has JSON content
def require_json(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 415
        return f(*args, **kwargs)
    return decorated_function

# Utility to validate email format
def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))

# Get current user profile
@bp.route('/users/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "firstname": current_user.firstname,
        "lastname": current_user.lastname,
        "bio": current_user.bio,
        "dob": current_user.dob.strftime('%Y-%m-%d') if current_user.dob else None,
        "registration_date": current_user.registration_date.strftime('%Y-%m-%d %H:%M:%S'),
        "avatar": current_user.avatar,
        "status": current_user.status
    }), 200

# Update current user profile
@bp.route('/users/me', methods=['PUT'])
@login_required
@require_json
def update_current_user():
    data = request.json
    
    # Fields that can be updated
    updatable_fields = ['firstname', 'lastname', 'bio', 'dob', 'avatar']
    
    # Validate email if it's being updated
    if 'email' in data and data['email'] != current_user.email:
        if not is_valid_email(data['email']):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Check if email is already taken
        if User.query.filter_by(email=data['email']).first() is not None:
            return jsonify({"error": "Email already in use"}), 400
        
        current_user.email = data['email']
    
    # Update username if it's being changed
    if 'username' in data and data['username'] != current_user.username:
        # Check if username is already taken
        if User.query.filter_by(username=data['username']).first() is not None:
            return jsonify({"error": "Username already in use"}), 400
        
        current_user.username = data['username']
    
    # Update other fields
    for field in updatable_fields:
        if field in data:
            if field == 'dob' and data[field]:
                try:
                    current_user.dob = datetime.strptime(data[field], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Date of birth must be in format YYYY-MM-DD"}), 400
            else:
                setattr(current_user, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "firstname": current_user.firstname,
                "lastname": current_user.lastname,
                "bio": current_user.bio,
                "dob": current_user.dob.strftime('%Y-%m-%d') if current_user.dob else None,
                "avatar": current_user.avatar
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Deactivate user account
@bp.route('/users/me/deactivate', methods=['POST'])
@login_required
def deactivate_account():
    # This is a soft delete - just marking the account as inactive
    current_user.status = 'deactivated'
    
    try:
        db.session.commit()
        return jsonify({"message": "Account deactivated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/users/search', methods=['GET'])
@login_required
def search_users():
    """Search for users by username or email (partial match)"""
    query = request.args.get('q', '')
    
    if not query or len(query) < 2:
        return jsonify({
            'users': [],
            'message': 'Please enter at least 2 characters to search'
        }), 200
    
    # Search for users matching the query in username or email
    users = User.query.filter(
        or_(
            User.username.ilike(f'%{query}%'),
            User.email.ilike(f'%{query}%')
        )
    ).limit(10).all()
    
    # Format the results
    results = []
    for user in users:
        # Don't include the current user in results
        if user.id != current_user.id:
            results.append({
                'id': user.id,
                'username': user.username,
                'email': user.email
            })
    
    return jsonify({
        'users': results,
        'query': query
    }), 200 