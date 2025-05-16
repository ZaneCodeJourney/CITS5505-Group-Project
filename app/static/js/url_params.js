/**
 * URL Parameter Handler
 * Handles URL parameters and triggers appropriate actions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Process URL parameters when page loads
    processUrlParameters();
});

/**
 * Process URL parameters and trigger appropriate actions
 */
function processUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle success parameters
    processSuccessParams(urlParams);
    
    // Handle error parameters
    processErrorParams(urlParams);
    
    // Clean URL by removing processed parameters
    if (urlParams.has('success') || urlParams.has('error')) {
        history.replaceState(null, '', window.location.pathname);
    }
}

/**
 * Process success parameters from URL
 * @param {URLSearchParams} urlParams - URL parameters object
 */
function processSuccessParams(urlParams) {
    const success = urlParams.get('success');
    
    if (!success) return;
    
    // Define success messages based on parameter values
    const successMessages = {
        'dive_created': 'Dive log created successfully!',
        'dive_created_with_profile': 'Dive log created successfully with dive profile data!',
        'dive_updated': 'Dive log updated successfully!',
        'dive_deleted': 'Dive log deleted successfully!',
        'dive_shared': 'Dive log shared successfully!',
        'profile_updated': 'Profile updated successfully!'
    };
    
    // If we have a predefined message for this success parameter
    if (successMessages[success]) {
        showSuccessMessage(successMessages[success]);
    }
}

/**
 * Process error parameters from URL
 * @param {URLSearchParams} urlParams - URL parameters object
 */
function processErrorParams(urlParams) {
    const error = urlParams.get('error');
    
    if (!error) return;
    
    // Define error messages based on parameter values
    const errorMessages = {
        'permission_denied': 'You do not have permission to perform this action.',
        'not_found': 'The requested resource was not found.',
        'invalid_data': 'The provided data is invalid.',
        'server_error': 'An error occurred on the server. Please try again later.'
    };
    
    // If we have a predefined message for this error parameter
    if (errorMessages[error]) {
        showErrorMessage(errorMessages[error]);
    }
} 