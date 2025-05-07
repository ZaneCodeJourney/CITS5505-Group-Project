from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
from app import db
from app.shark import bp
from app.shark.forms import SharkReportForm
from app.models import SharkWarning, Site
from datetime import datetime
import os
import uuid

# Obtain all shark warnings
@bp.route('/warnings')
def shark_warnings():
    return render_template('shark/shark_warnings.html', title='Shark Warnings')

@bp.route('/warnings/api', methods=['GET'])
def shark_warnings_api():
    # 这里创建一个API端点，返回鲨鱼警告数据
    warnings = SharkWarning.query.all()
    result = []
    for warning in warnings:
        result.append({
            'id': warning.id,
            'site_id': warning.site_id,
            'site_name': warning.site.name,
            'species': warning.species,
            'size_estimate': warning.size_estimate,
            'sighting_time': warning.sighting_time.isoformat(),
            'report_time': warning.report_time.isoformat(),
            'severity': warning.severity,
            'description': warning.description,
            'photo_url': warning.photo_url,
            'status': warning.status,
            'reporter_name': f"{warning.reporter.firstname} {warning.reporter.lastname}" 
                             if warning.reporter else "Anonymous"
        })
    return jsonify(result)

@bp.route('/report', methods=['GET', 'POST'])
@login_required
def report_shark():
    form = SharkReportForm()
    
    # 填充选择框的选项
    form.site_id.choices = [(site.id, site.name) for site in Site.query.all()]
    
    if form.validate_on_submit():
        # 处理照片上传
        photo_url = None
        if form.photo.data:
            filename = str(uuid.uuid4()) + '.jpg'
            photo_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            form.photo.data.save(photo_path)
            photo_url = url_for('static', filename=f'uploads/{filename}')
        
        # 创建新的鲨鱼警告
        warning = SharkWarning(
            site_id=form.site_id.data,
            species=form.species.data,
            size_estimate=form.size_estimate.data,
            sighting_time=form.sighting_time.data,
            report_time=datetime.utcnow(),
            severity=form.severity.data,
            description=form.description.data,
            photo_url=photo_url,
            status='active',
            reporter_id=current_user.id
        )
        
        db.session.add(warning)
        db.session.commit()
        
        flash('Your shark warning has been submitted successfully!', 'success')
        return redirect(url_for('shark.shark_warnings'))
    
    return render_template('shark/report_shark.html', title='Report Shark Sighting', form=form)

# Report a new shark sighting for a specific dive site
@bp.route('/site/<int:site_id>', methods=['POST'])
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
@bp.route('/<int:warning_id>', methods=['PUT'])
def update_shark_warning_status(warning_id):
    warning = SharkWarning.query.get_or_404(warning_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    warning.status = data.get('status', warning.status)
    warning.severity = data.get('severity', warning.severity)

    db.session.commit()
    return jsonify(warning.to_dict()), 200