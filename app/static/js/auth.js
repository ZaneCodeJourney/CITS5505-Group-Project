// Common authentication functionality
async function apiRequest(url, method = 'POST', data = null) {
    // Get CSRF token from meta tag
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
    
    return response.json();
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function isStrongPassword(password) {
    return password.length >= 8;
}

// Show error message helper
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Hide error message helper
function hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// Show success message helper
function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
} 