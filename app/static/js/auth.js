/**
 * Authentication related functionality
 *
 * This file contains functions for handling user authentication
 */

// Execute when document is ready
$(document).ready(function() {
    // Check authentication status on every page load
    checkAuthStatus();
});

/**
 * Check if user is authenticated and update UI accordingly
 */

function checkAuthStatus() {
    // Try to get auth token from storage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (token) {
        // If token exists, check if it's valid
        validateToken(token);
    } else {
        // If no token, update UI to show logged-out state
        updateAuthUI(false);
    }
}


/**
 * Validate authentication token with the server
 * @param {string} token - The authentication token
 */
function validateToken(token) {
    // In a real application, you would make an API call to validate the token
    $.ajax({
        url: '/api/auth/validate',  // Replace with your actual endpoint
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            // If validation successful
            if (response.status === 'success') {
                updateAuthUI(true);
            } else {
                // If validation failed, clear tokens and update UI
                logout();
            }
        },
        error: function() {
            // On error, assume token is invalid
            logout();
        }
    });

    // For development without a backend, you can use this instead:
    // updateAuthUI(true);
}

/**
 * Update the UI based on authentication status
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 */
function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        // Show authenticated UI elements
        $('.auth-item').addClass('d-none');
        $('#profile-nav-item').removeClass('d-none');
    } else {
        // Show non-authenticated UI elements
        $('.auth-item').removeClass('d-none');
        $('#profile-nav-item').addClass('d-none');
    }
}

/**
 * Log the user out
 */
function logout() {
    // Clear authentication data
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    // Update UI
    updateAuthUI(false);

    // Redirect to home page if on a protected page
    const protectedPages = ['/profile', '/dashboard', '/settings'];
    const currentPath = window.location.pathname;

    if (protectedPages.some(page => currentPath.includes(page))) {
        window.location.href = '/';
    }
}

/**
 * Initialize logout button click handler
 */
function initLogoutButton() {
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();

        // In a real application, you would make an API call to invalidate the token
        $.ajax({
            url: '/api/auth/logout',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))
            },
            success: function() {
                logout();
            },
            error: function() {
                // Even on error, perform local logout
                logout();
            }
        });
    });
}

/**
 * Data Visualization Helpers
 */

/**
 * Create a responsive line chart
 * @param {string} selector - Canvas element selector
 * @param {Array} labels - X-axis labels
 * @param {Array} data - Y-axis data
 * @param {string} label - Dataset label
 * @param {Object} options - Additional chart options
 */
function createLineChart(selector, labels, data, label, options = {}) {
    const ctx = document.querySelector(selector).getContext('2d');

    // Set default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    borderDash: [3, 3]
                }
            }
        }
    };

    // Merge options
    const chartOptions = {...defaultOptions, ...options};

    // Create chart
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                fill: true,
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4
            }]
        },
        options: chartOptions
    });
}

/**
 * Create a responsive bar chart
 * @param {string} selector - Canvas element selector
 * @param {Array} labels - X-axis labels
 * @param {Array} data - Y-axis data
 * @param {string} label - Dataset label
 * @param {Object} options - Additional chart options
 */
function createBarChart(selector, labels, data, label, options = {}) {
    const ctx = document.querySelector(selector).getContext('2d');

    // Set default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    borderDash: [3, 3]
                }
            }
        }
    };

    // Merge options
    const chartOptions = {...defaultOptions, ...options};

    // Create chart
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: chartOptions
    });
}

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {boolean} True if password meets requirements
 */
function isValidPassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if email format is valid
 */
function isValidEmail(email) {
    const pattern = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    return pattern.test(email);
}

/**
 * Handle form validation
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} True if form is valid
 */
