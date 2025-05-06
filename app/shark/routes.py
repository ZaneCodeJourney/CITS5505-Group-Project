from flask import Blueprint, request, jsonify
from app.models import SharkWarning
from app import db
from datetime import datetime
from app.shark import shark_bp

# Obtain all shark warnings
@shark_bp.route('/', methods=['GET'])
def get_all_shark_warnings():
    warnings = SharkWarning.query.all()
    return jsonify([warning.to_dict() for warning in warnings]), 200


# Report a new shark sighting for a specific dive site
@shark_bp.route('/site/<int:site_id>', methods=['POST'])
def report_shark_warning(site_id):
    data = request.get_json()
    if not data:
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
        return jsonify({'error': f'Missing required field: {e.args[0]}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    db.session.add(warning)
    db.session.commit()
    return jsonify({'id': warning.id}), 201


# Update shark warning status
@shark_bp.route('/<int:warning_id>', methods=['PUT'])
def update_shark_warning_status(warning_id):
    warning = SharkWarning.query.get_or_404(warning_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    warning.status = data.get('status', warning.status)
    warning.severity = data.get('severity', warning.severity)

    db.session.commit()
    return jsonify(warning.to_dict()), 200