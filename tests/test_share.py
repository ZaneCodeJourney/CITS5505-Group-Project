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
    WTF_CSRF_ENABLED = False  # 禁用CSRF以便于测试
    SECRET_KEY = 'test-secret-key'
    DEBUG = True
    PROPAGATE_EXCEPTIONS = True  # 传递异常以便于调试


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
        
        # 登录测试用户
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
        # 先登录用户
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # 增加content-type和CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-token'
        }
        data = {
            'expiration_days': 7
        }
        
        response = self.client.post(
            f'/api/shared/dives/{self.test_dive.id}/share', 
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
        # 先登录用户
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # 增加content-type和CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-token'
        }
        data = {
            'expiration_days': 7
        }
        
        nonexistent_id = 9999  # An ID that doesn't exist
        response = self.client.post(
            f'/api/shared/dives/{nonexistent_id}/share',
            json=data,
            headers=headers
        )
        
        # 应该返回404或500错误
        self.assertIn(response.status_code, [404, 500])
    
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
        response = self.client.get(f'/api/shared/dives/{token}')
        
        # Check response status and content
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['id'], self.test_dive.id)
        self.assertEqual(data['dive_number'], self.test_dive.dive_number)
        
        # For depth comparison, convert both values to float for comparison
        self.assertAlmostEqual(float(data['max_depth']), float(self.test_dive.max_depth), places=2)
        
        self.assertEqual(data['location'], self.test_dive.location)
    
    def test_access_shared_dive_invalid_token(self):
        """Test accessing a shared dive with an invalid token."""
        invalid_token = 'invalid-token'
        response = self.client.get(f'/api/shared/dives/{invalid_token}')
        
        # 应该返回404或500错误
        self.assertIn(response.status_code, [404, 500])
    
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
        response = self.client.get(f'/api/shared/dives/{token}')
        
        # Should return 410 Gone
        self.assertEqual(response.status_code, 410)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Share link expired.')
    
    def test_update_dive_visibility(self):
        """Test updating the visibility of a shared dive."""
        # 先登录用户
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
        
        # Create a share
        share = Share(
            dive_id=self.test_dive.id,
            creator_user_id=self.test_user.id,
            token=secrets.token_urlsafe(32),
            visibility='public'
        )
        db.session.add(share)
        db.session.commit()
        
        # 增加content-type和CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-token'
        }
        
        # Update the visibility
        response = self.client.put(
            f'/api/shared/dives/{self.test_dive.id}/visibility',
            data=json.dumps({'visibility': 'private'}),
            content_type='application/json',
            headers=headers
        )
        
        # Check response status and content
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['visibility'], 'private')
        
        # Verify visibility was updated in the database
        updated_share = Share.query.filter_by(dive_id=self.test_dive.id).first()
        self.assertEqual(updated_share.visibility, 'private')
    
    def test_update_visibility_nonexistent_share(self):
        """Test updating visibility for a dive without a share record."""
        # 先登录用户
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # 增加content-type和CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-token'
        }
        
        # No share record exists for the dive
        response = self.client.put(
            f'/api/shared/dives/{self.test_dive.id}/visibility',
            data=json.dumps({'visibility': 'private'}),
            content_type='application/json',
            headers=headers
        )
        
        # Should return 404 Not Found
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'No share record found.')
    
    def test_update_visibility_nonexistent_dive(self):
        """Test updating visibility for a nonexistent dive."""
        # 先登录用户
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # 增加content-type和CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-token'
        }
        
        nonexistent_id = 9999  # An ID that doesn't exist
        response = self.client.put(
            f'/api/shared/dives/{nonexistent_id}/visibility',
            data=json.dumps({'visibility': 'private'}),
            content_type='application/json',
            headers=headers
        )
        
        # 应该返回404或500错误
        self.assertIn(response.status_code, [404, 500])
    
    def test_multiple_shares_for_same_dive(self):
        """Test creating multiple share links for the same dive."""
        # 先登录用户
        with self.client.session_transaction() as session:
            session['user_id'] = self.test_user.id
            
        # 增加content-type和CSRF token
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'test-token'
        }
        data = {
            'expiration_days': 7
        }
        
        # Create first share
        response1 = self.client.post(
            f'/api/shared/dives/{self.test_dive.id}/share',
            json=data,
            headers=headers
        )
        self.assertEqual(response1.status_code, 201)
        data1 = json.loads(response1.data)
        
        # Create second share
        response2 = self.client.post(
            f'/api/shared/dives/{self.test_dive.id}/share',
            json=data,
            headers=headers
        )
        self.assertEqual(response2.status_code, 201)
        data2 = json.loads(response2.data)
        
        # Verify the two share links are different
        self.assertNotEqual(data1['share_link'], data2['share_link'])
        
        # Verify two share records exist in the database
        shares = Share.query.filter_by(dive_id=self.test_dive.id).all()
        self.assertEqual(len(shares), 2)


if __name__ == '__main__':
    unittest.main() 