# routes.py for Dive Sites
from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required
from app import db
from app.sites import bp
from app.models import Site, Review
from datetime import datetime

# GET all dive sites
@bp.route('/', methods=['GET'])
def get_sites():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    search = request.args.get('search', '', type=str)

    query = Site.query
    if search:
        query = query.filter(Site.name.ilike(f'%{search}%'))

    sites = query.paginate(page=page, per_page=limit, error_out=False).items
    return jsonify([site.to_dict() for site in sites]), 200

# POST a new dive site
@bp.route('/', methods=['POST'])
def create_site():
    data = request.get_json()
    site = Site(
        name=data.get('name'),
        description=data.get('description'),
        lat=data.get('lat'),
        lng=data.get('lng'),
        country=data.get('country'),
        region=data.get('region'),
        avg_visibility=data.get('avg_visibility'),
        avg_depth=data.get('avg_depth'),
        difficulty=data.get('difficulty'),
        best_season=data.get('best_season'),
        thumbnail_url=data.get('thumbnail_url')
    )
    db.session.add(site)
    db.session.commit()
    return jsonify({'id': site.id}), 201

# GET one specific dive site
@bp.route('/<int:site_id>', methods=['GET'])
def get_site(site_id):
    site = Site.query.get_or_404(site_id)
    return jsonify(site.to_dict()), 200

# PUT (update) dive site
@bp.route('/<int:site_id>', methods=['PUT'])
def update_site(site_id):
    site = Site.query.get_or_404(site_id)
    data = request.get_json()

    site.name = data.get('name', site.name)
    site.description = data.get('description', site.description)
    site.lat = data.get('lat', site.lat)
    site.lng = data.get('lng', site.lng)
    site.country = data.get('country', site.country)
    site.region = data.get('region', site.region)
    site.avg_visibility = data.get('avg_visibility', site.avg_visibility)
    site.avg_depth = data.get('avg_depth', site.avg_depth)
    site.difficulty = data.get('difficulty', site.difficulty)
    site.best_season = data.get('best_season', site.best_season)
    site.thumbnail_url = data.get('thumbnail_url', site.thumbnail_url)

    db.session.commit()
    return jsonify({'id': site.id}), 200

# DELETE dive site
@bp.route('/<int:site_id>', methods=['DELETE'])
def delete_site(site_id):
    site = Site.query.get_or_404(site_id)
    db.session.delete(site)
    db.session.commit()
    return '', 204

# GET reviews for a dive site
@bp.route('/<int:site_id>/reviews', methods=['GET'])
def get_reviews(site_id):
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    reviews = Review.query.filter_by(site_id=site_id).paginate(page=page, per_page=limit, error_out=False).items
    return jsonify([review.to_dict() for review in reviews]), 200

# POST a review for a dive site
@bp.route('/<int:site_id>/reviews', methods=['POST'])
def create_review(site_id):
    data = request.get_json()
    review = Review(
        site_id=site_id,
        user_id=data.get('user_id'),
        rating=data.get('rating'),
        comment=data.get('comment')
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({'id': review.id}), 201

# PUT (update) review for a site
@bp.route('/<int:site_id>/reviews/<int:review_id>', methods=['PUT'])
def update_review(site_id, review_id):
    review = Review.query.filter_by(id=review_id, site_id=site_id).first_or_404()
    data = request.get_json()
    review.rating = data.get('rating', review.rating)
    review.comment = data.get('comment', review.comment)
    db.session.commit()
    return jsonify({'id': review.id}), 200

# DELETE a review from a site
@bp.route('/<int:site_id>/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(site_id, review_id):
    review = Review.query.filter_by(id=review_id, site_id=site_id).first_or_404()
    db.session.delete(review)
    db.session.commit()
    return '', 204

@bp.route('/')
@login_required
def sites_list():
    return render_template('sites/sites_list.html', title='Dive Sites')
