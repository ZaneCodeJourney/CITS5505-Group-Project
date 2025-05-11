from flask import Blueprint, request, jsonify, current_app, render_template, redirect, url_for, flash
from app.models import Dive, Share, User
from app import db
from flask_wtf.csrf import validate_csrf, CSRFError
from datetime import datetime, timedelta
import secrets
from app.shared import shared_bp
from flask_login import current_user, login_required

# Create a share link for a dive
@shared_bp.route('/dives/<int:dive_id>/share', methods=['POST'])
@login_required
def create_share_link(dive_id):
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


# Access a shared dive record
@shared_bp.route('/dive/<string:token>', methods=['GET'])
def get_shared_dive(token):
    try:
        share = Share.query.filter_by(token=token).first_or_404()

        if share.expiration_time and datetime.utcnow() > share.expiration_time:
            flash("This share link has expired.", "warning")
            return redirect(url_for('main.index'))

        dive = Dive.query.get_or_404(share.dive_id)
        owner = User.query.get_or_404(share.creator_user_id)
        
        # Construct owner name
        owner_name = f"{owner.firstname} {owner.lastname}" if owner.firstname and owner.lastname else owner.username
        
        # Render the dive details template with shared context
        return render_template('dive_details.html', 
                              dive=dive, 
                              is_shared=True, 
                              shared_by=owner_name,
                              shared_by_username=owner.username)
    except Exception as e:
        current_app.logger.error(f"Error accessing shared dive: {str(e)}", exc_info=True)
        flash("An error occurred while retrieving the shared dive.", "danger")
        return redirect(url_for('main.index'))


# Update share visibility for a dive
@shared_bp.route('/dives/<int:dive_id>/visibility', methods=['PUT'])
def update_dive_visibility(dive_id):
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
        data = request.get_json()

        share = Share.query.filter_by(dive_id=dive.id).first()
        if share:
            share.visibility = data.get('visibility', share.visibility)
            db.session.commit()
            return jsonify({'visibility': share.visibility}), 200

        return jsonify({'error': 'No share record found.'}), 404
    except Exception as e:
        current_app.logger.error(f"Error updating dive visibility: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Share a dive with a specific user
@shared_bp.route('/dives/<int:dive_id>/share-with-user', methods=['POST'])
@login_required
def share_with_user(dive_id):
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
        shared_with_username = data.get('username')
        
        if not shared_with_username:
            return jsonify({"error": "Username is required"}), 400
            
        # Find user to share with
        shared_with_user = User.query.filter_by(username=shared_with_username).first()
        
        if not shared_with_user:
            return jsonify({"error": f"User {shared_with_username} not found"}), 404
            
        # Check if already shared with this user
        existing_share = Share.query.filter_by(
            dive_id=dive.id,
            creator_user_id=current_user.id,
            shared_with_user_id=shared_with_user.id
        ).first()
        
        if existing_share:
            return jsonify({"message": f"Dive already shared with {shared_with_username}"}), 200
        
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
            "message": f"Dive shared with {shared_with_username}",
            "shared_with_id": shared_with_user.id,
            "created_at": share.created_at.isoformat()
        }), 201
    except Exception as e:
        current_app.logger.error(f"Error sharing dive with user: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# View dives shared with current user
@shared_bp.route('/shared-with-me', methods=['GET'])
@login_required
def dives_shared_with_me():
    try:
        # Get all shares where the current user is the shared_with_user
        shares = Share.query.filter_by(shared_with_user_id=current_user.id).all()
        
        shared_dives = []
        for share in shares:
            # Check if share is expired
            if share.expiration_time and datetime.utcnow() > share.expiration_time:
                continue
                
            dive = Dive.query.get(share.dive_id)
            if dive:
                # Get owner information
                owner = User.query.get(share.creator_user_id)
                owner_name = f"{owner.firstname} {owner.lastname}" if owner.firstname and owner.lastname else owner.username
                
                shared_dives.append({
                    'dive': dive,
                    'shared_by': owner_name,
                    'shared_by_username': owner.username,
                    'shared_date': share.created_at,
                    'token': share.token
                })
        
        return render_template('shared_with_me.html', shared_dives=shared_dives)
    except Exception as e:
        current_app.logger.error(f"Error getting shared dives: {str(e)}", exc_info=True)
        flash("An error occurred while retrieving shared dives.", "danger")
        return redirect(url_for('main.index'))

# Second route to handle direct access to /shared-with-me
@shared_bp.route('/shared-with-me', methods=['GET'], endpoint='shared_with_me')
@login_required
def shared_with_me():
    return dives_shared_with_me()