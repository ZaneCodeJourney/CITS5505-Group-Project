from flask import jsonify, request
from flask_login import login_required, current_user
from app import db
from app.api import bp
from app.models import User, Dive
from datetime import datetime
from functools import wraps
from sqlalchemy import func, extract
import calendar
import traceback

# User statistics endpoint
@bp.route('/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    try:
        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get user's dives
        dives = Dive.query.filter_by(user_id=user_id).all()
        
        # Calculate statistics
        total_dives = len(dives)
        
        if total_dives == 0:
            return jsonify({
                "total_dives": 0,
                "total_dive_time_minutes": 0,
                "average_dive_time_minutes": 0,
                "max_depth": 0,
                "average_depth": 0,
                "most_recent_dive": None
            }), 200
        
        total_dive_time = sum((dive.end_time - dive.start_time).total_seconds() / 60 for dive in dives)
        average_dive_time = total_dive_time / total_dives
        
        max_depth = max(dive.max_depth for dive in dives)
        average_depth = sum(dive.max_depth for dive in dives) / total_dives
        
        # Get the most recent dive
        most_recent_dive = max(dives, key=lambda dive: dive.start_time)
        most_recent_dive_data = {
            "id": most_recent_dive.id,
            "date": most_recent_dive.start_time.strftime('%Y-%m-%d'),
            "location": most_recent_dive.location,
            "max_depth": most_recent_dive.max_depth,
            "dive_time_minutes": round((most_recent_dive.end_time - most_recent_dive.start_time).total_seconds() / 60, 2)
        }
        
        return jsonify({
            "total_dives": total_dives,
            "total_dive_time_minutes": round(total_dive_time, 2),
            "average_dive_time_minutes": round(average_dive_time, 2),
            "max_depth": max_depth,
            "average_depth": round(average_depth, 2),
            "most_recent_dive": most_recent_dive_data
        }), 200
    except Exception as e:
        print(f"Error in get_user_stats: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# Depth-time chart data endpoint
@bp.route('/users/<int:user_id>/depth-time-chart', methods=['GET'])
def get_depth_time_chart(user_id):
    try:
        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get user's dives, ordered by start_time
        dives = Dive.query.filter_by(user_id=user_id).order_by(Dive.start_time).all()
        
        if not dives:
            return jsonify({"data": []}), 200
        
        chart_data = []
        for dive in dives:
            dive_time_minutes = (dive.end_time - dive.start_time).total_seconds() / 60
            
            chart_data.append({
                "dive_id": dive.id,
                "dive_number": dive.dive_number,
                "date": dive.start_time.strftime('%Y-%m-%d'),
                "location": dive.location,
                "max_depth": dive.max_depth,
                "dive_time_minutes": round(dive_time_minutes, 2)
            })
        
        return jsonify({"data": chart_data}), 200
    except Exception as e:
        print(f"Error in get_depth_time_chart: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# Frequency chart data endpoint
@bp.route('/users/<int:user_id>/frequency-chart', methods=['GET'])
def get_frequency_chart(user_id):
    try:
        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get period and year from query parameters (default to monthly and current year)
        period = request.args.get('period', 'monthly')
        year = request.args.get('year', datetime.now().year)
        
        try:
            year = int(year)
        except ValueError:
            return jsonify({"error": "Year must be a valid integer"}), 400
        
        if period not in ['monthly', 'weekly', 'daily']:
            return jsonify({"error": "Period must be one of: monthly, weekly, daily"}), 400
        
        # Monthly frequency
        if period == 'monthly':
            # Query database to count dives by month for the specified year
            monthly_counts = db.session.query(
                extract('month', Dive.start_time).label('month'),
                func.count(Dive.id).label('count')
            ).filter(
                Dive.user_id == user_id,
                extract('year', Dive.start_time) == year
            ).group_by(
                extract('month', Dive.start_time)
            ).all()
            
            # Initialize all months with zero counts
            result = {month: 0 for month in range(1, 13)}
            
            # Update with actual counts
            for month, count in monthly_counts:
                result[int(month)] = count
            
            # Format response with month names
            formatted_result = [
                {"month": calendar.month_name[month], "count": count} 
                for month, count in result.items()
            ]
            
            return jsonify({
                "period": "monthly",
                "year": year,
                "data": formatted_result
            }), 200
        
        # Weekly or daily frequency would be implemented similarly
        # For now, return a placeholder for these options
        return jsonify({
            "period": period,
            "year": year,
            "error": f"{period} period not yet implemented"
        }), 501
    except Exception as e:
        print(f"Error in get_frequency_chart: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500 