# Main routes
from flask import render_template, current_app, request, abort, redirect, url_for
from app.main import bp
from app.models import Dive, User, Share
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
    
    # Order by date (newest first)
    dives = query.order_by(Dive.start_time.desc()).all()
    
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

@bp.route('/dive/<int:dive_id>')
def dive_details(dive_id):
    # For testing, set user_id to 1
    user_id = 1
    
    # Get the dive
    dive = Dive.query.get_or_404(dive_id)
    
    # Check access permissions
    if dive.user_id != user_id and not current_user.is_authenticated:
        abort(403)  # Forbidden
    
    # Get dive owner information
    dive_owner = User.query.get(dive.user_id)
    
    # Get existing shares for the dive
    shares = Share.query.filter_by(dive_id=dive_id).all()
    
    return render_template('dive_details.html', 
                          title=f'Dive at {dive.location}', 
                          dive=dive, 
                          owner=dive_owner,
                          shares=shares)

@bp.route('/shared/dive/<string:token>')
def shared_dive(token):
    # Get the share by token
    share = Share.query.filter_by(token=token).first_or_404()
    
    # Check if share is expired
    if share.expiration_time and datetime.utcnow() > share.expiration_time:
        return render_template('errors/410.html', 
                             message="This shared dive link has expired."), 410
    
    # Get the dive
    dive = Dive.query.get_or_404(share.dive_id)
    
    # Get dive owner information
    dive_owner = User.query.get(dive.user_id)
    
    # Render the shared dive template
    return render_template('dive_details.html', 
                          title=f'Shared Dive at {dive.location}', 
                          dive=dive, 
                          owner=dive_owner,
                          is_shared=True,
                          share=share) 