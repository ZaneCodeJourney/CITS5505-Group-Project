document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgot-password-form');
    const successMessage = document.getElementById('success-message');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset previous messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
        successMessage.style.display = 'none';
        successMessage.textContent = '';
        
        // Simple client-side validation
        const email = document.getElementById('email').value;
        if (!email) {
            const errorEl = document.getElementById('email-error');
            errorEl.textContent = 'Email is required';
            errorEl.style.display = 'block';
            return;
        }
        
        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            // Send request to forgot password API
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'same-origin',
                body: JSON.stringify({ email: email })
            });
            
            console.log('Forgot password response status:', response.status);
            
            // Always show success message for security reasons
            form.style.display = 'none';
            successMessage.textContent = 'A link to reset your password has been sent to your email address!';
            successMessage.style.display = 'block';
            
            // Log API response for debugging purposes only
            if (response.ok) {
                try {
                    const data = await response.json();
                    console.log('API response:', data);
                    
                    if (data.debug_token && data.debug_url) {
                        console.log('Reset token received:', data.debug_token);
                        console.log('Reset URL:', data.debug_url);
                        // No redirection - just log the information
                    }
                } catch (jsonError) {
                    console.error('Error parsing API response:', jsonError);
                }
            }
        } catch (error) {
            console.error('Error sending password reset request:', error);
            
            // Still show success message even if API call fails
            form.style.display = 'none';
            successMessage.textContent = 'A link to reset your password has been sent to your email address!';
            successMessage.style.display = 'block';
        }
    });
}); 