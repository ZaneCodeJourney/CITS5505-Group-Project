#!/usr/bin/env python
import os
import sys
import random
import string
import uuid
from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import Flask app, db and models
from app import create_app, db
from app.models import User, Dive, Site, Review, Share, SharkWarning

app = create_app()

def random_date(start, end):
    """Generate a random datetime between start and end"""
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start + timedelta(seconds=random_second)

def generate_token():
    """Generate a random token for sharing"""
    return str(uuid.uuid4())

def create_sample_data():
    """Create sample data for the diving application"""
    with app.app_context():
        # Check if data already exists
        if User.query.count() > 0:
            print("Database already contains data. Exiting to avoid duplicates.")
            return

        print("Creating sample data...")
        
        # Create sample users
        users = [
            {'username': 'johndoe', 'firstname': 'John', 'lastname': 'Doe', 
             'email': 'john@example.com', 'bio': 'Experienced diver with over 200 dives.',
             'dob': date(1985, 5, 12), 'password': 'password123'},
            {'username': 'janediver', 'firstname': 'Jane', 'lastname': 'Smith', 
             'email': 'jane@example.com', 'bio': 'Marine biologist and passionate diver.',
             'dob': date(1990, 8, 23), 'password': 'password123'},
            {'username': 'mikeocean', 'firstname': 'Mike', 'lastname': 'Ocean', 
             'email': 'mike@example.com', 'bio': 'Diving instructor and underwater photographer.',
             'dob': date(1982, 3, 15), 'password': 'password123'},
        ]
        
        created_users = []
        for user_data in users:
            user = User(
                username=user_data['username'],
                firstname=user_data['firstname'],
                lastname=user_data['lastname'],
                email=user_data['email'],
                bio=user_data['bio'],
                dob=user_data['dob'],
                password_hash=generate_password_hash(user_data['password']),
                registration_date=datetime.utcnow(),
                avatar=f"avatar_{random.randint(1, 5)}.jpg",
                status='active'
            )
            db.session.add(user)
            created_users.append(user)
        
        db.session.commit()
        print(f"Created {len(created_users)} users")
        
        # Create sample dive sites
        sites = [
            {'name': 'Great Barrier Reef', 
             'description': 'The world\'s largest coral reef system, composed of over 2,900 individual reefs and 900 islands.',
             'lat': -18.286130, 'lng': 147.700050, 'country': 'Australia', 'region': 'Queensland',
             'avg_visibility': 'Excellent (15-30m)', 'avg_depth': 25.0, 'difficulty': 'Intermediate',
             'best_season': 'June to October', 'thumbnail_url': 'great_barrier_reef.jpg'},
            {'name': 'Blue Hole', 
             'description': 'A giant marine sinkhole off the coast of Belize, famous for its clear waters and abundance of marine life.',
             'lat': 17.316030, 'lng': -87.535090, 'country': 'Belize', 'region': 'Lighthouse Reef',
             'avg_visibility': 'Excellent (30m+)', 'avg_depth': 40.0, 'difficulty': 'Advanced',
             'best_season': 'April to June', 'thumbnail_url': 'blue_hole.jpg'},
            {'name': 'Manta Ray Night Dive', 
             'description': 'Famous night dive spot where manta rays come to feed on plankton attracted by lights.',
             'lat': 19.733940, 'lng': -156.057410, 'country': 'United States', 'region': 'Hawaii, Big Island',
             'avg_visibility': 'Good (10-15m)', 'avg_depth': 15.0, 'difficulty': 'Intermediate',
             'best_season': 'Year-round', 'thumbnail_url': 'manta_ray.jpg'},
            {'name': 'Rottnest Island', 
             'description': 'Beautiful dive sites around this island off the coast of Perth, with limestone reefs and abundant fish life.',
             'lat': -32.006111, 'lng': 115.513889, 'country': 'Australia', 'region': 'Western Australia',
             'avg_visibility': 'Good (10-20m)', 'avg_depth': 18.0, 'difficulty': 'Beginner to Intermediate',
             'best_season': 'March to May', 'thumbnail_url': 'rottnest.jpg'},
            {'name': 'Ningaloo Reef', 
             'description': 'One of the longest fringing reefs in the world, home to whale sharks and diverse marine life.',
             'lat': -22.566667, 'lng': 113.816667, 'country': 'Australia', 'region': 'Western Australia',
             'avg_visibility': 'Excellent (15-25m)', 'avg_depth': 20.0, 'difficulty': 'Beginner to Advanced',
             'best_season': 'March to August', 'thumbnail_url': 'ningaloo.jpg'},
        ]
        
        created_sites = []
        for site_data in sites:
            site = Site(
                name=site_data['name'],
                description=site_data['description'],
                lat=site_data['lat'],
                lng=site_data['lng'],
                country=site_data['country'],
                region=site_data['region'],
                avg_visibility=site_data['avg_visibility'],
                avg_depth=site_data['avg_depth'],
                difficulty=site_data['difficulty'],
                best_season=site_data['best_season'],
                thumbnail_url=site_data['thumbnail_url'],
                created_at=datetime.utcnow()
            )
            db.session.add(site)
            created_sites.append(site)
        
        db.session.commit()
        print(f"Created {len(created_sites)} dive sites")
        
        # Create sample dives
        dive_count = 0
        for user in created_users:
            # Each user gets 3-7 dives
            num_dives = random.randint(3, 7)
            for i in range(num_dives):
                start_time = random_date(datetime(2023, 1, 1), datetime(2023, 6, 1))
                end_time = start_time + timedelta(minutes=random.randint(30, 90))
                
                # Reference location name from one of our sites
                location = random.choice(created_sites).name
                
                dive = Dive(
                    user_id=user.id,
                    dive_number=i + 1,
                    start_time=start_time,
                    end_time=end_time,
                    max_depth=random.uniform(10.0, 40.0),
                    weight_belt=f"{random.randint(4, 16)} kg",
                    visibility=random.choice(['Excellent', 'Good', 'Fair', 'Poor']),
                    weather=random.choice(['Sunny', 'Cloudy', 'Partly Cloudy', 'Light Rain']),
                    location=location,
                    dive_partner=random.choice([None, 'Dive buddy', 'Guided group', 'Solo (technical)']),
                    notes=f"Dive #{i+1} at {location}. " + random.choice([
                        "Saw many colorful fish and coral formations.",
                        "Encountered a sea turtle and some reef sharks.",
                        "Great visibility today, could see for at least 20 meters.",
                        "Water was a bit cold, but the marine life was amazing.",
                        "Strong currents made this dive challenging but rewarding."
                    ]),
                    media=f"dive_{random.randint(1, 10)}.jpg" if random.random() > 0.3 else None,
                    location_thumbnail=f"location_{random.randint(1, 5)}.jpg",
                    created_at=datetime.utcnow()
                )
                db.session.add(dive)
                dive_count += 1
        
        db.session.commit()
        print(f"Created {dive_count} dives")
        
        # Create sample reviews
        review_count = 0
        for user in created_users:
            # Each user reviews 1-3 sites
            num_reviews = random.randint(1, 3)
            sites_to_review = random.sample(created_sites, min(num_reviews, len(created_sites)))
            
            for site in sites_to_review:
                review = Review(
                    site_id=site.id,
                    user_id=user.id,
                    rating=random.randint(3, 5),  # Mostly positive reviews (3-5 stars)
                    comment=random.choice([
                        f"Great dive at {site.name}! The visibility was excellent and we saw many species.",
                        f"Beautiful coral formations at {site.name}. Highly recommended for all levels.",
                        f"{site.name} is a must-visit site. The marine life is incredible and diverse.",
                        f"Enjoyed my dive at {site.name}. Good conditions but can be crowded at peak times.",
                        f"Amazing experience at {site.name}. The underwater landscape is breathtaking."
                    ]),
                    created_at=random_date(datetime(2023, 1, 1), datetime(2023, 6, 1))
                )
                db.session.add(review)
                review_count += 1
        
        db.session.commit()
        print(f"Created {review_count} reviews")
        
        # Create sample shares (some users sharing their dives)
        share_count = 0
        all_dives = Dive.query.all()
        dives_to_share = random.sample(all_dives, min(5, len(all_dives)))
        
        for dive in dives_to_share:
            # Get the user who owns this dive
            user = User.query.get(dive.user_id)
            
            share = Share(
                dive_id=dive.id,
                creator_user_id=user.id,
                token=generate_token(),
                visibility=random.choice(['user_specific', 'public']),
                expiration_time=datetime.utcnow() + timedelta(days=random.randint(7, 30)),
                created_at=datetime.utcnow()
            )
            db.session.add(share)
            share_count += 1
        
        db.session.commit()
        print(f"Created {share_count} shared dives")
        
        # Create sample shark warnings
        warning_count = 0
        # Only create warnings for 2 random sites
        sites_with_warnings = random.sample(created_sites, 2)
        
        for site in sites_with_warnings:
            # Add 1-2 warnings per selected site
            num_warnings = random.randint(1, 2)
            for _ in range(num_warnings):
                # Random user reports the shark
                user = random.choice(created_users)
                
                warning = SharkWarning(
                    site_id=site.id,
                    user_id=user.id,
                    species=random.choice(['Great White Shark', 'Tiger Shark', 'Bull Shark', 'Hammerhead Shark', 'Reef Shark']),
                    size_estimate=f"{random.randint(2, 5)} meters",
                    description=random.choice([
                        "Spotted during a morning dive, appeared calm and non-threatening.",
                        "Swam close to our group but showed no aggressive behavior.",
                        "Large shark circling the reef area, recommend caution.",
                        "Several sharks in the area feeding on schools of fish.",
                        "Shark sighting reported by multiple divers in this location."
                    ]),
                    sighting_time=random_date(datetime(2023, 5, 1), datetime(2023, 6, 1)),
                    severity=random.choice(['low', 'medium', 'high']),
                    status='active',
                    photo=f"shark_{random.randint(1, 3)}.jpg" if random.random() > 0.5 else None,
                    created_at=datetime.utcnow()
                )
                db.session.add(warning)
                warning_count += 1
        
        db.session.commit()
        print(f"Created {warning_count} shark warnings")
        
        print("Sample data creation complete!")

if __name__ == '__main__':
    create_sample_data() 