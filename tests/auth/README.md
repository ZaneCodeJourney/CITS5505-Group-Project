# Auth Tests

This directory contains unit tests for the authentication functionality of the application.

## Test Files

- `test_auth.py`: Tests the API endpoints for authentication (register, login, logout, password reset)
- `test_user_model.py`: Tests the User model and its authentication-related functionality
- `run_tests.py`: Script to run all tests

## Running the Tests

### Prerequisites

1. Activate your virtual environment:
   ```
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

2. Make sure you have all dependencies installed:
   ```
   python -m pip install -r requirements.txt
   ```

### Running All Tests

```
python -m tests.run_tests
```

### Running Specific Test Files

```
# Run auth API tests
python -m unittest tests.test_auth

# Run User model tests
python -m unittest tests.test_user_model
```

### Running Specific Test Methods

```
# Run specific test method
python -m unittest tests.test_auth.AuthTestCase.test_login_success
```

## Test Coverage

The tests cover:

- User registration (success and various failure cases)
- User login (success and various failure cases)
- User logout
- Password reset functionality
- User model functionality including password hashing and salting
- Handling of duplicate usernames and emails
- User status changes

## Expected Success Cases

- Successful user registration with valid data
- Successful login with correct credentials
- Successful logout
- Successful password reset with valid token

## Edge Cases

- Registration with existing username or email
- Registration with invalid email format
- Registration with weak password
- Login with invalid credentials
- Login to inactive account
- Missing required fields in requests
- Password reset with invalid token
- Password reset for inactive account 