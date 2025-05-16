document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset previous error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
        
        try {
            // Prepare login data
            const loginData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                remember: document.getElementById('remember').checked
            };
            
            // Send login request
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'same-origin',
                body: JSON.stringify(loginData)
            });
            
            if (!response.ok) {
                let errorText = await response.text();
                try {
                    // Try to parse as JSON
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
                } catch (e) {
                    // If not JSON or other error
                    if (e instanceof SyntaxError) {
                        throw new Error(`HTTP error ${response.status}: ${errorText}`);
                    } else {
                        throw e;
                    }
                }
            }
            
            const data = await response.json();
            
            // Success - redirect to homepage or dashboard
            window.location.href = '/';
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific errors
            if (error.message.includes('Invalid email or password')) {
                const errorEl = document.getElementById('email-error');
                errorEl.textContent = 'Invalid email or password';
                errorEl.style.display = 'block';
            } else if (error.message.includes('Account is deactivated')) {
                const errorEl = document.getElementById('email-error');
                errorEl.textContent = 'This account has been deactivated';
                errorEl.style.display = 'block';
            } else {
                alert('Login error: ' + error.message);
            }
        }
    });
}); 