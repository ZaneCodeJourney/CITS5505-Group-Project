import unittest
from app import create_app, db
from app.models import User, Dive, Share
from config import Config
import json
from datetime import datetime, timedelta
import secrets
from decimal import Decimal
from flask_login import login_user


class TestConfig(Config):
    """Test configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False  # Disable CSRF for testing
    SECRET_KEY = 'test-secret-key'
    DEBUG = True
    PROPAGATE_EXCEPTIONS = True  # Propagate exceptions for debugging


class ShareTestCase(unittest.TestCase):
    """Test case for share functionality."""
    
    def setUp(self):
        """Set up test environment before each test."""
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()
        db.create_all()
        
        # Create a test user
        self.test_user = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            registration_date=datetime.utcnow(),
            status='active'
        )
        self.test_user.set_password('Password123')
        db.session.add(self.test_user)
        
        # Create another test user for sharing with
        self.share_recipient = User(
            username='sharerecipient',
            email='recipient@example.com',
            firstname='Share',
            lastname='Recipient',
            registration_date=datetime.utcnow(),
            status='active'
        )
        self.share_recipient.set_password('Password123')
        db.session.add(self.share_recipient)
        db.session.commit()
        
        # Create a test dive
        self.test_dive = Dive(
            user_id=self.test_user.id,
            dive_number=1,
            start_time=datetime.utcnow() - timedelta(hours=2),
            end_time=datetime.utcnow() - timedelta(hours=1),
            max_depth=18.5,
            location='Test Reef',
            weight_belt='10kg',
            visibility='Good',
            weather='Sunny',
            dive_partner='Buddy Name',
            notes='Test notes',
            suit_type='Wetsuit',
            suit_thickness=5.0,
            weight=10.0,
            tank_type='Aluminum',
            tank_size=12.0,
            gas_mix='Air'
        )
        db.session.add(self.test_dive)
        db.session.commit()
        
        # Login test user
        with self.app.test_request_context():
            login_user(self.test_user)
            
        # Set up test client to maintain sessions
        self.client = self.app.test_client(use_cookies=True)
        
        # Simulate login with Flask-Login in the test client
        with self.client.session_transaction() as session:
            session['_user_id'] = str(self.test_user.id)
            session['_fresh'] = True
            session['csrf_token'] = 'test-csrf-token'
    
    def tearDown(self):
        """Clean up after each test."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def test_create_share_link(self):
        """Test creating a share link for a dive."""
        # Login user
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # Add content-type and CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-csrf-token'
        }
        data = {
            'expiration_days': 7
        }
        
        response = self.client.post(
            f'/shared/dives/{self.test_dive.id}/share', 
            json=data, 
            headers=headers
        )
        
        # Check response status and content
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('share_link', data)
        
        # Verify share record was created in the database
        share = Share.query.filter_by(dive_id=self.test_dive.id).first()
        self.assertIsNotNone(share)
        self.assertEqual(share.creator_user_id, self.test_user.id)
        self.assertEqual(share.visibility, 'public')
        self.assertIsNotNone(share.token)
        self.assertIsNotNone(share.expiration_time)
        
        # Verify the token in the URL matches the token in the database
        self.assertIn(share.token, data['share_link'])
    
    def test_create_share_link_nonexistent_dive(self):
        """Test creating a share link for a nonexistent dive."""
        # Login user
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # Add content-type and CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-csrf-token'
        }
        data = {
            'expiration_days': 7
        }
        
        nonexistent_id = 9999  # An ID that doesn't exist
        response = self.client.post(
            f'/shared/dives/{nonexistent_id}/share',
            json=data,
            headers=headers
        )
        
        # Should return 404 error
        self.assertEqual(response.status_code, 404)
    
    def test_access_shared_dive(self):
        """Test accessing a shared dive with a valid token."""
        # Create a share
        token = secrets.token_urlsafe(32)
        share = Share(
            dive_id=self.test_dive.id,
            creator_user_id=self.test_user.id,
            token=token,
            visibility='public',
            expiration_time=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(share)
        db.session.commit()
        
        # Access the shared dive
        response = self.client.get(f'/shared/dive/{token}')
        
        # Check response
        self.assertEqual(response.status_code, 200)
    
    def test_access_shared_dive_invalid_token(self):
        """Test accessing a shared dive with an invalid token."""
        invalid_token = 'invalid-token'
        response = self.client.get(f'/shared/dive/{invalid_token}')
        
        # Should return 404 error
        self.assertEqual(response.status_code, 404)
    
    def test_access_expired_share(self):
        """Test accessing an expired shared dive."""
        # Create a share that's already expired
        token = secrets.token_urlsafe(32)
        expired_share = Share(
            dive_id=self.test_dive.id,
            creator_user_id=self.test_user.id,
            token=token,
            visibility='public',
            expiration_time=datetime.utcnow() - timedelta(days=1)  # Expired 1 day ago
        )
        db.session.add(expired_share)
        db.session.commit()
        
        # Attempt to access the expired share
        response = self.client.get(f'/shared/dive/{token}')
        
        # Should be redirected or receive an error status
        self.assertIn(response.status_code, [302, 404, 410])
    
    def test_share_with_user(self):
        """Test sharing a dive with a specific user."""
        # Login user
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # Add content-type and CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-csrf-token'
        }
        
        data = {
            'username': self.share_recipient.username
        }
        
        response = self.client.post(
            f'/shared/dives/{self.test_dive.id}/share-with-user',
            json=data,
            headers=headers
        )
        
        # Check response
        self.assertEqual(response.status_code, 201)
        
        # Verify share record was created
        share = Share.query.filter_by(
            dive_id=self.test_dive.id,
            creator_user_id=self.test_user.id,
            shared_with_user_id=self.share_recipient.id
        ).first()
        
        self.assertIsNotNone(share)
        self.assertEqual(share.visibility, 'user_specific')
    
    def test_share_with_nonexistent_user(self):
        """Test sharing a dive with a user that doesn't exist."""
        # Login user
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # Add content-type and CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-csrf-token'
        }
        
        data = {
            'username': 'nonexistentuser'
        }
        
        response = self.client.post(
            f'/shared/dives/{self.test_dive.id}/share-with-user',
            json=data,
            headers=headers
        )
        
        # Should return 404 error
        self.assertEqual(response.status_code, 404)
        
    def test_dives_shared_with_me(self):
        """Test viewing dives shared with current user."""
        # Create a share with the current user as recipient
        token = secrets.token_urlsafe(32)
        share = Share(
            dive_id=self.test_dive.id,
            creator_user_id=self.test_user.id,
            shared_with_user_id=self.share_recipient.id,
            token=token,
            visibility='user_specific',
            expiration_time=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(share)
        db.session.commit()
        
        # Switch to recipient user
        with self.client.session_transaction() as session:
            session['_user_id'] = str(self.share_recipient.id)
            session['_fresh'] = True
        
        # Access shared with me page
        response = self.client.get('/shared-with-me')
        
        # Check response
        self.assertEqual(response.status_code, 200)


if __name__ == '__main__':
    unittest.main() 