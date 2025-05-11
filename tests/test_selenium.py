import unittest
import time
import threading
from datetime import datetime, timedelta
from flask import url_for
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from app import create_app, db
from app.models import User, Dive, Share
from config import Config


class TestConfig(Config):
    """Test configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SERVER_NAME = 'localhost:5000'


class SeleniumTestCase(unittest.TestCase):
    """Test case using Selenium"""
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level test environment"""
        # Set Chrome options
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument('--headless')  # Headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Create Chrome WebDriver
        cls.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        # Create app and test client
        cls.app = create_app(TestConfig)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        
        # Create database
        db.create_all()
        
        # Create test data
        test_user = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            registration_date=datetime.utcnow(),
            status='active'
        )
        test_user.set_password('Password123')
        
        sharing_user = User(
            username='sharinguser',
            email='sharing@example.com',
            firstname='Sharing',
            lastname='User',
            registration_date=datetime.utcnow(),
            status='active'
        )
        sharing_user.set_password('Password123')
        
        db.session.add(test_user)
        db.session.add(sharing_user)
        db.session.commit()
        
        # Create test dive record
        test_dive = Dive(
            user_id=test_user.id,
            dive_number=1,
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            max_depth=18.5,
            location='Test Reef',
            visibility='Good',
            weather='Sunny',
            notes='Test dive notes'
        )
        db.session.add(test_dive)
        db.session.commit()
        
        # Start Flask app in a separate thread
        def start_app():
            cls.app.run(port=5000, use_reloader=False)
        
        cls.server_thread = threading.Thread(target=start_app)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        
        # Wait for server to start
        time.sleep(1)
    
    @classmethod
    def tearDownClass(cls):
        """Clean up class-level test environment"""
        cls.driver.quit()
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()
    
    def setUp(self):
        """Set up environment for each test"""
        pass
    
    def tearDown(self):
        """Clean up after each test"""
        # Logout
        try:
            self.driver.delete_all_cookies()
        except:
            pass
    
    def login(self, email, password):
        """Login helper method"""
        self.driver.get('http://localhost:5000/auth/login')
        
        # Wait for login form to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, 'email'))
        )
        
        # Fill login form
        self.driver.find_element(By.ID, 'email').send_keys(email)
        self.driver.find_element(By.ID, 'password').send_keys(password)
        self.driver.find_element(By.ID, 'login-button').click()
        
        # Wait for redirect to complete
        WebDriverWait(self.driver, 10).until(
            EC.url_contains('my-logs')
        )
    
    def test_login_and_logout(self):
        """Test login and logout functionality"""
        # Login
        self.login('test@example.com', 'Password123')
        
        # Verify login success
        self.assertIn('My Dive Logs', self.driver.page_source)
        self.assertIn('testuser', self.driver.page_source)
        
        # Click user menu
        user_menu = self.driver.find_element(By.ID, 'user-dropdown-toggle')
        user_menu.click()
        
        # Wait for dropdown menu to show
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, 'logout-button'))
        )
        
        # Click logout button
        logout_button = self.driver.find_element(By.ID, 'logout-button')
        logout_button.click()
        
        # Wait for redirect to home page
        WebDriverWait(self.driver, 10).until(
            EC.url_contains('/')
        )
        
        # Verify logout success
        self.assertIn('Login', self.driver.page_source)
        self.assertIn('Register', self.driver.page_source)
    
    def test_view_dive_details(self):
        """Test viewing dive details functionality"""
        # Login
        self.login('test@example.com', 'Password123')
        
        # Navigate to my dive logs
        self.driver.get('http://localhost:5000/my-logs')
        
        # Wait for page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'dive-card'))
        )
        
        # Click first dive card
        dive_card = self.driver.find_element(By.CLASS_NAME, 'dive-card')
        dive_card.click()
        
        # Wait for details page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'dive-details-container'))
        )
        
        # Verify details page contains correct information
        self.assertIn('Test Reef', self.driver.page_source)
        self.assertIn('18.5 meters', self.driver.page_source)
        self.assertIn('Test dive notes', self.driver.page_source)
    
    def test_share_dive(self):
        """Test share dive functionality"""
        # Login
        self.login('test@example.com', 'Password123')
        
        # Navigate to my dive logs
        self.driver.get('http://localhost:5000/my-logs')
        
        # Wait for page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'dive-card'))
        )
        
        # Click first dive card
        dive_card = self.driver.find_element(By.CLASS_NAME, 'dive-card')
        dive_card.click()
        
        # Wait for details page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'dive-details-container'))
        )
        
        # Click share button
        share_button = self.driver.find_element(By.ID, 'share-dive-btn')
        share_button.click()
        
        # Wait for share modal to show
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, 'share-modal'))
        )
        
        # Input username to share with
        username_input = self.driver.find_element(By.ID, 'share-username')
        username_input.send_keys('sharinguser')
        
        # Click share with specific user button
        share_with_user_btn = self.driver.find_element(By.ID, 'share-with-user-btn')
        share_with_user_btn.click()
        
        # Wait for success message
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'alert-success'))
        )
        
        # Verify success message
        success_message = self.driver.find_element(By.CLASS_NAME, 'alert-success')
        self.assertIn('Dive successfully shared with sharinguser', success_message.text)
    
    def test_view_shared_dives(self):
        """Test viewing shared dives functionality"""
        # First create a share record
        with self.app.app_context():
            test_user = User.query.filter_by(username='testuser').first()
            sharing_user = User.query.filter_by(username='sharinguser').first()
            test_dive = Dive.query.filter_by(user_id=test_user.id).first()
            
            share = Share(
                dive_id=test_dive.id,
                creator_user_id=test_user.id,
                shared_with_user_id=sharing_user.id,
                token='test-token',
                visibility='user_specific'
            )
            db.session.add(share)
            db.session.commit()
        
        # Login as share recipient
        self.login('sharing@example.com', 'Password123')
        
        # Navigate to "Shared with Me" page
        self.driver.get('http://localhost:5000/shared-with-me')
        
        # Wait for page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'card'))
        )
        
        # Verify page contains shared dive information
        self.assertIn('Test Reef', self.driver.page_source)
        self.assertIn('Shared by Test User', self.driver.page_source)
        
        # Click view details button
        view_button = self.driver.find_element(By.CLASS_NAME, 'btn-primary')
        view_button.click()
        
        # Wait for details page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'dive-details-container'))
        )
        
        # Verify details page contains correct information
        self.assertIn('Test Reef', self.driver.page_source)
        self.assertIn('18.5 meters', self.driver.page_source)
        self.assertIn('Shared Dive Log', self.driver.page_source)
        self.assertIn('This dive log was shared with you by testuser', self.driver.page_source)


if __name__ == '__main__':
    unittest.main() 