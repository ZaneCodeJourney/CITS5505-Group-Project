# Main routes
from flask import render_template, current_app, request
from app.main import bp
from app.models import Dive, User
from flask_login import current_user, login_required
from sqlalchemy import func
from datetime import datetime
from app import db

@bp.route('/')
@bp.route('/index')
def index():
    return render_template('index.html', title='Home')

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