// Authentication functionality for DiveLogger
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the auth page
    const authPage = document.querySelector('.auth-page');
    if (!authPage) return;
    
    // Initialize auth tabs
    initAuthTabs();
    
    // Initialize form validation
    initFormValidation();
    
    // Initialize social login buttons (would connect to actual services in a real app)
    initSocialLogin();
});

// Initialize authentication tabs
function initAuthTabs() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (!loginTab || !registerTab || !loginForm || !registerForm) return;
    
    // Switch to login tab
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });
    
    // Switch to register tab
    registerTab.addEventListener('click', function() {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });
}

// Initialize form validation
function initFormValidation() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form fields
            const email = document.getElementById('login-email');
            const password = document.getElementById('login-password');
            
            // Validate email and password
            let isValid = true;
            
            if (!validateEmail(email.value)) {
                highlightError(email, 'Please enter a valid email address');
                isValid = false;
            } else {
                removeHighlight(email);
            }
            
            if (password.value.length < 6) {
                highlightError(password, 'Password must be at least 6 characters');
                isValid = false;
            } else {
                removeHighlight(password);
            }
            
            // If valid, submit the form
            if (isValid) {
                // In a real app, this would send data to the server
                console.log('Login form submitted:', {
                    email: email.value,
                    password: password.value,
                    rememberMe: document.getElementById('remember-me').checked
                });
                
                // Simulate successful login
                simulateSuccessfulLogin();
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form fields
            const name = document.getElementById('register-name');
            const email = document.getElementById('register-email');
            const password = document.getElementById('register-password');
            const confirmPassword = document.getElementById('register-confirm-password');
            const termsAgreement = document.getElementById('terms-agreement');
            
            // Validate all fields
            let isValid = true;
            
            if (name.value.trim().length < 2) {
                highlightError(name, 'Please enter your full name');
                isValid = false;
            } else {
                removeHighlight(name);
            }
            
            if (!validateEmail(email.value)) {
                highlightError(email, 'Please enter a valid email address');
                isValid = false;
            } else {
                removeHighlight(email);
            }
            
            if (password.value.length < 6) {
                highlightError(password, 'Password must be at least 6 characters');
                isValid = false;
            } else {
                removeHighlight(password);
            }
            
            if (password.value !== confirmPassword.value) {
                highlightError(confirmPassword, 'Passwords do not match');
                isValid = false;
            } else {
                removeHighlight(confirmPassword);
            }
            
            if (!termsAgreement.checked) {
                highlightError(termsAgreement, 'You must agree to the terms');
                isValid = false;
            } else {
                removeHighlight(termsAgreement);
            }
            
            // If valid, submit the form
            if (isValid) {
                // In a real app, this would send data to the server
                console.log('Register form submitted:', {
                    name: name.value,
                    email: email.value,
                    password: password.value
                });
                
                // Simulate successful registration
                simulateSuccessfulRegistration();
            }
        });
    }
    
    // Helper function to validate email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Function to highlight error field
    function highlightError(element, message) {
        if (element.type === 'checkbox') {
            element.parentNode.classList.add('error-input');
        } else {
            element.classList.add('error-input');
        }
        
        // Add error message if it doesn't exist
        let errorMessage = element.parentNode.querySelector('.error-message');
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            element.parentNode.appendChild(errorMessage);
        }
        
        errorMessage.textContent = message;
    }
    
    // Function to remove highlight
    function removeHighlight(element) {
        if (element.type === 'checkbox') {
            element.parentNode.classList.remove('error-input');
        } else {
            element.classList.remove('error-input');
        }
        
        // Remove error message if it exists
        const errorMessage = element.parentNode.querySelector('.error-message');
        if (errorMessage) {
            element.parentNode.removeChild(errorMessage);
        }
    }
}

// Initialize social login buttons
function initSocialLogin() {
    const googleButtons = document.querySelectorAll('.social-btn.google');
    const facebookButtons = document.querySelectorAll('.social-btn.facebook');
    
    // Add click handlers to social login buttons
    googleButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Google login clicked');
            // In a real app, this would initiate OAuth with Google
            simulateSocialLogin('Google');
        });
    });
    
    facebookButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Facebook login clicked');
            // In a real app, this would initiate OAuth with Facebook
            simulateSocialLogin('Facebook');
        });
    });
}

// Simulate successful login
function simulateSuccessfulLogin() {
    showMessage('Login successful! Redirecting...', 'success');
    
    // In a real app, this would redirect after server authentication
    setTimeout(function() {
        window.location.href = 'index.html';
    }, 1500);
}

// Simulate successful registration
function simulateSuccessfulRegistration() {
    showMessage('Registration successful! Redirecting to login...', 'success');
    
    // In a real app, this would redirect after server registration
    setTimeout(function() {
        // Switch to login tab
        document.getElementById('login-tab').click();
        
        // Pre-fill email if available
        const registeredEmail = document.getElementById('register-email').value;
        if (registeredEmail) {
            document.getElementById('login-email').value = registeredEmail;
        }
        
        showMessage('Please log in with your new account', 'info');
    }, 1500);
}

// Simulate social login
function simulateSocialLogin(provider) {
    showMessage(`${provider} authentication successful! Redirecting...`, 'success');
    
    // In a real app, this would redirect after OAuth authentication
    setTimeout(function() {
        window.location.href = 'index.html';
    }, 1500);
}

// Show message to user
function showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `auth-message ${type}`;
    messageElement.textContent = message;
    
    // Add to auth container
    const authFormContainer = document.querySelector('.auth-form-container');
    if (authFormContainer) {
        authFormContainer.prepend(messageElement);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(function() {
        messageElement.classList.add('fade-out');
        setTimeout(function() {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 500); // Remove after fade out animation
    }, 5000);
} 