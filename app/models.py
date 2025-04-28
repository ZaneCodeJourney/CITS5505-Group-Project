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
    username = db.Column(db.String(20), unique=True, nullable=False)
    firstname = db.Column(db.String(50))
    lastname = db.Column(db.String(50))
    email = db.Column(db.String(120), unique=True, nullable=False)
    bio = db.Column(db.Text)
    dob = db.Column(db.Date)
    password_hash = db.Column(db.String(128), nullable=False)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    avatar = db.Column(db.String(255))
    status = db.Column(db.String(20), default='active')
    
    # Relationships
    dives = db.relationship('Dive', backref='diver', lazy='dynamic')
    reviews = db.relationship('Review', backref='reviewer', lazy='dynamic')
    shared_dives = db.relationship('Share', backref='creator', 
                                  foreign_keys='Share.creator_user_id', lazy='dynamic')
    
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
    
    # Relationships
    shares = db.relationship('Share', backref='dive', lazy='dynamic')
    
    def __repr__(self):
        return f"<Dive #{self.dive_number} by User {self.user_id}>"


class Site(db.Model):
    __tablename__ = 'sites'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    lat = db.Column(db.Float(8, 6))
    lng = db.Column(db.Float(9, 6))
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
    
    def __repr__(self):
        return f"<Site {self.name}>"


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