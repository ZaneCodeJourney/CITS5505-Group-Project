/**
 * UI Events and Notifications Manager
 * Handles common UI interactions and notifications across the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all UI event handlers
    initCloseButtons();
    initSuccessMessages();
});

/**
 * Initialize close buttons across the application
 * This handles any element with a close button that should hide its parent
 */
function initCloseButtons() {
    const closeButtons = document.querySelectorAll('.close-button, [data-action="close"]');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Find the parent element to hide
            const target = this.closest('.closable') || this.parentElement;
            if (target) {
                target.style.display = 'none';
            }
        });
    });
}

/**
 * Initialize success message handling
 */
function initSuccessMessages() {
    // Auto-hide success messages after 5 seconds
    const successMessages = document.querySelectorAll('.success-message');
    successMessages.forEach(message => {
        if (message.style.display !== 'none') {
            setTimeout(() => {
                message.style.display = 'none';
            }, 5000);
        }
    });
}

/**
 * Show a success message to the user
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the message in milliseconds (default: 5000)
 */
function showSuccessMessage(message, duration = 5000) {
    const successMessageElement = document.getElementById('js-success-message');
    const successTextElement = document.getElementById('js-success-text');
    
    if (successMessageElement && successTextElement) {
        successTextElement.textContent = message;
        successMessageElement.style.display = 'flex';
        
        // Auto-hide after duration
        setTimeout(() => {
            successMessageElement.style.display = 'none';
        }, duration);
    }
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to display
 * @param {number} duration - How long to show the message in milliseconds (default: 5000)
 */
function showErrorMessage(message, duration = 5000) {
    const errorMessageElement = document.getElementById('js-error-message');
    const errorTextElement = document.getElementById('js-error-text');
    
    if (errorMessageElement && errorTextElement) {
        errorTextElement.textContent = message;
        errorMessageElement.style.display = 'flex';
        
        // Auto-hide after duration
        setTimeout(() => {
            errorMessageElement.style.display = 'none';
        }, duration);
    }
} 