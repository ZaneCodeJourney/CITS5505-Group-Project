document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registration-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset previous error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
        
        // Validate form
        let isValid = true;
        
        // Validate password match
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            const errorEl = document.getElementById('confirm-password-error');
            errorEl.textContent = 'Passwords do not match';
            errorEl.style.display = 'block';
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        try {
            // Prepare registration data
            const registrationData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                password: password,
                firstname: document.getElementById('firstname').value,
                lastname: document.getElementById('lastname').value,
                bio: '',
            };
            
            // Add dob only if it has a value
            const dob = document.getElementById('dob').value;
            if (dob) {
                registrationData.dob = dob;
            }
            
            // Use the centralized API request function
            const data = await apiRequest('/api/auth/register', 'POST', registrationData);
            
            // Success - redirect to login page
            alert('Registration successful! You can now log in.');
            window.location.href = '/auth/login';
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific errors
            const errorMessage = error.message;
            if (errorMessage.includes('Username already exists')) {
                const errorEl = document.getElementById('username-error');
                errorEl.textContent = 'Username already exists';
                errorEl.style.display = 'block';
            } else if (errorMessage.includes('Email already registered')) {
                const errorEl = document.getElementById('email-error');
                errorEl.textContent = 'Email already registered';
                errorEl.style.display = 'block';
            } else if (errorMessage.includes('Password must be')) {
                const errorEl = document.getElementById('password-error');
                errorEl.textContent = 'Password must meet all requirements';
                errorEl.style.display = 'block';
            } else if (errorMessage.includes('Invalid email')) {
                const errorEl = document.getElementById('email-error');
                errorEl.textContent = 'Invalid email format';
                errorEl.style.display = 'block';
            } else {
                alert('Registration error: ' + errorMessage);
            }
        }
    });
});

// Helper function for API requests
async function apiRequest(url, method = 'GET', data = null) {
    // Get CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        credentials: 'same-origin'
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
        let errorMessage = 'API request failed';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || `Error: ${response.status}`;
        } catch (e) {
            errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    return await response.json();
} 