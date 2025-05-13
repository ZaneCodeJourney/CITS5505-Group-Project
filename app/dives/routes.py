# app/dives/routes.py

from flask import request, jsonify, abort, current_app, url_for
from app.models import Dive
from app.dives import dives_bp
from app import db
from app import csrf
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import uuid
from flask_wtf.csrf import validate_csrf, CSRFError, generate_csrf
from flask_login import login_required, current_user

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
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'csv'}

# Helper function to check if the current user owns the dive
def check_dive_ownership(dive_id):
    dive = Dive.query.get_or_404(dive_id)
    if dive.user_id != current_user.id:
        current_app.logger.warning(f"User {current_user.id} attempted to access dive {dive_id} owned by user {dive.user_id}")
        abort(403)  # Forbidden
    return dive

# GET /api/dives/ - Retrieve all diving records
@dives_bp.route('/', methods=['GET'])
def get_dives():
    try:
        dives = Dive.query.all()
        return jsonify([dive_to_dict(dive) for dive in dives]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching dives: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@dives_bp.route('/', methods=['POST'])
@login_required
def create_dive():
    try:
        # Check CSRF token
        if current_app.config.get("WTF_CSRF_ENABLED", True):
            token = request.headers.get("X-CSRFToken")
            try:
                validate_csrf(token)
            except CSRFError as e:
                current_app.logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400

        data = request.get_json()
        current_app.logger.info(f"Received dive creation request with data: {data}")

        if not data:
            current_app.logger.warning("No input data provided in request")
            return jsonify({"error": "No input data provided"}), 400

        try:
            # Log individual field values to help debug
            current_app.logger.info(f"start_time: {data.get('start_time')}")
            current_app.logger.info(f"end_time: {data.get('end_time')}")
            current_app.logger.info(f"max_depth: {data.get('max_depth')}")
            current_app.logger.info(f"location: {data.get('location')}")
            
            dive = Dive(
                user_id=current_user.id,  # Get user ID from current_user
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
            current_app.logger.info("Successfully created dive object")
        except KeyError as e:
            current_app.logger.error(f"Missing required field: {e.args[0]}")
            return jsonify({"error": f"Missing required field: {e.args[0]}"}), 400
        except Exception as e:
            current_app.logger.error(f"Error creating dive object: {str(e)}", exc_info=True)
            return jsonify({"error": str(e)}), 400

        try:
            current_app.logger.info("Adding dive to database session")
            db.session.add(dive)
            current_app.logger.info("Committing to database")
            db.session.commit()
            current_app.logger.info(f"Successfully created dive with ID: {dive.id}")
            return jsonify({'id': dive.id}), 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(e)}", exc_info=True)
            return jsonify({"error": str(e)}), 500
    except Exception as e:
        current_app.logger.error(f"Unhandled exception in create_dive: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

# GET /api/dives/<dive_id> - Retrieve a single dive record
@dives_bp.route('/<int:dive_id>', methods=['GET'])
@login_required
def get_dive(dive_id):
    try:
        dive = check_dive_ownership(dive_id)
        return jsonify(dive_to_dict(dive)), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching dive {dive_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# PUT /api/dives/<dive_id> - Update a dive record
@dives_bp.route('/<int:dive_id>', methods=['PUT'])
@login_required
def update_dive(dive_id):
    try:
        # Check CSRF token
        if current_app.config.get("WTF_CSRF_ENABLED", True):
            token = request.headers.get("X-CSRFToken")
            try:
                validate_csrf(token)
            except CSRFError as e:
                current_app.logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400
        
        dive = check_dive_ownership(dive_id)
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
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating dive {dive_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# DELETE /api/dives/<dive_id> - Delete a dive record
@dives_bp.route('/<int:dive_id>', methods=['DELETE'])
@login_required
def delete_dive(dive_id):
    try:
        # Check CSRF token
        if current_app.config.get("WTF_CSRF_ENABLED", True):
            token = request.headers.get("X-CSRFToken")
            try:
                validate_csrf(token)
            except CSRFError as e:
                current_app.logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400
        
        dive = check_dive_ownership(dive_id)
        
        # Delete associated shares first
        from app.models import Share
        shares = Share.query.filter_by(dive_id=dive_id).all()
        for share in shares:
            db.session.delete(share)
            
        # Now delete the dive
        db.session.delete(dive)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting dive {dive_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# POST /api/dives/<dive_id>/upload - Upload media for a dive
@dives_bp.route('/<int:dive_id>/upload', methods=['POST'])
@login_required
def upload_dive_media(dive_id):
    try:
        # Check CSRF token
        if current_app.config.get("WTF_CSRF_ENABLED", True):
            token = request.headers.get("X-CSRFToken")
            try:
                validate_csrf(token)
            except CSRFError as e:
                current_app.logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400
                
        dive = check_dive_ownership(dive_id)
        
        if 'media' not in request.files:
            current_app.logger.warning(f"No file part in upload request for dive {dive_id}")
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['media']
        
        if file.filename == '':
            current_app.logger.warning(f"No selected file in upload request for dive {dive_id}")
            return jsonify({"error": "No selected file"}), 400
            
        if file and allowed_file(file.filename):
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            # Ensure upload directory exists
            upload_dir = os.path.join(current_app.static_folder, 'uploads', 'dives')
            os.makedirs(upload_dir, exist_ok=True)
            
            try:
                # Save the file
                file_path = os.path.join(upload_dir, unique_filename)
                current_app.logger.info(f"Saving file to {file_path}")
                file.save(file_path)
                
                # Update the dive record with the file path
                relative_path = f'/static/uploads/dives/{unique_filename}'
                dive.media = relative_path
                db.session.commit()
                
                current_app.logger.info(f"File uploaded successfully for dive {dive_id}")
                return jsonify({
                    "message": "File uploaded successfully",
                    "media_url": relative_path
                }), 201
            except Exception as e:
                current_app.logger.error(f"Error saving file for dive {dive_id}: {str(e)}", exc_info=True)
                return jsonify({"error": f"Error saving file: {str(e)}"}), 500
        
        current_app.logger.warning(f"Invalid file type for dive {dive_id}")
        return jsonify({"error": "Invalid file type"}), 400
    except Exception as e:
        current_app.logger.error(f"Unhandled exception in upload_dive_media: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

# POST /api/dives/<dive_id>/upload-csv - Upload CSV profile for a dive
@dives_bp.route('/<int:dive_id>/upload-csv', methods=['POST'])
@login_required
def upload_dive_csv(dive_id):
    try:
        # Check CSRF token
        if current_app.config.get("WTF_CSRF_ENABLED", True):
            token = request.headers.get("X-CSRFToken")
            csrf_token_form = request.form.get('csrf_token')
            current_app.logger.debug(f"CSRF token from header: {token}")
            current_app.logger.debug(f"CSRF token from form: {csrf_token_form}")
            
            try:
                # Try header token first, then form token
                if token:
                    validate_csrf(token)
                elif csrf_token_form:
                    validate_csrf(csrf_token_form)
                else:
                    raise CSRFError("The CSRF token is missing.")
            except CSRFError as e:
                current_app.logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400
        
        dive = check_dive_ownership(dive_id)
        
        # Debug info
        current_app.logger.info(f"Upload-CSV request for dive {dive_id}")
        current_app.logger.info(f"Request content type: {request.content_type}")
        current_app.logger.info(f"Files in request: {list(request.files.keys())}")
        current_app.logger.info(f"Form data in request: {list(request.form.keys())}")
        
        # Handle case when no file is in the request
        if 'profile_csv' not in request.files:
            current_app.logger.warning("No file part named 'profile_csv' in request")
            return jsonify({"error": "No CSV file provided"}), 400
            
        file = request.files['profile_csv']
        current_app.logger.info(f"Received file: {file.filename}, mimetype: {file.mimetype}")
        
        # Handle empty filename
        if file.filename == '' or not file.filename:
            current_app.logger.warning("Empty filename")
            return jsonify({"error": "No file selected"}), 400
            
        # Check file extension
        if not file.filename.lower().endswith('.csv'):
            current_app.logger.warning(f"Invalid file extension: {file.filename}")
            return jsonify({"error": "File must have .csv extension"}), 400
            
        try:
            # Save file content to memory first
            file_content = file.read()
            
            # Check if file is empty
            if len(file_content) == 0:
                current_app.logger.warning("Empty file")
                return jsonify({"error": "CSV file is empty"}), 400
                
            # Try to decode as UTF-8
            try:
                csv_content = file_content.decode('utf-8')
            except UnicodeDecodeError:
                current_app.logger.warning("Failed to decode as UTF-8, trying with Latin-1")
                try:
                    csv_content = file_content.decode('latin-1')
                except:
                    current_app.logger.error("Failed to decode file as text")
                    return jsonify({"error": "Could not read file as text"}), 400
            
            current_app.logger.info(f"CSV content length: {len(csv_content)} bytes")
            
            # Check if content is empty after stripping whitespace
            if len(csv_content.strip()) == 0:
                current_app.logger.warning("CSV content is empty")
                return jsonify({"error": "CSV file contains no data"}), 400
            
            # Basic validation of CSV format
            lines = csv_content.strip().split('\n')
            current_app.logger.info(f"CSV has {len(lines)} lines")
            
            if len(lines) < 2:  # At least a header and one data row
                current_app.logger.warning("CSV has too few lines")
                return jsonify({"error": "CSV must have a header row and at least one data row"}), 400
                
            # Check if file has comma-separated values
            if ',' not in lines[0]:
                current_app.logger.warning("CSV header has no commas")
                return jsonify({"error": "CSV must contain comma-separated values"}), 400
                
            # Check if it has columns for time and depth
            header_row = lines[0].lower()
            if not any(word in header_row for word in ['time', 'minute', 'min']) or \
            not any(word in header_row for word in ['depth', 'profundidad', 'tiefe']):
                current_app.logger.warning("CSV missing required columns")
                return jsonify({"error": "CSV must have columns for time and depth"}), 400
                
            # All checks passed, store CSV data
            dive.profile_csv_data = csv_content
            db.session.commit()
            
            current_app.logger.info(f"CSV data successfully saved for dive {dive_id}")
            return jsonify({
                "message": "CSV data uploaded successfully"
            }), 201
        except Exception as e:
            current_app.logger.error(f"Error processing CSV: {str(e)}", exc_info=True)
            return jsonify({"error": f"Error processing CSV file: {str(e)}"}), 400
    except Exception as e:
        current_app.logger.error(f"Unhandled exception in upload_dive_csv: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

# Helper: Get sample CSV data
def get_sample_csv():
    return """Time (min),Depth (m),Temperature (°C),Air (bar)
0,0,26,200
1,5,25,195
2,10,24,190
3,15,23,185
4,20,22,180
5,25,21,175
6,25,21,170
7,22,21,165
8,20,21,160
9,18,21,155
10,20,21,150
11,22,21,145
12,25,21,140
13,20,22,135
14,15,22,130
15,10,23,125
16,5,24,120
17,0,25,115"""

# GET /api/dives/sample - Create a sample dive with CSV data for testing
@dives_bp.route('/sample', methods=['GET'])
@login_required
def create_sample_dive():
    # Check if a sample dive already exists
    sample_dive = Dive.query.filter_by(location='Tubbataha Reef - Philippines', user_id=current_user.id).first()
    
    if sample_dive:
        return jsonify({
            "message": "Sample dive already exists",
            "id": sample_dive.id
        }), 200
    
    # Create sample dive
    sample_dive = Dive(
        user_id=current_user.id,
        dive_number=42,
        start_time=datetime.strptime('2023-06-05 10:00:00', '%Y-%m-%d %H:%M:%S'),
        end_time=datetime.strptime('2023-06-05 10:48:00', '%Y-%m-%d %H:%M:%S'),
        max_depth=25.0,
        location='Tubbataha Reef - Philippines',
        weather='Sunny',
        visibility='30m',
        notes='Beautiful wall dive with incredible visibility. Spotted several turtles, a school of barracuda, and even a reef shark! Uploaded computer data for this dive.',
        profile_csv_data=get_sample_csv()
    )
    
    db.session.add(sample_dive)
    db.session.commit()
    
    return jsonify({
        "message": "Sample dive created successfully",
        "id": sample_dive.id,
        "location": sample_dive.location
    }), 201

# HTML route for testing CSV uploads
@dives_bp.route('/test_upload/<int:dive_id>', methods=['GET'])
def test_upload_page(dive_id):
    from flask import render_template_string
    
    csrf_token = generate_csrf()
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>CSV Upload Test</title>
        <meta name="csrf-token" content="{{ csrf_token }}">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
            }
            input[type="file"] {
                padding: 8px 0;
            }
            button {
                padding: 10px 15px;
                background-color: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .result {
                margin-top: 20px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            .sample {
                font-family: monospace;
                white-space: pre;
                background-color: #f5f5f5;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                overflow-x: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Direct CSV Upload Test</h1>
            <p>Use this form to upload a CSV file for dive #{{ dive_id }}.</p>
            
            <form id="uploadForm" action="/api/dives/{{ dive_id }}/upload-csv" method="post" enctype="multipart/form-data">
                <input type="hidden" name="csrf_token" value="{{ csrf_token }}">
                <div class="form-group">
                    <label for="csvFile">CSV File:</label>
                    <input type="file" id="csvFile" name="profile_csv" accept=".csv" required>
                    <p><small>The CSV file should have columns for time and depth.</small></p>
                </div>
                
                <div class="form-group">
                    <h3>Sample CSV Format:</h3>
                    <div class="sample">Time (min),Depth (m),Temperature (°C),Air (bar)
0,0,26,200
3,5,25,190
6,10,24,180</div>
                </div>
                
                <button type="submit">Upload CSV</button>
            </form>
        </div>
    </body>
    </html>
    """
    
    return render_template_string(html, dive_id=dive_id, csrf_token=csrf_token)
