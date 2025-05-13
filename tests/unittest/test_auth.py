import unittest
from app import create_app, db
from app.models import User
from config import Config
import json
from datetime import datetime, timedelta
import jwt


class TestConfig(Config):
    """Test configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-secret-key'


class AuthTestCase(unittest.TestCase):
    """Test case for authentication functionality."""
    
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
    
    def tearDown(self):
        """Clean up after each test."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def test_register_success(self):
        """Test successful user registration."""
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'newuser',
                'email': 'new@example.com',
                'password': 'Password123',
                'firstname': 'New',
                'lastname': 'User'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 201)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'User registered successfully')
        
        # Verify user was created in database
        user = User.query.filter_by(username='newuser').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'new@example.com')
    
    def test_register_existing_username(self):
        """Test registration with an existing username."""
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'testuser',  # Already exists
                'email': 'another@example.com',
                'password': 'Password123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Username already exists')
    
    def test_register_existing_email(self):
        """Test registration with an existing email."""
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'anotheruser',
                'email': 'test@example.com',  # Already exists
                'password': 'Password123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Email already registered')
    
    def test_register_invalid_email(self):
        """Test registration with an invalid email format."""
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'anotheruser',
                'email': 'invalid-email',  # Invalid format
                'password': 'Password123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Invalid email format')
    
    def test_register_weak_password(self):
        """Test registration with a weak password."""
        # Test password without uppercase
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'anotheruser',
                'email': 'new@example.com',
                'password': 'password123'  # No uppercase
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertIn('Password must be at least 8 characters', data['error'])
        
        # Test password without lowercase
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'anotheruser',
                'email': 'new@example.com',
                'password': 'PASSWORD123'  # No lowercase
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        
        # Test password without numbers
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'anotheruser',
                'email': 'new@example.com',
                'password': 'PasswordABC'  # No numbers
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        
        # Test password too short
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'anotheruser',
                'email': 'new@example.com',
                'password': 'Pwd1'  # Too short
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
    
    def test_register_missing_fields(self):
        """Test registration with missing required fields."""
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'anotheruser',
                # Missing email and password
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertIn('Missing required field', data['error'])
    
    def test_login_success(self):
        """Test successful login."""
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'Password123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'Login successful')
        self.assertEqual(data['username'], 'testuser')
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        # Test with invalid password
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'WrongPassword123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Invalid email or password')
        
        # Test with non-existent email
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'nonexistent@example.com',
                'password': 'Password123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Invalid email or password')
    
    def test_login_inactive_account(self):
        """Test login with an inactive account."""
        # Set the test user as inactive
        self.test_user.status = 'inactive'
        db.session.commit()
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'Password123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 403)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Account is deactivated')
    
    def test_login_missing_fields(self):
        """Test login with missing required fields."""
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'test@example.com',
                # Missing password
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Both email and password are required')
    
    def test_logout(self):
        """Test user logout."""
        # First login
        self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'Password123'
            }),
            content_type='application/json'
        )
        
        # Then logout
        response = self.client.post('/api/auth/logout')
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'Logout successful')
    
    def test_logout_not_logged_in(self):
        """Test logout when not logged in."""
        response = self.client.post('/api/auth/logout')
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Not logged in')
    
    def test_forgot_password(self):
        """Test forgot password functionality."""
        response = self.client.post(
            '/api/auth/forgot-password',
            data=json.dumps({
                'email': 'test@example.com'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', data)
        self.assertIn('debug_token', data)  # For testing only, would be removed in production
    
    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with non-existent email."""
        response = self.client.post(
            '/api/auth/forgot-password',
            data=json.dumps({
                'email': 'nonexistent@example.com'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)  # Still returns 200 to prevent email enumeration
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'If your email is registered, you will receive a password reset link')
    
    def test_reset_password(self):
        """Test password reset functionality."""
        # Generate a token manually
        payload = {
            'user_id': self.test_user.id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        token = jwt.encode(
            payload,
            self.app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        response = self.client.post(
            '/api/auth/reset-password',
            data=json.dumps({
                'token': token,
                'new_password': 'NewPassword123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'Password reset successful')
        
        # Verify password was changed
        self.test_user = User.query.get(self.test_user.id)  # Refresh user from DB
        self.assertTrue(self.test_user.check_password('NewPassword123'))
    
    def test_reset_password_invalid_token(self):
        """Test password reset with invalid token."""
        response = self.client.post(
            '/api/auth/reset-password',
            data=json.dumps({
                'token': 'invalid-token',
                'new_password': 'NewPassword123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Invalid or expired token')
    
    def test_reset_password_weak_password(self):
        """Test password reset with weak password."""
        payload = {
            'user_id': self.test_user.id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        token = jwt.encode(
            payload,
            self.app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        response = self.client.post(
            '/api/auth/reset-password',
            data=json.dumps({
                'token': token,
                'new_password': 'weak'  # Too short, no uppercase, no number
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', data)
        self.assertIn('Password must be at least 8 characters', data['error'])
    
    def test_reset_password_inactive_account(self):
        """Test password reset with an inactive account."""
        # Set the test user as inactive
        self.test_user.status = 'inactive'
        db.session.commit()
        
        payload = {
            'user_id': self.test_user.id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        token = jwt.encode(
            payload,
            self.app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        response = self.client.post(
            '/api/auth/reset-password',
            data=json.dumps({
                'token': token,
                'new_password': 'NewPassword123'
            }),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 403)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Account is deactivated')


if __name__ == '__main__':
    unittest.main() 