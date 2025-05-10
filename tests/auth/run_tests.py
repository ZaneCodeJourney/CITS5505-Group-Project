import unittest
import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

if __name__ == '__main__':
    # Discover and run all tests in the tests/auth directory
    test_loader = unittest.TestLoader()
    test_suite = test_loader.discover('tests/auth', pattern='test_*.py')
    
    # Run the tests
    result = unittest.TextTestRunner(verbosity=2).run(test_suite)
    
    # Exit with non-zero code if there were test failures
    sys.exit(not result.wasSuccessful()) 