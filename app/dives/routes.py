# app/dives/routes.py

from flask import request, jsonify, abort, current_app, url_for
from app.models import Dive
from app.dives import dives_bp
from app import db
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import uuid
from flask_wtf.csrf import validate_csrf, CSRFError

# Helper: Convert a Dive object to dictionary
def dive_to_dict(dive):
    return {
        'id': dive.id,
        'user_id': dive.user_id,
        'dive_number': dive.dive_number,
        'start_time': dive.start_time.isoformat() if dive.start_time else None,
        'end_time': dive.end_time.isoformat() if dive.end_time else None,
        'max_depth': dive.max_depth,
        'weight_belt': dive.weight_belt,
        'visibility': dive.visibility,
        'weather': dive.weather,
        'location': dive.location,
        'dive_partner': dive.dive_partner,
        'notes': dive.notes,
        'media': dive.media,
        'location_thumbnail': dive.location_thumbnail,
        'created_at': dive.created_at.isoformat() if dive.created_at else None,
        'suit_type': dive.suit_type,
        'suit_thickness': dive.suit_thickness,
        'weight': dive.weight,
        'tank_type': dive.tank_type,
        'tank_size': dive.tank_size,
        'gas_mix': dive.gas_mix,
        'o2_percentage': dive.o2_percentage,
    }

# Get allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

# GET /api/dives/ - Retrieve all diving records
@dives_bp.route('/', methods=['GET'])
def get_dives():
    dives = Dive.query.all()
    return jsonify([dive_to_dict(dive) for dive in dives]), 200

# POST /api/dives/ - Create a new diving record
@dives_bp.route('/', methods=['POST'])
def create_dive():
    token = request.headers.get("X-CSRFToken")
    try:
        validate_csrf(token)
    except CSRFError as e:
        return jsonify({"error": "Invalid or missing CSRF token"}), 400

    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        dive = Dive(
            user_id=data['user_id'],
            dive_number=data.get('dive_number'),
            start_time=datetime.fromisoformat(data['start_time']),
            end_time=datetime.fromisoformat(data['end_time']),
            max_depth=data['max_depth'],
            weight_belt=data.get('weight_belt'),
            visibility=data.get('visibility'),
            weather=data.get('weather'),
            location=data['location'],
            dive_partner=data.get('dive_partner'),
            notes=data.get('notes'),
            media=data.get('media'),
            location_thumbnail=data.get('location_thumbnail'),
            suit_type=data.get('suit_type'),
            suit_thickness=data.get('suit_thickness'),
            weight=data.get('weight'),
            tank_type=data.get('tank_type'),
            tank_size=data.get('tank_size'),
            gas_mix=data.get('gas_mix'),
            o2_percentage=data.get('o2_percentage'),
        )
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e.args[0]}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    db.session.add(dive)
    db.session.commit()
    return jsonify({'id': dive.id}), 201

# GET /api/dives/<dive_id> - Retrieve a single dive record
@dives_bp.route('/<int:dive_id>', methods=['GET'])
def get_dive(dive_id):
    dive = Dive.query.get_or_404(dive_id)
    return jsonify(dive_to_dict(dive)), 200

# PUT /api/dives/<dive_id> - Update a dive record
@dives_bp.route('/<int:dive_id>', methods=['PUT'])
def update_dive(dive_id):
    dive = Dive.query.get_or_404(dive_id)
    data = request.get_json()

    dive.dive_number = data.get('dive_number', dive.dive_number)
    dive.start_time = datetime.fromisoformat(data['start_time']) if 'start_time' in data else dive.start_time
    dive.end_time = datetime.fromisoformat(data['end_time']) if 'end_time' in data else dive.end_time
    dive.max_depth = data.get('max_depth', dive.max_depth)
    dive.weight_belt = data.get('weight_belt', dive.weight_belt)
    dive.visibility = data.get('visibility', dive.visibility)
    dive.weather = data.get('weather', dive.weather)
    dive.location = data.get('location', dive.location)
    dive.dive_partner = data.get('dive_partner', dive.dive_partner)
    dive.notes = data.get('notes', dive.notes)
    dive.media = data.get('media', dive.media)
    dive.location_thumbnail = data.get('location_thumbnail', dive.location_thumbnail)
    dive.suit_type = data.get('suit_type', dive.suit_type)
    dive.suit_thickness = data.get('suit_thickness', dive.suit_thickness)
    dive.weight = data.get('weight', dive.weight)
    dive.tank_type = data.get('tank_type', dive.tank_type)
    dive.tank_size = data.get('tank_size', dive.tank_size)
    dive.gas_mix = data.get('gas_mix', dive.gas_mix)
    dive.o2_percentage = data.get('o2_percentage', dive.o2_percentage)

    db.session.commit()
    return jsonify(dive_to_dict(dive)), 200

# DELETE /api/dives/<dive_id> - Delete a dive record
@dives_bp.route('/<int:dive_id>', methods=['DELETE'])
def delete_dive(dive_id):
    dive = Dive.query.get_or_404(dive_id)
    db.session.delete(dive)
    db.session.commit()
    return '', 204

# POST /api/dives/<dive_id>/upload - Upload media for a dive
@dives_bp.route('/<int:dive_id>/upload', methods=['POST'])
def upload_dive_media(dive_id):
    dive = Dive.query.get_or_404(dive_id)
    
    if 'media' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['media']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Ensure upload directory exists
        upload_dir = os.path.join(current_app.static_folder, 'uploads', 'dives')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Update the dive record with the file path
        relative_path = f'/static/uploads/dives/{unique_filename}'
        dive.media = relative_path
        db.session.commit()
        
        return jsonify({
            "message": "File uploaded successfully",
            "media_url": relative_path
        }), 201
    
    return jsonify({"error": "Invalid file type"}), 400
