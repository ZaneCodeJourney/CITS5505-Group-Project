from flask import request, jsonify, current_app
from flask_login import login_required, current_user
from app import db
from app.models import DiveSpecies, Dive
import requests
from flask import Blueprint

species_api = Blueprint('species', __name__)

# Helper: iNaturalist API search function
def inat_search(q, n=10, locale="en"):
    url = "https://api.inaturalist.org/v1/taxa"
    try:
        r = requests.get(url, params={"q": q, "rank": "species",
                                    "per_page": n, "locale": locale}, timeout=10)
        r.raise_for_status()
        results = []
        for t in r.json()["results"]:
            results.append({
                "taxon_id": t["id"],
                "scientific_name": t["name"],
                "common_name": t.get("preferred_common_name"),
                "rank": t["rank"],
            })
        return results
    except Exception as e:
        current_app.logger.error(f"Error searching iNaturalist API: {str(e)}", exc_info=True)
        return []

# Search for species on iNaturalist API
@species_api.route('/search', methods=['GET'])
@login_required
def search_species():
    query = request.args.get('q', '')
    limit = request.args.get('limit', 10, type=int)
    locale = request.args.get('locale', 'en')
    
    if not query or len(query) < 2:
        return jsonify({"error": "Search query must be at least 2 characters"}), 400
    
    try:
        results = inat_search(query, limit, locale)
        return jsonify(results), 200
    except Exception as e:
        current_app.logger.error(f"Error in species search: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Add a species to a dive log
@species_api.route('/dive/<int:dive_id>/species', methods=['POST'])
@login_required
def add_species_to_dive(dive_id):
    # Check if dive exists and belongs to the current user
    dive = Dive.query.get_or_404(dive_id)
    if dive.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No input data provided"}), 400
        
        # Create new species entry
        species = DiveSpecies(
            dive_id=dive_id,
            taxon_id=data['taxon_id'],
            scientific_name=data['scientific_name'],
            common_name=data.get('common_name'),
            rank=data.get('rank'),
            notes=data.get('notes')
        )
        
        db.session.add(species)
        db.session.commit()
        
        return jsonify(species.to_dict()), 201
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e.args[0]}"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding species to dive {dive_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Get all species for a dive
@species_api.route('/dive/<int:dive_id>/species', methods=['GET'])
@login_required
def get_dive_species(dive_id):
    # Check if dive exists and belongs to the current user
    dive = Dive.query.get_or_404(dive_id)
    if dive.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        species = DiveSpecies.query.filter_by(dive_id=dive_id).all()
        return jsonify([s.to_dict() for s in species]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching species for dive {dive_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Delete a species from a dive
@species_api.route('/dive/<int:dive_id>/species/<int:species_id>', methods=['DELETE'])
@login_required
def delete_dive_species(dive_id, species_id):
    # Check if dive exists and belongs to the current user
    dive = Dive.query.get_or_404(dive_id)
    if dive.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        species = DiveSpecies.query.get_or_404(species_id)
        if species.dive_id != dive_id:
            return jsonify({"error": "Species not found in this dive"}), 404
        
        db.session.delete(species)
        db.session.commit()
        
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting species {species_id} from dive {dive_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500 