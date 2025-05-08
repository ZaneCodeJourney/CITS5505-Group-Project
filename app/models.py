from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db, login_manager


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    firstname = db.Column(db.String(64))
    lastname = db.Column(db.String(64))
    date_of_birth = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    bio = db.Column(db.Text)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    avatar = db.Column(db.String(255))
    status = db.Column(db.String(20), default='active')
    
    # Relationships
    dives = db.relationship('Dive', backref='diver', lazy='dynamic')
    reviews = db.relationship('Review', backref='reviewer', lazy='dynamic')
    shared_dives = db.relationship('Share', backref='creator', 
                                  foreign_keys='Share.creator_user_id', lazy='dynamic')
    shark_warnings = db.relationship('SharkWarning', backref='reporter', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f"<User {self.username}>"


class Dive(db.Model):
    __tablename__ = 'dives'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    dive_number = db.Column(db.Integer)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    max_depth = db.Column(db.Float(5, 2), nullable=False)
    weight_belt = db.Column(db.String(50))
    visibility = db.Column(db.String(50))
    weather = db.Column(db.String(100))
    location = db.Column(db.String(255), nullable=False)
    dive_partner = db.Column(db.String(255))
    notes = db.Column(db.Text)
    media = db.Column(db.String(255))
    location_thumbnail = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'))

    # Equipment fields
    suit_type = db.Column(db.String(20))        # None, Shorty, Wetsuit, Semi-Dry, Drysuit
    suit_thickness = db.Column(db.Float)        # in mm, 0.0–10.0
    weight = db.Column(db.Float)                # in kg, 0.0–20.0
    tank_type = db.Column(db.String(20))        # Aluminum, Steel
    tank_size = db.Column(db.Float)             # in liters, 0.0–20.0
    gas_mix = db.Column(db.String(20))          # Air, Nitrox, Trimix, Heliox
    o2_percentage = db.Column(db.Float)         # only for Nitrox, 21–100%

    # Relationships
    shares = db.relationship('Share', backref='dive', lazy='dynamic')
    
    def __repr__(self):
        return f"<Dive #{self.dive_number} by User {self.user_id}>"

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'dive_number': self.dive_number,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'max_depth': self.max_depth,
            'weight_belt': self.weight_belt,
            'visibility': self.visibility,
            'weather': self.weather,
            'location': self.location,
            'dive_partner': self.dive_partner,
            'notes': self.notes,
            'media': self.media,
            'location_thumbnail': self.location_thumbnail,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'suit_type': self.suit_type,
            'suit_thickness': self.suit_thickness,
            'weight': self.weight,
            'tank_type': self.tank_type,
            'tank_size': self.tank_size,
            'gas_mix': self.gas_mix,
            'o2_percentage': self.o2_percentage,
        }


class Site(db.Model):
    __tablename__ = 'sites'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(100))
    latitude = db.Column(db.Float(8, 6))
    longitude = db.Column(db.Float(9, 6))
    country = db.Column(db.String(100))
    region = db.Column(db.String(100))
    avg_visibility = db.Column(db.String(50))
    avg_depth = db.Column(db.Float(5, 2))
    difficulty = db.Column(db.String(50))
    best_season = db.Column(db.String(100))
    thumbnail_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    reviews = db.relationship('Review', backref='site', lazy='dynamic')
    shark_warnings = db.relationship('SharkWarning', backref='site', lazy='dynamic')
    dives = db.relationship('Dive', backref='site', lazy='dynamic')
    
    def __repr__(self):
        return f"<Site {self.name}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'country': self.country,
            'region': self.region,
            'avg_visibility': self.avg_visibility,
            'avg_depth': self.avg_depth,
            'difficulty': self.difficulty,
            'best_season': self.best_season,
            'thumbnail_url': self.thumbnail_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Review {self.id} by User {self.user_id} for Site {self.site_id}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'site_id': self.site_id,
            'user_id': self.user_id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Share(db.Model):
    __tablename__ = 'shares'
    
    id = db.Column(db.Integer, primary_key=True)
    dive_id = db.Column(db.Integer, db.ForeignKey('dives.id'), nullable=False)
    creator_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    visibility = db.Column(db.String(20), default='user_specific')
    expiration_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Share {self.id} of Dive {self.dive_id} by User {self.creator_user_id}>"


class SharkWarning(db.Model):
    __tablename__ = 'shark_warnings'
    
    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    species = db.Column(db.String(100))
    size_estimate = db.Column(db.String(50))
    description = db.Column(db.Text, nullable=False)
    sighting_time = db.Column(db.DateTime, nullable=False)
    report_time = db.Column(db.DateTime, default=datetime.utcnow)
    severity = db.Column(db.String(20), default='medium')  # low, medium, high
    status = db.Column(db.String(20), default='active')  # active, resolved, expired
    photo_url = db.Column(db.String(255))
    
    def __repr__(self):
        return f"<SharkWarning {self.id} at Site {self.site_id}>"
        
    def to_dict(self):
        return {
            'id': self.id,
            'site_id': self.site_id,
            'reporter_id': self.reporter_id,
            'species': self.species,
            'size_estimate': self.size_estimate,
            'description': self.description,
            'sighting_time': self.sighting_time.isoformat() if self.sighting_time else None,
            'report_time': self.report_time.isoformat() if self.report_time else None,
            'severity': self.severity,
            'status': self.status,
            'photo_url': self.photo_url
        } 