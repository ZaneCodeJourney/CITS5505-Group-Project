document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reset-password-form');
    const successMessage = document.getElementById('success-message');
    const errorContainer = document.getElementById('error-container');
    
    // Get token parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        // No token provided
        form.style.display = 'none';
        errorContainer.textContent = 'Invalid or missing password reset token. Please request a new password reset link.';
        errorContainer.style.display = 'block';
        return;
    }
    
    // Set token to hidden field
    document.getElementById('token').value = token;
    
    // Password validation function
    function isValidPassword(password) {
        // At least 8 characters
        if (password.length < 8) return false;
        // Contains at least one uppercase letter
        if (!/[A-Z]/.test(password)) return false;
        // Contains at least one lowercase letter
        if (!/[a-z]/.test(password)) return false;
        // Contains at least one number
        if (!/[0-9]/.test(password)) return false;
        
        return true;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset previous error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
        successMessage.style.display = 'none';
        successMessage.textContent = '';
        
        // Get passwords
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Frontend password validation
        if (!isValidPassword(newPassword)) {
            const errorEl = document.getElementById('password-error');
            errorEl.textContent = 'Password must be at least 8 characters, with uppercase, lowercase, and number';
            errorEl.style.display = 'block';
            return;
        }
        
        // Validate password match
        if (newPassword !== confirmPassword) {
            const errorEl = document.getElementById('confirm-password-error');
            errorEl.textContent = 'Passwords do not match';
            errorEl.style.display = 'block';
            return;
        }
        
        // Show processing message
        errorContainer.textContent = 'Resetting password...';
        errorContainer.style.display = 'block';
        errorContainer.style.color = '#0c5460';
        errorContainer.style.backgroundColor = '#d1ecf1';
        errorContainer.style.padding = '0.75rem';
        errorContainer.style.borderRadius = '4px';
        
        try {
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const tokenValue = document.getElementById('token').value;
            
            // Log request data for debugging
            const requestData = {
                token: tokenValue,
                new_password: newPassword
            };
            console.log('Data being sent to API:', requestData);
            
            // Call reset password API
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'same-origin',
                body: JSON.stringify(requestData)
            });
            
            console.log('API response status:', response.status);
            
            // Handle response
            if (response.ok) {
                // Success
                form.style.display = 'none';
                errorContainer.style.display = 'none';
                successMessage.textContent = 'Password reset successful! You can now log in with your new password.';
                successMessage.style.display = 'block';
                
                // Redirect to login page after 3 seconds
                setTimeout(function() {
                    window.location.href = '/auth/login';
                }, 3000);
            } else {
                // Display error message from server
                try {
                    const errorData = await response.json();
                    console.log('API error response:', errorData);
                    errorContainer.textContent = errorData.error || 'Error resetting password. Please try again.';
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                    errorContainer.textContent = 'Error resetting password. Please try again.';
                }
                
                errorContainer.style.display = 'block';
                errorContainer.style.color = '#721c24';
                errorContainer.style.backgroundColor = '#f8d7da';
            }
        } catch (error) {
            console.error('Error during password reset:', error);
            errorContainer.textContent = 'Network error. Please check your connection and try again.';
            errorContainer.style.display = 'block';
            errorContainer.style.color = '#721c24';
            errorContainer.style.backgroundColor = '#f8d7da';
        }
    });
}); 