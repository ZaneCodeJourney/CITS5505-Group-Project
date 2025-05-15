import unittest
from app import create_app, db
from app.models import Dive, User
from config import Config
from datetime import datetime, timezone
import json

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-secret-key'

class DiveTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()
        db.create_all()

        # Add a test user to the database
        self.test_user = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            registration_date=datetime.now(timezone.utc),
            status='active'
        )
        self.test_user.set_password('Password123')
        db.session.add(self.test_user)
        db.session.commit()

        # Log in the test user
        self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'Password123'
            }),
            content_type='application/json'
        )

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_create_dive(self):
        response = self.client.post(
            '/api/dives/',
            data=json.dumps({
                'user_id': self.test_user.id,
                'dive_number': 1,
                'start_time': '2025-05-10T09:00:00',
                'end_time': '2025-05-10T10:00:00',
                'max_depth': 18.0,
                'location': 'Coral Garden'
            }),
            content_type='application/json'
        )
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 201)
        dive = db.session.get(Dive, 1)
        self.assertIsNotNone(dive)
        self.assertEqual(dive.location, 'Coral Garden')

    def test_get_dive(self):
        # Create a Dive record
        dive = Dive(
            user_id=self.test_user.id,
            dive_number=1,
            start_time=datetime(2025, 5, 10, 9, 0),
            end_time=datetime(2025, 5, 10, 10, 0),
            max_depth=18.0,
            location='Blue Hole'
        )
        db.session.add(dive)
        db.session.commit()

        # GET request
        response = self.client.get(f'/api/dives/{dive.id}')
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['location'], 'Blue Hole')

    def test_update_dive(self):
        # Create a Dive record
        dive = Dive(
            user_id=self.test_user.id,
            dive_number=1,
            start_time=datetime(2025, 5, 10, 9, 0),
            end_time=datetime(2025, 5, 10, 10, 0),
            max_depth=18.0,
            location='Shipwreck'
        )
        db.session.add(dive)
        db.session.commit()

        # PUT update
        response = self.client.put(
            f'/api/dives/{dive.id}',
            data=json.dumps({'location': 'Shark Reef'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        updated_dive = db.session.get(Dive, dive.id)
        self.assertEqual(updated_dive.location, 'Shark Reef')

    def test_delete_dive(self):
        # Create a Dive record
        dive = Dive(
            user_id=self.test_user.id,
            dive_number=1,
            start_time=datetime(2025, 5, 10, 9, 0),
            end_time=datetime(2025, 5, 10, 10, 0),
            max_depth=18.0,
            location='Deep Sea'
        )
        db.session.add(dive)
        db.session.commit()

        # DELETE request
        response = self.client.delete(f'/api/dives/{dive.id}')
        self.assertEqual(response.status_code, 204)

        deleted_dive = db.session.get(Dive, dive.id)
        self.assertIsNone(deleted_dive)

if __name__ == '__main__':
    unittest.main()