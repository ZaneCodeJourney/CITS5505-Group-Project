from flask import Blueprint, request, jsonify, current_app
from app.models import SharkWarning
from app import db
from datetime import datetime
from app.shark import shark_bp
from flask_wtf.csrf import validate_csrf, CSRFError
import logging

# Set up logger
logger = logging.getLogger(__name__)

# Obtain all shark warnings
@shark_bp.route('/', methods=['GET'])
def get_all_shark_warnings():
    warnings = SharkWarning.query.all()
    logger.info(f"Retrieved {len(warnings)} shark warnings")
    return jsonify([warning.to_dict() for warning in warnings]), 200


# Report a new shark sighting for a specific dive site
@shark_bp.route('/site/<int:site_id>', methods=['POST'])
def report_shark_warning(site_id):
    # Check CSRF token
    if current_app.config.get("WTF_CSRF_ENABLED", True):
        token = request.headers.get("X-CSRFToken") or request.headers.get("X-CSRF-Token")
        csrf_token_form = request.form.get('csrf_token')
        # For JSON requests, also try to get token from JSON data
        json_data = request.get_json(silent=True)
        csrf_token_json = json_data.get('csrf_token') if json_data else None
        
        logger.debug(f"CSRF validation - Header token: {'Present' if token else 'Missing'}, Form token: {'Present' if csrf_token_form else 'Missing'}, JSON token: {'Present' if csrf_token_json else 'Missing'}")
        
        try:
            # Try different token sources in order
            if token:
                validate_csrf(token)
                logger.debug("CSRF validation successful using header token")
            elif csrf_token_form:
                validate_csrf(csrf_token_form)
                logger.debug("CSRF validation successful using form token")
            elif csrf_token_json:
                validate_csrf(csrf_token_json)
                logger.debug("CSRF validation successful using JSON token")
            else:
                # If in development/debug mode, don't require CSRF token
                if current_app.debug:
                    logger.warning("No CSRF token found, but allowing request in debug mode")
                    pass
                else:
                    logger.warning("No CSRF token found in request")
                    raise CSRFError("The CSRF token is missing.")
        except CSRFError as e:
            # If in development mode, log but don't block the request
            if current_app.debug:
                logger.warning(f"CSRF validation failed in debug mode: {str(e)}")
            else:
                logger.warning(f"CSRF token validation failed: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400

    data = request.get_json()
    if not data:
        logger.warning("No input data provided for shark warning")
        return jsonify({'error': 'No input data provided'}), 400

    try:
        warning = SharkWarning(
            site_id=site_id,
            user_id=data['user_id'],
            species=data.get('species'),
            size_estimate=data.get('size_estimate'),
            description=data.get('description'),
            sighting_time=datetime.fromisoformat(data['sighting_time']) if data.get('sighting_time') else datetime.utcnow(),
            severity=data.get('severity', 'medium'),
            status=data.get('status', 'active'),
            photo=data.get('photo')
        )
    except KeyError as e:
        logger.error(f"Missing required field in shark warning: {e.args[0]}")
        return jsonify({'error': f'Missing required field: {e.args[0]}'}), 400
    except Exception as e:
        logger.error(f"Error creating shark warning: {str(e)}")
        return jsonify({'error': str(e)}), 400

    db.session.add(warning)
    db.session.commit()
    logger.info(f"Created new shark warning with ID: {warning.id} for site {site_id}")
    return jsonify({'id': warning.id}), 201


# Update shark warning status
@shark_bp.route('/<int:warning_id>', methods=['PUT'])
def update_shark_warning_status(warning_id):
    # Check CSRF token
    if current_app.config.get("WTF_CSRF_ENABLED", True):
        token = request.headers.get("X-CSRFToken") or request.headers.get("X-CSRF-Token")
        csrf_token_form = request.form.get('csrf_token')
        # For JSON requests, also try to get token from JSON data
        json_data = request.get_json(silent=True)
        csrf_token_json = json_data.get('csrf_token') if json_data else None
        
        logger.debug(f"CSRF validation for updating warning {warning_id} - Header token: {'Present' if token else 'Missing'}, Form token: {'Present' if csrf_token_form else 'Missing'}, JSON token: {'Present' if csrf_token_json else 'Missing'}")
        
        try:
            # Try different token sources in order
            if token:
                validate_csrf(token)
                logger.debug(f"CSRF validation successful for updating warning {warning_id} using header token")
            elif csrf_token_form:
                validate_csrf(csrf_token_form)
                logger.debug(f"CSRF validation successful for updating warning {warning_id} using form token")
            elif csrf_token_json:
                validate_csrf(csrf_token_json)
                logger.debug(f"CSRF validation successful for updating warning {warning_id} using JSON token")
            else:
                # If in development/debug mode, don't require CSRF token
                if current_app.debug:
                    logger.warning(f"No CSRF token found when updating warning {warning_id}, but allowing request in debug mode")
                    pass
                else:
                    logger.warning(f"No CSRF token found when updating warning {warning_id}")
                    raise CSRFError("The CSRF token is missing.")
        except CSRFError as e:
            # If in development mode, log but don't block the request
            if current_app.debug:
                logger.warning(f"CSRF validation failed in debug mode when updating warning {warning_id}: {str(e)}")
            else:
                logger.warning(f"CSRF token validation failed when updating warning {warning_id}: {str(e)}")
                return jsonify({"error": "Invalid or missing CSRF token"}), 400
            
    warning = SharkWarning.query.get_or_404(warning_id)
    data = request.get_json()
    if not data:
        logger.warning(f"No input data provided for updating warning {warning_id}")
        return jsonify({'error': 'No input data provided'}), 400

    previous_status = warning.status
    previous_severity = warning.severity
    
    warning.status = data.get('status', warning.status)
    warning.severity = data.get('severity', warning.severity)

    db.session.commit()
    logger.info(f"Updated shark warning {warning_id}: status '{previous_status}' -> '{warning.status}', severity '{previous_severity}' -> '{warning.severity}'")
    return jsonify(warning.to_dict()), 200