import unittest
from app import create_app, db
from app.models import User
from config import Config
from datetime import datetime


class TestConfig(Config):
    """Test configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


class UserModelTestCase(unittest.TestCase):
    """Test case for User model functionality."""
    
    def setUp(self):
        """Set up test environment before each test."""
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
    
    def tearDown(self):
        """Clean up after each test."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def test_password_hashing(self):
        """Test password hashing is working correctly."""
        u = User(
            username='test',
            email='test@example.com',
            registration_date=datetime.utcnow()
        )
        u.set_password('password123')
        
        # Password should be hashed
        self.assertFalse(u.password_hash == 'password123')
        
        # Should be able to verify the password
        self.assertTrue(u.check_password('password123'))
        
        # Should not verify incorrect password
        self.assertFalse(u.check_password('wrongpassword'))
    
    def test_password_salting(self):
        """Test that same password generates different hashes (salt is working)."""
        u1 = User(
            username='user1',
            email='user1@example.com',
            registration_date=datetime.utcnow()
        )
        u2 = User(
            username='user2',
            email='user2@example.com',
            registration_date=datetime.utcnow()
        )
        
        # Set the same password for both users
        u1.set_password('samepassword')
        u2.set_password('samepassword')
        
        # Password hashes should be different due to salt
        self.assertNotEqual(u1.password_hash, u2.password_hash)
    
    def test_user_creation(self):
        """Test user creation and database operations."""
        # Create user
        u = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            bio='Test bio',
            dob=datetime.strptime('1990-01-01', '%Y-%m-%d').date(),
            registration_date=datetime.utcnow(),
            avatar='avatar.jpg',
            status='active'
        )
        u.set_password('Password123')
        
        # Add to DB
        db.session.add(u)
        db.session.commit()
        
        # Retrieve from DB
        retrieved_user = User.query.filter_by(username='testuser').first()
        
        # Verify user attributes
        self.assertEqual(retrieved_user.username, 'testuser')
        self.assertEqual(retrieved_user.email, 'test@example.com')
        self.assertEqual(retrieved_user.firstname, 'Test')
        self.assertEqual(retrieved_user.lastname, 'User')
        self.assertEqual(retrieved_user.bio, 'Test bio')
        self.assertEqual(retrieved_user.dob.strftime('%Y-%m-%d'), '1990-01-01')
        self.assertEqual(retrieved_user.avatar, 'avatar.jpg')
        self.assertEqual(retrieved_user.status, 'active')
    
    def test_invalid_username(self):
        """Test handling of invalid usernames."""
        # Test duplicated username
        u1 = User(
            username='sameuser',
            email='user1@example.com',
            registration_date=datetime.utcnow()
        )
        u1.set_password('password1')
        db.session.add(u1)
        db.session.commit()
        
        # Try to create another user with the same username
        u2 = User(
            username='sameuser',  # Same username
            email='user2@example.com',  # Different email
            registration_date=datetime.utcnow()
        )
        u2.set_password('password2')
        db.session.add(u2)
        
        # Should raise an exception due to unique constraint
        with self.assertRaises(Exception):
            db.session.commit()
        
        # Rollback to clean up
        db.session.rollback()
    
    def test_invalid_email(self):
        """Test handling of invalid emails."""
        # Test duplicated email
        u1 = User(
            username='user1',
            email='same@example.com',
            registration_date=datetime.utcnow()
        )
        u1.set_password('password1')
        db.session.add(u1)
        db.session.commit()
        
        # Try to create another user with the same email
        u2 = User(
            username='user2',  # Different username
            email='same@example.com',  # Same email
            registration_date=datetime.utcnow()
        )
        u2.set_password('password2')
        db.session.add(u2)
        
        # Should raise an exception due to unique constraint
        with self.assertRaises(Exception):
            db.session.commit()
        
        # Rollback to clean up
        db.session.rollback()
    
    def test_user_status(self):
        """Test user status changes."""
        u = User(
            username='testuser',
            email='test@example.com',
            registration_date=datetime.utcnow(),
            status='active'
        )
        u.set_password('Password123')
        db.session.add(u)
        db.session.commit()
        
        # Verify initial status
        self.assertEqual(u.status, 'active')
        
        # Change status to inactive
        u.status = 'inactive'
        db.session.commit()
        
        # Retrieve user and verify status change
        retrieved_user = User.query.filter_by(username='testuser').first()
        self.assertEqual(retrieved_user.status, 'inactive')


if __name__ == '__main__':
    unittest.main() 