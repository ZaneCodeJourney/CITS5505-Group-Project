/**
 * CSRF Handler - Centralized CSRF token management for API requests
 */

// Store the CSRF token
let csrfToken = null;

/**
 * Fetch CSRF token from the server
 * @returns {Promise<string>} The CSRF token
 */
async function getCsrfToken() {
    // Return cached token if available
    if (csrfToken) {
        return csrfToken;
    }
    
    try {
        // First try to get the token from the meta tag (works in both production and debug)
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            csrfToken = metaToken.getAttribute('content');
            return csrfToken;
        }
        
        // Fallback to the dev endpoint if meta tag is not available
        const response = await fetch('/dev/get-csrf-token', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get CSRF token: ${response.status}`);
        }
        
        const data = await response.json();
        csrfToken = data.csrf_token;
        return csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    }
}

/**
 * Send a JSON request with CSRF protection
 * @param {string} url - The API endpoint URL
 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} [data=null] - The data to send (will be converted to JSON)
 * @returns {Promise<Object>} The response data
 */
async function apiRequest(url, method, data = null) {
    try {
        // Get CSRF token
        const token = await getCsrfToken();
        
        // Prepare request headers
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': token
        };
        
        // Prepare request options
        const options = {
            method: method,
            headers: headers,
            credentials: 'include'
        };
        
        // Add body for non-GET requests
        if (method !== 'GET' && data !== null) {
            options.body = JSON.stringify(data);
        }
        
        // Send the request
        const response = await fetch(url, options);
        
        // Parse response
        const responseData = await response.json().catch(() => null);
        
        // Handle error responses
        if (!response.ok) {
            const errorMessage = responseData && responseData.error 
                ? responseData.error 
                : `Request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }
        
        return responseData;
    } catch (error) {
        console.error(`API ${method} request to ${url} failed:`, error);
        throw error;
    }
}

/**
 * Upload a file with CSRF protection
 * @param {string} url - The API endpoint URL
 * @param {FormData} formData - The FormData object with files and data
 * @returns {Promise<Object>} The response data
 */
async function uploadFile(url, formData) {
    try {
        // Get CSRF token
        const token = await getCsrfToken();
        
        // Add CSRF token to the form data
        formData.append('csrf_token', token);
        
        // Send the request
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': token
            },
            credentials: 'include',
            body: formData
        });
        
        // Parse response
        const responseData = await response.json().catch(() => null);
        
        // Handle error responses
        if (!response.ok) {
            const errorMessage = responseData && responseData.error 
                ? responseData.error 
                : `File upload failed with status ${response.status}`;
            throw new Error(errorMessage);
        }
        
        return responseData;
    } catch (error) {
        console.error(`File upload to ${url} failed:`, error);
        throw error;
    }
} 