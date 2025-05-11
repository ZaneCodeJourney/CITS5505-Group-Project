import unittest
import time
import threading
import random
import string
from datetime import datetime
from flask import url_for
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, UnexpectedAlertPresentException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from app import create_app, db
from app.models import User
from config import Config


class TestConfig(Config):
    """Test configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SERVER_NAME = 'localhost:5000'


class AuthSeleniumTestCase(unittest.TestCase):
    """Auth module Selenium test cases"""
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level test environment"""
        # Set Chrome options
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Create Chrome WebDriver
        cls.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        # Create application and test client
        cls.app = create_app(TestConfig)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        
        # Create database
        db.create_all()
        
        # Create an existing test user (for login testing)
        test_user = User(
            username='testuser',
            email='test@example.com',
            firstname='Test',
            lastname='User',
            registration_date=datetime.utcnow(),
            status='active'
        )
        test_user.set_password('Password123')
        db.session.add(test_user)
        db.session.commit()
        
        # Start Flask application
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
        # Clear cookies to simulate logout
        try:
            self.driver.delete_all_cookies()
            # Handle any alerts that might be present
            try:
                alert = self.driver.switch_to.alert
                alert.accept()
            except:
                pass
        except:
            pass
    
    def test_login_page_loads(self):
        """Test that login page loads correctly"""
        self.driver.get('http://localhost:5000/auth/login')
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, 'login-form'))
        )
        login_title = self.driver.find_element(By.CSS_SELECTOR, '.form-title').text
        self.assertEqual(login_title, 'Log In')
        
        # Check that login form elements exist
        self.assertTrue(self.driver.find_element(By.ID, 'email').is_displayed())
        self.assertTrue(self.driver.find_element(By.ID, 'password').is_displayed())
        self.assertTrue(self.driver.find_element(By.CSS_SELECTOR, 'button.btn-primary').is_displayed())
    
    def test_register_page_loads(self):
        """Test that registration page loads correctly"""
        self.driver.get('http://localhost:5000/auth/register')
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, 'registration-form'))
        )
        register_title = self.driver.find_element(By.CSS_SELECTOR, '.form-title').text
        self.assertEqual(register_title, 'Create an Account')
        
        # Check that registration form elements exist
        self.assertTrue(self.driver.find_element(By.ID, 'username').is_displayed())
        self.assertTrue(self.driver.find_element(By.ID, 'email').is_displayed())
        self.assertTrue(self.driver.find_element(By.ID, 'password').is_displayed())
        self.assertTrue(self.driver.find_element(By.ID, 'confirm-password').is_displayed())
    
    def test_password_mismatch_validation(self):
        """Test client-side password mismatch validation"""
        # Visit registration page
        self.driver.get('http://localhost:5000/auth/register')
        
        # Wait for registration form to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, 'registration-form'))
        )
        
        # Generate random username and email
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        username = f"newuser{random_string}"
        email = f"newuser{random_string}@example.com"
        
        # Fill out form (with mismatched passwords)
        self.driver.find_element(By.ID, 'username').send_keys(username)
        self.driver.find_element(By.ID, 'email').send_keys(email)
        self.driver.find_element(By.ID, 'password').send_keys('Password123')
        self.driver.find_element(By.ID, 'confirm-password').send_keys('Password456')
        self.driver.find_element(By.ID, 'firstname').send_keys('New')
        self.driver.find_element(By.ID, 'lastname').send_keys('User')
        
        # Submit form
        self.driver.find_element(By.CSS_SELECTOR, 'button.btn-primary').click()
        
        # Wait for error message to display
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, 'confirm-password-error'))
        )
        
        # Verify error message content
        error_message = self.driver.find_element(By.ID, 'confirm-password-error')
        self.assertIn('Passwords do not match', error_message.text)
        
        # Verify URL is unchanged, still on registration page
        self.assertIn('/auth/register', self.driver.current_url)
    
    def test_navigation_between_auth_pages(self):
        """Test navigation between authentication pages"""
        # Start at login page
        self.driver.get('http://localhost:5000/auth/login')
        
        # Click register link
        self.driver.find_element(By.CSS_SELECTOR, '.register-link a').click()
        
        # Verify we're on registration page
        WebDriverWait(self.driver, 10).until(
            EC.url_contains('/auth/register')
        )
        
        # Click login link
        self.driver.find_element(By.CSS_SELECTOR, '.login-link a').click()
        
        # Verify we're back on login page
        WebDriverWait(self.driver, 10).until(
            EC.url_contains('/auth/login')
        )
    
    def test_forgot_password_link(self):
        """Test that forgot password link works"""
        # Visit login page
        self.driver.get('http://localhost:5000/auth/login')
        
        # Wait for login form to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, 'login-form'))
        )
        
        # Click forgot password link
        forgot_password_link = self.driver.find_element(By.CSS_SELECTOR, '.forgot-password a')
        self.assertEqual(forgot_password_link.get_attribute('href'), 'http://localhost:5000/auth/forgot-password')


if __name__ == '__main__':
    unittest.main() 