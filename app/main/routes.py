# Main routes
from flask import render_template, redirect, url_for, flash, current_app, request, jsonify
from flask_login import current_user, login_required
from app.main import bp
from app.models import User, Dive
from sqlalchemy import func
from datetime import datetime
from werkzeug.security import check_password_hash
import os, uuid
from app import db

@bp.route('/')
@bp.route('/index')
def index():
    return render_template('index.html', title='Home')

@bp.route('/profile')
@login_required
def profile():
    # 获取当前用户的潜水记录
    dives = Dive.query.filter_by(user_id=current_user.id).order_by(Dive.start_time.desc()).limit(5).all()
    return render_template('profile/profile.html', title='Profile', user=current_user, dives=dives)

@bp.route('/settings')
@login_required
def settings():
    flash('Settings page will be implemented later', 'info')
    return redirect(url_for('main.profile'))

@bp.route('/edit-profile')
@login_required
def edit_profile():
    return render_template('profile/edit-public-profile.html', title='Edit Profile', user=current_user)

@bp.route('/api/users/me', methods=['PUT'])
@login_required
def update_profile():
    """API端点处理用户个人资料更新"""
    try:
        # 获取表单数据
        firstname = request.form.get('firstname')
        lastname = request.form.get('lastname')
        username = request.form.get('username')
        bio = request.form.get('bio')
        
        # 更新用户信息
        current_user.firstname = firstname
        current_user.lastname = lastname
        current_user.bio = bio
        
        # 如果用户名更改了，确保新用户名不与现有用户名冲突
        if username != current_user.username:
            existing_user = User.query.filter_by(username=username).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({"error": "Username already taken"}), 400
            current_user.username = username
        
        # 处理头像上传
        if 'avatar' in request.files:
            avatar_file = request.files['avatar']
            if avatar_file and avatar_file.filename:
                # 生成唯一的文件名
                filename = str(uuid.uuid4()) + os.path.splitext(avatar_file.filename)[1]
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                avatar_file.save(filepath)
                
                # 更新用户头像
                current_user.avatar = url_for('static', filename=f'uploads/{filename}')
        
        # 保存更改
        db.session.commit()
        
        return jsonify({"message": "Profile updated successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/api/users/change-email', methods=['POST'])
@login_required
def change_email():
    """API端点处理用户邮箱更改"""
    try:
        # 获取表单数据
        current_password = request.form.get('current_password')
        new_email = request.form.get('new_email')
        
        # 验证当前密码
        if not current_user.check_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 400
        
        # 验证新邮箱是否已被使用
        if new_email == current_user.email:
            return jsonify({"error": "New email is the same as current email"}), 400
            
        existing_user = User.query.filter_by(email=new_email).first()
        if existing_user:
            return jsonify({"error": "Email is already registered to another account"}), 400
        
        # 更新邮箱
        current_user.email = new_email
        db.session.commit()
        
        return jsonify({"message": "Email updated successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/api/users/change-password', methods=['POST'])
@login_required
def change_password():
    """API端点处理用户密码更改"""
    try:
        # 获取表单数据
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        # 验证当前密码
        if not current_user.check_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 400
        
        # 验证新密码
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
            
        # 确认新密码
        if new_password != confirm_password:
            return jsonify({"error": "New passwords do not match"}), 400
        
        # 更新密码
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({"message": "Password updated successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/about')
def about():
    return render_template('about.html', title='About')

@bp.route('/contact')
def contact():
    return render_template('contact.html', title='Contact')

@bp.route('/privacy')
def privacy():
    return render_template('privacy.html', title='Privacy Policy')

@bp.route('/terms')
def terms():
    return render_template('terms.html', title='Terms of Service')

@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', title='Dashboard')

@bp.route('/new-log')
def new_log():
    return render_template('new_log.html', title='Add New Dive Log')

@bp.route('/my-logs')
# @login_required - Commented out for testing
def my_logs():
    # For testing, set user_id to 1
    user_id = 1
    
    # Check for success message
    success_message = None
    if request.args.get('success') == 'dive_created':
        success_message = "Dive log created successfully!"
    
    # Start with base query for current user's dives
    query = Dive.query.filter_by(user_id=user_id)
    
    # Handle filters from query parameters
    if request.args:
        # Date filters
        if request.args.get('date_from'):
            try:
                date_from = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d')
                query = query.filter(Dive.start_time >= date_from)
            except ValueError:
                pass
                
        if request.args.get('date_to'):
            try:
                date_to = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d')
                # Add one day to include the entire day
                date_to = date_to.replace(hour=23, minute=59, second=59)
                query = query.filter(Dive.start_time <= date_to)
            except ValueError:
                pass
        
        # Location filter
        if request.args.get('location'):
            query = query.filter(Dive.location == request.args.get('location'))
        
        # Depth filters
        if request.args.get('min_depth'):
            try:
                min_depth = float(request.args.get('min_depth'))
                query = query.filter(Dive.max_depth >= min_depth)
            except ValueError:
                pass
                
        if request.args.get('max_depth'):
            try:
                max_depth = float(request.args.get('max_depth'))
                query = query.filter(Dive.max_depth <= max_depth)
            except ValueError:
                pass
    
    # Order by date (oldest first)
    dives = query.order_by(Dive.start_time.asc()).all()
    
    # Calculate diving statistics
    stats = {}
    
    # Get all dives for stats calculation
    all_dives = Dive.query.filter_by(user_id=user_id).all()
    
    if all_dives:
        max_depth_dive = max(all_dives, key=lambda dive: dive.max_depth)
        stats['total_dives'] = len(all_dives)
        stats['max_depth'] = max_depth_dive.max_depth
        
        # Calculate total dive time and longest dive
        longest_dive = None
        total_dive_minutes = 0
        
        for dive in all_dives:
            if dive.start_time and dive.end_time:
                duration_minutes = (dive.end_time - dive.start_time).total_seconds() / 60
                total_dive_minutes += duration_minutes
                
                if longest_dive is None or duration_minutes > longest_dive[1]:
                    longest_dive = (dive, duration_minutes)
        
        if longest_dive:
            stats['longest_dive'] = round(longest_dive[1])
        else:
            stats['longest_dive'] = 0
            
        stats['total_dive_time'] = round(total_dive_minutes / 60, 1)  # Convert to hours
    else:
        stats = {
            'total_dives': 0,
            'max_depth': 0,
            'longest_dive': 0,
            'total_dive_time': 0
        }
    
    # Get unique dive locations for filter dropdown
    locations = db.session.query(Dive.location).filter_by(user_id=user_id).distinct().all()
    locations = [location[0] for location in locations]
    
    return render_template('my_logs.html', title='My Dive Logs', dives=dives, 
                          stats=stats, locations=locations, success_message=success_message) 