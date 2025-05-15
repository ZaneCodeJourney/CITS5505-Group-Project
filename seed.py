#!/usr/bin/env python
import os
import sys
import random
import string
import uuid
import csv
import io
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

def generate_dive_profile_csv():
    """Generate sample dive profile CSV data"""
    # Create a string IO object to write CSV data
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Time (min)', 'Depth (m)', 'Temperature (°C)'])
    
    # Generate a realistic dive profile
    # Descent phase (0-5 minutes)
    max_depth = random.uniform(15.0, 35.0)
    temperature = random.uniform(18.0, 26.0)
    
    for minute in range(0, 6):
        depth = (minute / 5) * max_depth
        writer.writerow([minute, round(depth, 1), round(temperature - (depth * 0.05), 1)])
    
    # Bottom time (5-25 minutes)
    bottom_time = random.randint(15, 20)
    for minute in range(6, 6 + bottom_time):
        # Add some variance to the depth
        depth_variance = random.uniform(-2.0, 2.0)
        depth = max(1.0, max_depth + depth_variance)
        writer.writerow([minute, round(depth, 1), round(temperature - (depth * 0.05), 1)])
    
    # Ascent phase (remaining time)
    ascent_minutes = 10
    for i, minute in enumerate(range(6 + bottom_time, 6 + bottom_time + ascent_minutes)):
        depth = max_depth * (1 - (i / ascent_minutes))
        writer.writerow([minute, round(depth, 1), round(temperature - (depth * 0.05), 1)])
    
    # Safety stop (if depth was more than 10m)
    if max_depth > 10:
        safety_minutes = 3
        for minute in range(6 + bottom_time + ascent_minutes, 6 + bottom_time + ascent_minutes + safety_minutes):
            writer.writerow([minute, 5.0, round(temperature - 0.25, 1)])
    
    # Final ascent
    final_ascent = 2
    for i, minute in enumerate(range(6 + bottom_time + ascent_minutes + (safety_minutes if max_depth > 10 else 0), 
                                 6 + bottom_time + ascent_minutes + (safety_minutes if max_depth > 10 else 0) + final_ascent)):
        depth = 5.0 * (1 - (i / final_ascent))
        writer.writerow([minute, round(depth, 1), round(temperature - (depth * 0.05), 1)])
    
    return output.getvalue()

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
             'dob': date(1985, 5, 12), 'password': 'Password123!'},
            {'username': 'janediver', 'firstname': 'Jane', 'lastname': 'Smith', 
             'email': 'jane@example.com', 'bio': 'Marine biologist and passionate diver.',
             'dob': date(1990, 8, 23), 'password': 'Password123!'},
            {'username': 'mikeocean', 'firstname': 'Mike', 'lastname': 'Ocean', 
             'email': 'mike@example.com', 'bio': 'Diving instructor and underwater photographer.',
             'dob': date(1982, 3, 15), 'password': 'Password123!'},
            {'username': 'sarahsea', 'firstname': 'Sarah', 'lastname': 'Sea', 
             'email': 'sarah@example.com', 'bio': 'Scuba diving enthusiast and travel blogger.',
             'dob': date(1988, 10, 5), 'password': 'Password123!'},
            {'username': 'demo', 'firstname': 'Demo', 'lastname': 'User', 
             'email': 'demo@example.com', 'bio': 'This is a demo account for presentation purposes.',
             'dob': date(1995, 1, 1), 'password': 'Password123!'},
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
            {'name': 'HMAS Swan Wreck', 
             'description': 'A decommissioned naval destroyer sunk as an artificial reef, now home to a variety of marine life.',
             'lat': -33.604167, 'lng': 115.063611, 'country': 'Australia', 'region': 'Western Australia',
             'avg_visibility': 'Good (10-15m)', 'avg_depth': 30.0, 'difficulty': 'Intermediate',
             'best_season': 'November to May', 'thumbnail_url': 'swan_wreck.jpg'},
            {'name': 'Busselton Jetty', 
             'description': 'The longest wooden jetty in the Southern Hemisphere, offering a unique diving experience with abundant marine life.',
             'lat': -33.630000, 'lng': 115.338889, 'country': 'Australia', 'region': 'Western Australia',
             'avg_visibility': 'Moderate (5-10m)', 'avg_depth': 8.0, 'difficulty': 'Beginner',
             'best_season': 'December to April', 'thumbnail_url': 'busselton_jetty.jpg'},
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
        
        # Add more detailed dives for the demo user
        demo_user = User.query.filter_by(username='demo').first()
        
        # Recent dives for demo user (for presentation)
        demo_dive_details = [
            {
                'location': 'Rottnest Island',
                'start_time': datetime(2024, 5, 10, 10, 0),
                'end_time': datetime(2024, 5, 10, 11, 15),
                'max_depth': 18.5,
                'visibility': 'Excellent',
                'weather': 'Sunny',
                'notes': 'Amazing dive at Rottnest! Saw numerous fish species and a few rays. Water was crystal clear today.',
                'weight_belt': '10 kg',
                'dive_partner': 'Jane Smith (PADI Divemaster)',
                'suit_type': 'Wetsuit',
                'suit_thickness': 5.0,
                'weight': 10.0,
                'tank_type': 'Aluminum',
                'tank_size': 12.0,
                'gas_mix': 'Air',
                'o2_percentage': 21.0,
                'media': 'rottnest_dive.jpg',
                'has_csv': True
            },
            {
                'location': 'Ningaloo Reef',
                'start_time': datetime(2024, 5, 2, 9, 30),
                'end_time': datetime(2024, 5, 2, 10, 45),
                'max_depth': 22.7,
                'visibility': 'Good',
                'weather': 'Partly Cloudy',
                'notes': 'Encountered a whale shark! Once-in-a-lifetime experience swimming alongside this gentle giant.',
                'weight_belt': '12 kg',
                'dive_partner': 'Guided group',
                'suit_type': 'Wetsuit',
                'suit_thickness': 3.0,
                'weight': 12.0,
                'tank_type': 'Steel',
                'tank_size': 15.0,
                'gas_mix': 'Nitrox',
                'o2_percentage': 32.0,
                'media': 'ningaloo_dive.jpg',
                'has_csv': True
            },
            {
                'location': 'HMAS Swan Wreck',
                'start_time': datetime(2024, 4, 15, 14, 0),
                'end_time': datetime(2024, 4, 15, 15, 10),
                'max_depth': 29.8,
                'visibility': 'Moderate',
                'weather': 'Overcast',
                'notes': 'Explored the HMAS Swan wreck. Fascinating to see how marine life has colonized the ship.',
                'weight_belt': '14 kg',
                'dive_partner': 'Mike Johnson (Buddy)',
                'suit_type': 'Semi-Dry',
                'suit_thickness': 7.0,
                'weight': 14.0,
                'tank_type': 'Steel',
                'tank_size': 15.0,
                'gas_mix': 'Nitrox',
                'o2_percentage': 36.0,
                'media': 'swan_wreck_dive.jpg',
                'has_csv': True
            },
            {
                'location': 'Busselton Jetty',
                'start_time': datetime(2024, 4, 5, 11, 30),
                'end_time': datetime(2024, 4, 5, 12, 15),
                'max_depth': 8.3,
                'visibility': 'Good',
                'weather': 'Sunny',
                'notes': 'Easy shallow dive under the Busselton Jetty. Great for beginners with lots of colorful marine life.',
                'weight_belt': '8 kg',
                'dive_partner': 'Solo (supervised)',
                'suit_type': 'Wetsuit',
                'suit_thickness': 3.0,
                'weight': 8.0,
                'tank_type': 'Aluminum',
                'tank_size': 10.0,
                'gas_mix': 'Air',
                'o2_percentage': 21.0,
                'media': 'busselton_dive.jpg',
                'has_csv': False
            }
        ]
        
        # Add detailed dives for demo user
        for idx, dive_data in enumerate(demo_dive_details):
            csv_data = generate_dive_profile_csv() if dive_data['has_csv'] else None
            
            dive = Dive(
                user_id=demo_user.id,
                dive_number=idx + 1,
                start_time=dive_data['start_time'],
                end_time=dive_data['end_time'],
                max_depth=dive_data['max_depth'],
                weight_belt=dive_data['weight_belt'],
                visibility=dive_data['visibility'],
                weather=dive_data['weather'],
                location=dive_data['location'],
                dive_partner=dive_data['dive_partner'],
                notes=dive_data['notes'],
                media=dive_data['media'],
                location_thumbnail=f"location_{random.randint(1, 5)}.jpg",
                created_at=datetime.utcnow(),
                suit_type=dive_data['suit_type'],
                suit_thickness=dive_data['suit_thickness'],
                weight=dive_data['weight'],
                tank_type=dive_data['tank_type'],
                tank_size=dive_data['tank_size'],
                gas_mix=dive_data['gas_mix'],
                o2_percentage=dive_data['o2_percentage'],
                profile_csv_data=csv_data
            )
            db.session.add(dive)
            dive_count += 1
        
        # Create dives for other users
        for user in created_users:
            if user.username == 'demo':
                continue  # Skip demo user as we already created dives
                
            # Each user gets 3-5 dives
            num_dives = random.randint(3, 5)
            for i in range(num_dives):
                start_time = random_date(datetime(2023, 1, 1), datetime(2024, 5, 1))
                end_time = start_time + timedelta(minutes=random.randint(30, 90))
                
                # Reference location name from one of our sites
                location = random.choice(created_sites).name
                
                # Add CSV data to some dives
                has_csv = random.random() > 0.5
                csv_data = generate_dive_profile_csv() if has_csv else None
                
                # Equipment details
                suit_types = ['None', 'Shorty', 'Wetsuit', 'Semi-Dry', 'Drysuit']
                tank_types = ['Aluminum', 'Steel']
                gas_mixes = ['Air', 'Nitrox', 'Trimix', 'Heliox']
                
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
                    created_at=datetime.utcnow(),
                    # Equipment details
                    suit_type=random.choice(suit_types),
                    suit_thickness=random.uniform(3.0, 7.0) if random.random() > 0.2 else None,
                    weight=random.uniform(6.0, 16.0) if random.random() > 0.2 else None,
                    tank_type=random.choice(tank_types) if random.random() > 0.2 else None,
                    tank_size=random.choice([10.0, 12.0, 15.0]) if random.random() > 0.2 else None,
                    gas_mix=random.choice(gas_mixes) if random.random() > 0.2 else None,
                    o2_percentage=random.uniform(21.0, 40.0) if random.random() > 0.5 else None,
                    profile_csv_data=csv_data
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
                    created_at=random_date(datetime(2023, 1, 1), datetime(2024, 5, 1))
                )
                db.session.add(review)
                review_count += 1
        
        db.session.commit()
        print(f"Created {review_count} reviews")
        
        # Create sample shares
        share_count = 0
        
        # Share demo user's dives with other users
        demo_dives = Dive.query.filter_by(user_id=demo_user.id).all()
        for dive in demo_dives:
            # Share with all other users for better demo visibility
            other_users = [u for u in created_users if u.id != demo_user.id]
            for shared_with_user in other_users:
                share = Share(
                    dive_id=dive.id,
                    creator_user_id=demo_user.id,
                    shared_with_user_id=shared_with_user.id,
                    token=generate_token(),
                    visibility='user_specific',
                    expiration_time=datetime.utcnow() + timedelta(days=30),
                    created_at=datetime.utcnow()
                )
                db.session.add(share)
                share_count += 1
            
            # Also create a public share for demo purposes
            public_share = Share(
                dive_id=dive.id,
                creator_user_id=demo_user.id,
                token=generate_token(),
                visibility='public',
                expiration_time=datetime.utcnow() + timedelta(days=30),
                created_at=datetime.utcnow()
            )
            db.session.add(public_share)
            share_count += 1
        
        # Ensure each user shares with every other user
        for user in created_users:
            if user.username == 'demo':
                continue  # Skip demo user as we already created shares above
                
            # Get all dives for this user
            user_dives = Dive.query.filter_by(user_id=user.id).all()
            if not user_dives:
                continue
                
            # Share at least one dive with each other user
            for other_user in created_users:
                if other_user.id == user.id:
                    continue  # Skip sharing with self
                    
                # Pick a random dive to share
                dive_to_share = random.choice(user_dives)
                
                share = Share(
                    dive_id=dive_to_share.id,
                    creator_user_id=user.id,
                    shared_with_user_id=other_user.id,
                    token=generate_token(),
                    visibility='user_specific',
                    expiration_time=datetime.utcnow() + timedelta(days=random.randint(7, 30)),
                    created_at=datetime.utcnow()
                )
                db.session.add(share)
                share_count += 1
                
                # Occasionally create a public share too
                if random.random() > 0.7:
                    public_share = Share(
                        dive_id=dive_to_share.id,
                        creator_user_id=user.id,
                        token=generate_token(),
                        visibility='public',
                        expiration_time=datetime.utcnow() + timedelta(days=random.randint(7, 30)),
                        created_at=datetime.utcnow()
                    )
                    db.session.add(public_share)
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
                    sighting_time=random_date(datetime(2024, 4, 1), datetime(2024, 5, 15)),
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