function validateForm(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

/**
 * Get auth token from storage
 * @returns {string|null} The auth token or null if not found
 */
function getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function handleApiError(errorAlert, error) {
    let errorMessage = 'An unknown error occurred. Please try again later.';

    if (error.responseJSON && error.responseJSON.error) {
        errorMessage = error.responseJSON.error;
    } else if (error.statusText) {
        errorMessage = `Error: ${error.statusText}`;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    $(errorAlert).text(errorMessage).removeClass('d-none');
}

/**
 * Show success message and reset form
 * @param {HTMLElement} form - The form to reset
 * @param {HTMLElement} successAlert - The success alert element
 */
function showSuccess(form, successAlert) {
    form.reset();
    form.classList.remove('was-validated');
    $(successAlert).removeClass('d-none');

    // Hide success message after 5 seconds
    setTimeout(() => {
        $(successAlert).addClass('d-none');
    }, 5000);
}

/**
 * Initialize change password functionality
 */
function initChangePassword() {
    const form = document.getElementById('password-change-form');
    const successAlert = document.getElementById('password-success-alert');
    const errorAlert = document.getElementById('password-error-alert');

    if (!form) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Hide previous alerts
        $(successAlert).addClass('d-none');
        $(errorAlert).addClass('d-none');

        // Validate form
        if (!validateForm(this)) return;

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Check password strength
        if (!isValidPassword(newPassword)) {
            $(errorAlert).text('New password does not meet strength requirements. Password must be at least 8 characters long and include uppercase, lowercase letters, and numbers.').removeClass('d-none');
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            $(errorAlert).text('New password and confirmation do not match.').removeClass('d-none');
            return;
        }

        // Get auth token
        const token = getAuthToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // API call to change password
        $.ajax({
            url: '/api/users/me/change-password',
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            }),
            success: function(response) {
                showSuccess(form, successAlert);
            },
            error: function(xhr) {
                handleApiError(errorAlert, xhr);
            }
        });
    });
}

/**
 * Initialize change email functionality
 */
function initChangeEmail() {
    const form = document.getElementById('email-change-form');
    const successAlert = document.getElementById('email-success-alert');
    const errorAlert = document.getElementById('email-error-alert');
    const currentEmail = document.getElementById('current-email');

    if (!form) return;

    // Fetch and display current email
    const token = getAuthToken();
    if (token) {
        $.ajax({
            url: '/api/users/me',
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(response) {
                if (response.status === 'success' && response.data && response.data.email) {
                    currentEmail.value = response.data.email;
                }
            }
        });
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Hide previous alerts
        $(successAlert).addClass('d-none');
        $(errorAlert).addClass('d-none');

        // Validate form
        if (!validateForm(this)) return;

        const newEmail = document.getElementById('new-email').value;
        const password = document.getElementById('email-password').value;

        // Validate email format
        if (!isValidEmail(newEmail)) {
            $(errorAlert).text('Please enter a valid email address format.').removeClass('d-none');
            return;
        }

        // Check if new email is same as current
        if (newEmail === currentEmail.value) {
            $(errorAlert).text('New email address is the same as the current one.').removeClass('d-none');
            return;
        }

        // Get auth token
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // API call to change email
        $.ajax({
            url: '/api/users/me/change-email',
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                new_email: newEmail,
                password: password
            }),
            success: function(response) {
                showSuccess(form, successAlert);
                // Update displayed current email
                currentEmail.value = newEmail;
            },
            error: function(xhr) {
                handleApiError(errorAlert, xhr);
            }
        });
    });
}

/**
 * Initialize close account functionality
 */
function initCloseAccount() {
    const form = document.getElementById('close-account-form');
    const successAlert = document.getElementById('close-success-alert');
    const errorAlert = document.getElementById('close-error-alert');

    if (!form) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Hide previous alerts
        $(successAlert).addClass('d-none');
        $(errorAlert).addClass('d-none');

        // Validate form
        if (!validateForm(this)) return;

        const password = document.getElementById('close-password').value;
        const dataPreference = document.querySelector('input[name="data_preference"]:checked').value;
        const confirmed = document.getElementById('confirm-close').checked;

        if (!confirmed) {
            $(errorAlert).text('You must confirm this action.').removeClass('d-none');
            return;
        }

        // Get auth token
        const token = getAuthToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Confirm with a modal dialog
        if (confirm('Are you sure you want to permanently close your account? This action cannot be undone.')) {
            // API call to close account
            $.ajax({
                url: '/api/users/me/deactivate',
                type: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    password: password,
                    data_preference: dataPreference
                }),
                success: function(response) {
                    showSuccess(form, successAlert);

                    // Remove auth tokens
                    localStorage.removeItem('auth_token');
                    sessionStorage.removeItem('auth_token');

                    // Redirect to home page after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                },
                error: function(xhr) {
                    handleApiError(errorAlert, xhr);
                }
            });
        }
    });
}

/**
 * Initialize all account management forms when document is ready
 */
$(document).ready(function() {
    // Initialize change password functionality
    initChangePassword();

    // Initialize change email functionality
    initChangeEmail();

    // Initialize close account functionality
    initCloseAccount();


    $('.public-profile-btn').on('click', function(e) {
        e.preventDefault();
        $('#profile-tab').tab('show');
    });

});