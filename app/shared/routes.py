from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from app import db
from app.shared import bp
from app.models import Dive, Share, User
from datetime import datetime, timedelta
import secrets

# Create a share link for a dive
@bp.route('/dives/<int:dive_id>/share', methods=['POST'])
def create_share_link(dive_id):
    dive = Dive.query.get_or_404(dive_id)
    token = secrets.token_urlsafe(32)

    share = Share(
        dive_id=dive.id,
        creator_user_id=dive.user_id,
        token=token,
        visibility='public',
        expiration_time=datetime.utcnow() + timedelta(days=7)
    )

    db.session.add(share)
    db.session.commit()

    return jsonify({"share_link": f"http://127.0.0.1:5000/api/shared/dives/{share.token}"}), 201


# Access a shared dive record
@bp.route('/dives/<string:token>', methods=['GET'])
def get_shared_dive(token):
    share = Share.query.filter_by(token=token).first_or_404()

    if share.expiration_time and datetime.utcnow() > share.expiration_time:
        return jsonify({"error": "Share link expired."}), 410

    dive = Dive.query.get_or_404(share.dive_id)

    return jsonify({
        'id': dive.id,
        'dive_number': dive.dive_number,
        'start_time': dive.start_time,
        'end_time': dive.end_time,
        'max_depth': dive.max_depth,
        'location': dive.location
    }), 200


# Update share visibility for a dive
@bp.route('/dives/<int:dive_id>/visibility', methods=['PUT'])
def update_dive_visibility(dive_id):
    dive = Dive.query.get_or_404(dive_id)
    data = request.get_json()

    share = Share.query.filter_by(dive_id=dive.id).first()
    if share:
        share.visibility = data.get('visibility', share.visibility)
        db.session.commit()
        return jsonify({'visibility': share.visibility}), 200

    return jsonify({'error': 'No share record found.'}), 404

@bp.route('/')
@login_required
def shared_dives():
    return render_template('shared/shared_dives.html', title='Shared Dives')