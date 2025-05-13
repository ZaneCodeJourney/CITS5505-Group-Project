import unittest
import time
import threading
from datetime import datetime, timezone
import subprocess

# Selenium imports
from selenium import webdriver
from selenium.webdriver.safari.service import Service as SafariService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

# Flask app imports
from app import create_app, db
from app.models import User, Dive
from config import Config
from app.auth import bp as auth_blueprint

class TestConfig(Config):
    """Test configuration for the Flask app"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory database for testing
    WTF_CSRF_ENABLED = False  # Disable CSRF protection for easier testing
    SERVER_NAME = 'localhost:5000'  # Change to match the running Flask app

# Function to run AppleScript
def run_applescript(script_path):
    """Run an AppleScript from the given file path."""
    subprocess.run(['osascript', script_path])

class DiveSeleniumTestCase(unittest.TestCase):
    """Dive module Selenium test cases for dive log functionality"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment before running any tests"""
        # Run AppleScript to deny location request
        run_applescript('deny_location.scpt')
        time.sleep(2)  # Add a short delay to ensure the script executes

        # Initialize Safari WebDriver
        try:
            # Safari WebDriver does not require downloading a driver, use the system's built-in one
            cls.driver = webdriver.Safari()
            cls.driver.implicitly_wait(5)  # Reduce implicit wait to 5 seconds
            print("Safari WebDriver initialized successfully")
        except Exception as e:
            print(f"Error initializing Safari WebDriver: {e}")
            raise

        # Create and configure the Flask app
        cls.app = create_app(TestConfig)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

        # Set up the database
        db.create_all()

        # Create a test user
        cls._create_test_user()

        # Start the Flask application in a separate thread
        cls._start_flask_app()

    @classmethod
    def _create_test_user(cls):
        """Create a test user in the database"""
        test_user = User(
            username='testuser',
            email='testmail@test.com',
            firstname='Test',
            lastname='User',
            registration_date=datetime.now(timezone.utc),
            status='active'
        )
        test_user.set_password('Password123')
        db.session.add(test_user)
        db.session.commit()

        # Verify user creation
        user = User.query.filter_by(email='testmail@test.com').first()
        if user:
            print(f"Test user created: {user.email}, Status: {user.status}")
        else:
            print("Error: Test user not found in the database.")

    @classmethod
    def _start_flask_app(cls):
        """Start the Flask application in a separate thread"""
        def start_app():
            cls.app.run(port=5000, use_reloader=False)

        cls.server_thread = threading.Thread(target=start_app)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        
        # Wait for the app to start
        time.sleep(2)
        print("Flask application started")

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests are finished"""
        if hasattr(cls, 'driver'):
            cls.driver.quit()
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()
        print("Test environment cleaned up")

    def login(self):
        """Log in as the test user"""
        # Navigate to login page
        self.driver.get('http://127.0.0.1:5000/auth/login')
        
        # Wait for login form to load
        WebDriverWait(self.driver, 30).until(
            EC.presence_of_element_located((By.ID, 'email'))
        )
        
        # Enter email and password
        email_input = self.driver.find_element(By.ID, 'email')
        email_input.clear()
        time.sleep(1)  # Reduce delay to 1 second
        email_input.send_keys('testmail@test.com')
        time.sleep(1)  # Reduce delay to 1 second
        
        password_input = self.driver.find_element(By.ID, 'password')
        password_input.clear()
        time.sleep(1)  # Reduce delay to 1 second
        password_input.send_keys('Password123')
        time.sleep(1)  # Reduce delay to 1 second
        
        # Submit login form
        login_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type=\"submit\"]')
        login_button.click()
        
        # Wait for redirect to home page
        try:
            WebDriverWait(self.driver, 20).until(
                lambda driver: driver.current_url == "http://127.0.0.1:5000/" or 
                              driver.current_url == "http://127.0.0.1:5000/index"
            )
            print(f"Successfully logged in, current URL: {self.driver.current_url}")
        except Exception as e:
            print(f"Error after login: {e}")
            print(f"Current URL after login attempt: {self.driver.current_url}")
            print(f"Page source after login attempt: {self.driver.page_source[:500]}")
            raise
        
        # Verify login success
        assert 'testaccount' in self.driver.page_source, "Username 'testaccount' not found in page after login"

    def test_login(self):
        """Test user login functionality"""
        self.login()
        self.assertIn('testuser', self.driver.page_source)
        print("Login test passed successfully")

    def test_create_dive_log(self):
        """Test creating a new dive log entry"""
        # Log in first
        self.login()
        
        # Navigate to new dive log page
        self.driver.get('http://127.0.0.1:5000/new-log')
        
        # Wait for form to load
        WebDriverWait(self.driver, 30).until(
            EC.presence_of_element_located((By.ID, 'diveLogForm'))
        )
        print("New dive log form loaded")

        # Fill required fields
        self.driver.find_element(By.ID, 'dive-site').send_keys('Coral Reef')
        self.driver.execute_script(
            "document.getElementById('dive-date').value = '2023-10-01';"
        )
        # Skip start time and end time as they are not required
        # self.driver.find_element(By.ID, 'start-time').send_keys('10:00')
        # self.driver.find_element(By.ID, 'end-time').send_keys('11:00')
        self.driver.find_element(By.ID, 'duration').send_keys('60')
        self.driver.find_element(By.ID, 'max-depth').send_keys('20')
        
        # Additional fields
        self.driver.find_element(By.ID, 'visibility').send_keys('15')
        Select(self.driver.find_element(By.ID, 'weather')).select_by_value('sunny')
        self.driver.find_element(By.ID, 'dive-notes').send_keys('Great dive! Saw lots of colorful fish.')
        
        # Log form values for debugging
        print("Form values before submit:")
        print(f"Dive site: {self.driver.find_element(By.ID, 'dive-site').get_attribute('value')}")
        print(f"Date: {self.driver.find_element(By.ID, 'dive-date').get_attribute('value')}")
        print(f"Max depth: {self.driver.find_element(By.ID, 'max-depth').get_attribute('value')}")
        print(f"Start time: {self.driver.find_element(By.ID, 'start-time').get_attribute('value')}")
        print(f"End time: {self.driver.find_element(By.ID, 'end-time').get_attribute('value')}")

        # Submit the form
        try:
            submit_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
            submit_button.click()
            print("Dive log form submitted")
        except Exception as e:
            print(f"Error submitting dive log form: {e}")
            print(f"Page source: {self.driver.page_source}")
            raise

        # Wait for redirect to dive logs page
        try:
            WebDriverWait(self.driver, 20).until(
                lambda driver: driver.current_url == "http://127.0.0.1:5000/my-logs" or 
                               "success=dive_created" in driver.current_url
            )
            print(f"Successfully redirected after form submission to: {self.driver.current_url}")
        except Exception as e:
            print(f"Error after form submission: {e}")
            print(f"Current URL after form submission: {self.driver.current_url}")
            print(f"Page source after form submission: {self.driver.page_source[:500]}")
            raise

        # Verify the dive log was created
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'log-card'))
        )
        
        # Verify dive log content
        page_source = self.driver.page_source
        self.assertIn('Coral Reef', page_source, "Dive site name not found in created log")
        self.assertIn('20', page_source, "Dive depth not found in created log")
        self.assertIn('Great dive', page_source, "Dive notes not found in created log")
        print("Dive log creation test passed successfully")

    def test_dive_log_page_loads(self):
        """Test that the dive logs page loads correctly"""
        # Log in first
        self.login()
        
        # Navigate to dive logs page
        self.driver.get('http://localhost:5000/my-logs')
        
        # Wait for page to load
        WebDriverWait(self.driver, 30).until(
            EC.presence_of_element_located((By.ID, 'dive-log-page'))
        )
        print("Dive logs page loaded")
        
        # Verify page title
        page_title = self.driver.find_element(By.CSS_SELECTOR, '.page-title').text
        self.assertEqual(page_title, 'Dive Logs', "Page title does not match expected value")
        
        # Check that essential elements exist
        try:
            elements_to_check = ['dive-number', 'location', 'max-depth']
            for element_id in elements_to_check:
                element = self.driver.find_element(By.ID, element_id)
                self.assertTrue(element.is_displayed(), f"Element {element_id} is not displayed")
            print("All required elements are displayed on the dive logs page")
        except Exception as e:
            print(f"Error checking dive log page elements: {e}")
            print(f"Page source: {self.driver.page_source}")
            raise
        
        # Ensure the page has fully loaded
        WebDriverWait(self.driver, 30).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'log-card'))
        )

        # Print current URL and page source for debugging
        print(f"Current URL before scrolling: {self.driver.current_url}")
        print("Page source before scrolling:")
        print(self.driver.page_source[:500])  # Print first 500 characters of the page source

        # Find the first log-card element
        log_card = self.driver.find_element(By.CLASS_NAME, 'log-card')

        # Scroll to the log-card element using JavaScript
        self.driver.execute_script("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", log_card)

        # Verify log-card is visible after scrolling
        assert log_card.is_displayed(), "Log card is not visible after scrolling"

        # Print current URL and page source for debugging
        print(f"Current URL after scrolling: {self.driver.current_url}")
        print("Page source after scrolling:")
        print(self.driver.page_source[:500])  # Print first 500 characters of the page source
        
        print("Dive logs page test passed successfully")

if __name__ == '__main__':
    unittest.main() 