from flask import Blueprint, request, jsonify, current_app
from app.models import Dive, Share, User
from app import db
from flask_wtf.csrf import validate_csrf, CSRFError
from datetime import datetime, timedelta
import secrets
from flask_login import current_user, login_required

api_shared_bp = Blueprint('api_shared', __name__)

# API route to create a share link
@api_shared_bp.route('/dives/<int:dive_id>/share', methods=['POST'])
@login_required
def api_create_share_link(dive_id):
    try:
        # Check CSRF token
        if current_app.config.get("WTF_CSRF_ENABLED", True):
            token = request.headers.get("X-CSRFToken")
            try:
                validate_csrf(token)
            except CSRFError as e:
                current_app.logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400
                
        dive = Dive.query.get_or_404(dive_id)
        
        # Ensure dive belongs to current user
        if dive.user_id != current_user.id:
            return jsonify({"error": "You can only share your own dives"}), 403
            
        token = secrets.token_urlsafe(32)
        
        # Get expiration setting from request
        data = request.get_json()
        expiration_days = data.get('expiration_days') if data else 7
        
        # Calculate expiration time (None if never expires)
        expiration_time = None
        if expiration_days is not None:
            expiration_time = datetime.utcnow() + timedelta(days=expiration_days)
        
        # Create new share
        share = Share(
            dive_id=dive.id,
            creator_user_id=current_user.id,
            token=token,
            visibility='public',
            expiration_time=expiration_time
        )

        db.session.add(share)
        db.session.commit()

        # Generate the share URL
        share_url = f"/shared/dive/{share.token}"

        return jsonify({
            "share_link": share_url,
            "token": share.token,
            "expiration_time": share.expiration_time.isoformat() if share.expiration_time else None,
            "created_at": share.created_at.isoformat()
        }), 201
    except Exception as e:
        current_app.logger.error(f"Error creating share link: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
# API route to share dive with specific user
@api_shared_bp.route('/dives/<int:dive_id>/share-with-user', methods=['POST'])
@login_required
def api_share_with_user(dive_id):
    try:
        # Check CSRF token
        if current_app.config.get("WTF_CSRF_ENABLED", True):
            token = request.headers.get("X-CSRFToken")
            try:
                validate_csrf(token)
            except CSRFError as e:
                current_app.logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400
                
        dive = Dive.query.get_or_404(dive_id)
        
        # Ensure dive belongs to current user
        if dive.user_id != current_user.id:
            return jsonify({"error": "You can only share your own dives"}), 403
            
        data = request.get_json()
        recipient = data.get('username')
        
        if not recipient:
            return jsonify({"error": "Username or email is required"}), 400
            
        # Check if input is email or username
        is_email = '@' in recipient
        
        # Find user to share with
        if is_email:
            shared_with_user = User.query.filter_by(email=recipient).first()
            current_app.logger.info(f"Searching for user by email: {recipient}, found: {shared_with_user is not None}")
        else:
            shared_with_user = User.query.filter_by(username=recipient).first()
            current_app.logger.info(f"Searching for user by username: {recipient}, found: {shared_with_user is not None}")
        
        if not shared_with_user:
            # Return a specific 404 response for user not found
            current_app.logger.warning(f"User not found: {recipient}")
            return jsonify({"error": f"User with {'email' if is_email else 'username'} {recipient} not found"}), 404
            
        # Check if already shared with this user
        existing_share = Share.query.filter_by(
            dive_id=dive.id,
            creator_user_id=current_user.id,
            shared_with_user_id=shared_with_user.id
        ).first()
        
        if existing_share:
            return jsonify({"message": f"Dive already shared with {shared_with_user.username}"}), 200
        
        # Create share token
        token = secrets.token_urlsafe(32)
        
        # Calculate expiration time (default 30 days)
        expiration_time = datetime.utcnow() + timedelta(days=30)
        
        # Create new share
        share = Share(
            dive_id=dive.id,
            creator_user_id=current_user.id,
            shared_with_user_id=shared_with_user.id,
            token=token,
            visibility='user_specific',
            expiration_time=expiration_time
        )

        db.session.add(share)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Dive shared with {shared_with_user.username}",
            "shared_with_id": shared_with_user.id,
            "created_at": share.created_at.isoformat()
        }), 201
    except Exception as e:
        current_app.logger.error(f"Error sharing dive with user: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500 