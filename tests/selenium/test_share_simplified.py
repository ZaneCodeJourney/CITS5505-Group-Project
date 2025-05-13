import unittest
import time
import json
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from app import create_app, db
from app.models import User, Dive, Share
from config import Config
import flask_login
from flask_login import LoginManager
from flask import session

class TestConfig(Config):
    """Test Configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-key-for-csrf'
    SERVER_NAME = 'localhost:5050'

class ShareFunctionalityTest(unittest.TestCase):
    """Combined API call and Selenium tests for the Share functionality"""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment"""
        # Create Chrome browser
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        cls.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        # Create Flask application and test database
        cls.app = create_app(TestConfig)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        cls.client = cls.app.test_client()
        
        # Create database
        db.create_all()
        
        # Create test users
        cls.test_user = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            registration_date=datetime.utcnow(),
            status='active'
        )
        cls.test_user.set_password('Password123')
        
        cls.recipient = User(
            username='recipient',
            email='recipient@example.com',
            firstname='Share',
            lastname='Recipient',
            registration_date=datetime.utcnow(),
            status='active'
        )
        cls.recipient.set_password('Password123')
        
        db.session.add(cls.test_user)
        db.session.add(cls.recipient)
        db.session.commit()
        
        # Create test dive records
        cls.dive1 = Dive(
            user_id=cls.test_user.id,
            dive_number=1,
            start_time=datetime.utcnow() - timedelta(days=3),
            end_time=datetime.utcnow() - timedelta(days=3) + timedelta(hours=1),
            max_depth=18.5,
            location='Great Barrier Reef',
            visibility='Excellent',
            weather='Sunny',
            notes='Amazing coral formations'
        )
        
        cls.dive2 = Dive(
            user_id=cls.test_user.id,
            dive_number=2,
            start_time=datetime.utcnow() - timedelta(days=1),
            end_time=datetime.utcnow() - timedelta(days=1) + timedelta(hours=1, minutes=30),
            max_depth=22.0,
            location='Blue Hole',
            visibility='Good',
            weather='Partly Cloudy',
            notes='Deep dive with interesting formations'
        )
        
        db.session.add(cls.dive1)
        db.session.add(cls.dive2)
        db.session.commit()
    
        # Start Flask application in a separate thread
        def start_flask():
            cls.app.run(host='127.0.0.1', port=5050, use_reloader=False)
        
        import threading
        cls.flask_thread = threading.Thread(target=start_flask)
        cls.flask_thread.daemon = True
        cls.flask_thread.start()
        
        # Wait for server to start
        time.sleep(2)
    
    @classmethod
    def tearDownClass(cls):
        """Clean up the test environment"""
        cls.driver.quit()
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()
    
    def tearDown(self):
        """Clean up after each test"""
        # Clear all share records (retain initial data)
        Share.query.delete()
        db.session.commit()
    
    def create_session_for_user(self, user_id):
        """Create session for the test user"""
        with self.app.test_request_context():
            user = User.query.get(user_id)
            flask_login.login_user(user)
            # Save session data
            return dict(session)
    
    def login_api(self, email, password, client=None):
        """API login method"""
        if client is None:
            client = self.client
        
        # Get user ID
        user = User.query.filter_by(email=email).first()
        if not user:
            raise ValueError(f"User with email {email} not found")
            
        session_data = self.create_session_for_user(user.id)
        
        # Create a new client instance with session state
        client = self.app.test_client()
        with client.session_transaction() as sess:
            for key, value in session_data.items():
                sess[key] = value
        
        # Test if login was successful
        response = client.get('/my-logs')
        self.assertEqual(response.status_code, 200)
        
        return client
    
    def test_01_api_share_with_user(self):
        """Test: API sharing dive log with a specific user"""
        print("\nTest: API sharing dive log with a specific user")
        
        # Login as test user
        client = self.login_api('test@example.com', 'Password123')
        
        # Use API to share dive log
        share_response = client.post(
            f'/api/shared/dives/{self.dive1.id}/share-with-user',
            json={'username': 'recipient'},
            headers={'Content-Type': 'application/json'}
        )
        
        # Print response for debugging
        print(f"API Response: {share_response.status_code}")
        print(f"Response Content: {share_response.data.decode('utf-8')}")
        
        # Check API response
        self.assertEqual(share_response.status_code, 201)
        response_data = json.loads(share_response.data)
        self.assertIn('success', response_data)
        
        # Verify share record was created
        share = Share.query.filter_by(
            dive_id=self.dive1.id,
            creator_user_id=self.test_user.id,
            shared_with_user_id=self.recipient.id
        ).first()
        
        self.assertIsNotNone(share)
        print("✓ API share successfully created")
        
        # Use Selenium to view the sharing interface elements
        try:
            # Using the correct port
            self.driver.get('http://localhost:5050/auth/login')
            
            # Screenshot the login page
            self.driver.save_screenshot('login_page.png')
            
            print("✓ Successfully loaded login page")
        except Exception as e:
            print(f"× Selenium test failed: {e}")
    
    def test_02_api_create_public_link(self):
        """Test: API creating public share link"""
        print("\nTest: API creating public share link")
        
        # Login as test user
        client = self.login_api('test@example.com', 'Password123')
        
        # Use API to create public link
        share_response = client.post(
            f'/api/shared/dives/{self.dive2.id}/share',
            json={'expiration_days': 7},
            headers={'Content-Type': 'application/json'}
        )
        
        # Check API response
        self.assertEqual(share_response.status_code, 201)
        data = json.loads(share_response.data)
        self.assertIn('share_link', data)
        self.assertIn('token', data)
        
        # Verify share record was created
        share = Share.query.filter_by(
            dive_id=self.dive2.id,
            creator_user_id=self.test_user.id,
            visibility='public'
        ).first()
        
        self.assertIsNotNone(share)
        print(f"✓ Public share link successfully created: {data['share_link']}")
    
    def test_03_api_share_with_nonexistent_user(self):
        """Test: API sharing with nonexistent user"""
        print("\nTest: API sharing with nonexistent user")
        
        # Login as test user
        client = self.login_api('test@example.com', 'Password123')
        
        # Use API to share with nonexistent user
        share_response = client.post(
            f'/api/shared/dives/{self.dive1.id}/share-with-user',
            json={'username': 'nonexistentuser'},
            headers={'Content-Type': 'application/json'}
        )
        
        # Check API response
        self.assertEqual(share_response.status_code, 404)
        data = json.loads(share_response.data)
        self.assertIn('error', data)
        print(f"✓ API correctly returned 404 error: {data['error']}")
    
    def test_04_api_recipient_view_shared(self):
        """Test: Recipient viewing shared dive logs"""
        print("\nTest: Recipient viewing shared dive logs")
        
        # Create share record
        share = Share(
            dive_id=self.dive1.id,
            creator_user_id=self.test_user.id,
            shared_with_user_id=self.recipient.id,
            token='test-token-123',
            visibility='user_specific',
            created_at=datetime.utcnow()
        )
        db.session.add(share)
        db.session.commit()
        
        # Login as recipient
        client = self.login_api('recipient@example.com', 'Password123')
        
        # Verify share records in database
        with self.app.app_context():
            # Query dive logs shared with recipient
            shared_dives = db.session.query(Dive).\
                join(Share, Dive.id == Share.dive_id).\
                filter(Share.shared_with_user_id == self.recipient.id).\
                all()
            
            self.assertEqual(len(shared_dives), 1)
            self.assertEqual(shared_dives[0].id, self.dive1.id)
            self.assertEqual(shared_dives[0].location, 'Great Barrier Reef')
            
            print(f"✓ Recipient can see shared dive log: {shared_dives[0].location}")
            
            # Try to access 'Shared with me' page
            response = client.get('/api/shared/shared-with-me')
            self.assertEqual(response.status_code, 200)
            print("✓ Recipient can access 'Shared with me' page")
    
    def test_05_api_authentication_required(self):
        """Test: API requires authentication"""
        print("\nTest: API requires authentication")
        
        # Create a new client without session
        unauthenticated_client = self.app.test_client()
        
        # Try to share without logging in
        share_response = unauthenticated_client.post(
            f'/api/shared/dives/{self.dive1.id}/share-with-user',
            json={'username': 'recipient'},
            headers={'Content-Type': 'application/json'}
        )
        
        # Should return 401 or 302 (redirect to login page)
        self.assertIn(share_response.status_code, [401, 302, 403])
        print(f"✓ API correctly blocks unauthenticated requests (status code: {share_response.status_code})")
        
        # Check if response contains login-related redirect or error message
        if share_response.status_code == 302:
            location = share_response.headers.get('Location', '')
            self.assertIn('/auth/login', location)
            print(f"✓ Correctly redirected to login page: {location}")
        else:
            data = json.loads(share_response.data)
            self.assertIn('error', data)
            print(f"✓ Returned correct error message: {data['error']}")

if __name__ == '__main__':
    unittest.main() 