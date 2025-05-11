from flask import Blueprint, request, jsonify, current_app
from app.models import Dive, Share
from app import db
from flask_wtf.csrf import validate_csrf, CSRFError
from datetime import datetime, timedelta
import secrets
from app.shared import shared_bp

# Create a share link for a dive
@shared_bp.route('/dives/<int:dive_id>/share', methods=['POST'])
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
            creator_user_id=dive.user_id,
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
@shared_bp.route('/dives/<string:token>', methods=['GET'])
def get_shared_dive(token):
    try:
        share = Share.query.filter_by(token=token).first_or_404()

        if share.expiration_time and datetime.utcnow() > share.expiration_time:
            return jsonify({"error": "Share link expired."}), 410

        dive = Dive.query.get_or_404(share.dive_id)

        # Return a more complete version of the dive
        return jsonify(dive.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error accessing shared dive: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


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