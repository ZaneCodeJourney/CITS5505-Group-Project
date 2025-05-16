# Main routes
from flask import render_template, current_app, request, abort, redirect, url_for, jsonify
from app.main import bp
from app.models import Dive, User, Share
from flask_login import current_user, login_required
from sqlalchemy import func
from datetime import datetime
from app import db
import re

@bp.route('/')
@bp.route('/index')
def index():
    return render_template('index.html', title='Home')

@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', title='Dashboard')

@bp.route('/new-log')
@login_required
def new_log():
    return render_template('new_log.html', title='Add New Dive Log')

@bp.route('/my-logs')
@login_required
def my_logs():
    # Use the current authenticated user's ID
    user_id = current_user.id
    
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
                          locations=locations, success_message=success_message)

@bp.route('/diving-stats')
@login_required
def diving_stats():
    # Use the current authenticated user's ID
    user_id = current_user.id
    
    # Get all dives for this user ordered by date
    all_dives = Dive.query.filter_by(user_id=user_id).order_by(Dive.start_time.asc()).all()
    
    # Calculate diving statistics
    stats = {}
    
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
        
    # Prepare data for charts
    dive_data = {
        'dates': [],
        'depths': [],
        'durations': [],
        'locations': [],
        'dives_per_location': [],
        'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'dives_per_month': [0] * 12,
        'coordinates': [],  # For heatmap
        'location_names': [],  # Names for markers
        'dives_count': []  # Count of dives per location for markers
    }
    
    if all_dives:
        # Process data for time-series charts
        for dive in all_dives:
            # Format date for chart
            if dive.start_time:
                formatted_date = dive.start_time.strftime('%d %b %Y')
                dive_data['dates'].append(formatted_date)
                dive_data['depths'].append(dive.max_depth)
                
                # Calculate duration
                if dive.end_time:
                    duration = (dive.end_time - dive.start_time).total_seconds() / 60
                    dive_data['durations'].append(round(duration))
                else:
                    dive_data['durations'].append(0)
                
                # Count dives per month
                month_idx = dive.start_time.month - 1  # 0-based index
                dive_data['dives_per_month'][month_idx] += 1
        
        # Process data for location chart and map
        location_counts = {}
        location_coordinates = {}  # Store coordinates for each location
        
        for dive in all_dives:
            if dive.location:
                # Extract coordinates from location string if available
                # Common format: "Location Name (lat, lng)"
                coords_match = re.search(r'\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)', dive.location)
                
                if coords_match:
                    try:
                        lat = float(coords_match.group(1))
                        lng = float(coords_match.group(2))
                        
                        # Extract the location name (everything before the coordinates)
                        location_name = dive.location.split('(')[0].strip()
                        
                        # Count dives per location
                        if location_name in location_counts:
                            location_counts[location_name] += 1
                        else:
                            location_counts[location_name] = 1
                            location_coordinates[location_name] = (lat, lng)
                    except ValueError:
                        # If conversion fails, just use the full location name
                        if dive.location in location_counts:
                            location_counts[dive.location] += 1
                        else:
                            location_counts[dive.location] = 1
                else:
                    # No coordinates in string, just use the full location
                    if dive.location in location_counts:
                        location_counts[dive.location] += 1
                    else:
                        location_counts[dive.location] = 1
        
        # Sort locations by number of dives (descending)
        sorted_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Take top 8 locations max to avoid crowding the chart
        for loc, count in sorted_locations[:8]:
            dive_data['locations'].append(loc)
            dive_data['dives_per_location'].append(count)
        
        # Prepare data for the map
        for loc, coords in location_coordinates.items():
            dive_data['coordinates'].append([coords[0], coords[1]])
            dive_data['location_names'].append(loc)
            dive_data['dives_count'].append(location_counts[loc])
    
    return render_template('stats.html', title='Diving Statistics', stats=stats, dive_data=dive_data)

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

@bp.route('/test-coordinates')
def test_coordinates():
    """Test route to verify coordinate extraction logic"""
    # Test location strings
    test_locations = [
        "Great Barrier Reef (-16.6818, 145.9919)",
        "Tubbataha Reef (-16.6818,145.9919)",
        "Blue Hole, Belize (17.3164, -87.5339)",
        "Raja Ampat",
        "Maldives (3.2028, 73.2207)",
        "Sipadan Island (4.1148, 118.6289)"
    ]
    
    results = []
    
    for location in test_locations:
        coords_match = re.search(r'\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)', location)
        result = {'location': location, 'has_coords': False}
        
        if coords_match:
            try:
                lat = float(coords_match.group(1))
                lng = float(coords_match.group(2))
                location_name = location.split('(')[0].strip()
                
                result['has_coords'] = True
                result['lat'] = lat
                result['lng'] = lng
                result['name'] = location_name
            except ValueError:
                pass
        
        results.append(result)
    
    return jsonify(results) 