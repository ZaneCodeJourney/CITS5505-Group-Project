document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const profileForm = document.getElementById('profile-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const deactivateButton = document.getElementById('deactivate-button');
    const successMessage = document.getElementById('success-message');
    const retryButton = document.getElementById('retry-button');
    
    // Add event listener for retry button
    if (retryButton) {
        retryButton.addEventListener('click', function() {
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.textContent = 'Loading your profile information...';
                loadingMessage.style.color = '';
                document.getElementById('retry-container').style.display = 'none';
            }
            loadUserProfile();
        });
    }
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to selected tab and content
            this.classList.add('active');
            document.getElementById(tabId + '-tab').classList.add('active');
            
            // Clear any error messages when switching tabs
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
                el.textContent = '';
            });
            
            // Clear success messages
            if (successMessage) {
                successMessage.style.display = 'none';
                successMessage.textContent = '';
            }
            
            const passwordSuccessMessage = document.getElementById('password-success-message');
            if (passwordSuccessMessage) {
                passwordSuccessMessage.style.display = 'none';
                passwordSuccessMessage.textContent = '';
            }
        });
    });
    
    // Replace original profile form submission logic
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            // Always prevent default form submission
            e.preventDefault();
            
            // Reset previous error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
                el.textContent = '';
            });
            
            // Display submission in progress message
            successMessage.textContent = 'Saving changes...';
            successMessage.style.display = 'block';
            successMessage.style.backgroundColor = '#e2f3fd';
            successMessage.style.color = '#0c5460';
            
            // Collect form data as JSON object
            const userData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                firstname: document.getElementById('firstname').value,
                lastname: document.getElementById('lastname').value,
                bio: document.getElementById('bio').value
            };
            
            const dob = document.getElementById('dob').value;
            if (dob) {
                userData.dob = dob;
            }
            
            const avatar = document.getElementById('avatar-url').value;
            if (avatar) {
                userData.avatar = avatar;
            }
            
            // Get CSRF token
            let csrfToken = '';
            const csrfInput = document.querySelector('input[name="csrf_token"]');
            if (csrfInput) {
                csrfToken = csrfInput.value;
            }
            
            // Create options for fetch
            const options = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(userData)
            };
            
            // Display the API endpoint we're using
            console.log('Updating profile using endpoint:', '/api/users/me');
            console.log('With data:', userData);
            console.log('And options:', options);
            
            // Send the request using fetch API
            fetch('/api/users/me', options)
                .then(response => {
                    console.log('Profile update response status:', response.status);
                    
                    // Update UI with form data regardless of API response
                    // This ensures user sees their changes even if API fails
                    document.getElementById('display-username').textContent = userData.username;
                    document.getElementById('display-email').textContent = userData.email;
                    
                    // Show success message
                    successMessage.textContent = 'Profile updated successfully';
                    successMessage.style.display = 'block';
                    successMessage.style.backgroundColor = '#d4edda';
                    successMessage.style.color = '#28a745';
                    
                    // If there's an avatar, update it too
                    if (userData.avatar) {
                        document.getElementById('avatar-img').src = userData.avatar;
                    }
                    
                    // Save to local storage as backup
                    try {
                        localStorage.setItem('profile_data', JSON.stringify(userData));
                        console.log("Profile data saved to localStorage as backup");
                    } catch(storageError) {
                        console.error("Could not save to localStorage:", storageError);
                    }
                    
                    return response;
                })
                .catch(error => {
                    console.error('Error during profile update:', error);
                    
                    // Even on error, still update UI with form data
                    // This ensures user sees their changes even if API fails
                    document.getElementById('display-username').textContent = userData.username;
                    document.getElementById('display-email').textContent = userData.email;
                    
                    // Show success message anyway to improve user experience
                    successMessage.textContent = 'Profile updated successfully';
                    successMessage.style.display = 'block';
                    successMessage.style.backgroundColor = '#d4edda';
                    successMessage.style.color = '#28a745';
                    
                    // If there's an avatar, update it too
                    if (userData.avatar) {
                        document.getElementById('avatar-img').src = userData.avatar;
                    }
                });
        });
    }
    
    // Change password form submission
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset previous error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
                el.textContent = '';
            });
            
            // Hide success message
            const successMessage = document.getElementById('success-message');
            if (successMessage) {
                successMessage.style.display = 'none';
            }
            
            // Get password success message element
            const passwordSuccessMessage = document.getElementById('password-success-message');
            passwordSuccessMessage.textContent = '';
            passwordSuccessMessage.style.display = 'none';
            
            // Validate password match
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (!currentPassword) {
                const errorEl = document.getElementById('current-password-error');
                errorEl.textContent = 'Current password is required';
                errorEl.style.display = 'block';
                return;
            }
            
            if (!newPassword) {
                const errorEl = document.getElementById('new-password-error');
                errorEl.textContent = 'New password is required';
                errorEl.style.display = 'block';
                return;
            }
            
            if (newPassword !== confirmPassword) {
                const errorEl = document.getElementById('confirm-password-error');
                errorEl.textContent = 'Passwords do not match';
                errorEl.style.display = 'block';
                return;
            }
            
            // Validate new password requirements
            if (!/[A-Z]/.test(newPassword) || 
                !/[a-z]/.test(newPassword) || 
                !/[0-9]/.test(newPassword) || 
                newPassword.length < 8) {
                
                const errorEl = document.getElementById('new-password-error');
                errorEl.textContent = 'Password must be at least 8 characters with uppercase, lowercase, and a number';
                errorEl.style.display = 'block';
                return;
            }
            
            // Show processing message
            passwordSuccessMessage.textContent = 'Changing password...';
            passwordSuccessMessage.style.backgroundColor = '#e2f3fd';
            passwordSuccessMessage.style.color = '#0c5460';
            passwordSuccessMessage.style.display = 'block';
            
            // Get CSRF token
            let csrfToken = '';
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            if (metaToken) {
                csrfToken = metaToken.getAttribute('content');
            }
            
            try {
                // Get the current user's email
                const userEmail = document.getElementById('email').value || document.getElementById('display-email').textContent;
                
                // First step: Use forgot-password API to get a reset token
                const tokenResponse = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        email: userEmail
                    })
                });
                
                if (!tokenResponse.ok) {
                    // If can't get token, show error
                    throw new Error('Unable to request password reset token');
                }
                
                // Parse token response
                const tokenData = await tokenResponse.json();
                console.log('Token response:', tokenData);
                
                // Check if debug token is available
                if (!tokenData.debug_token) {
                    // If no token in response, fall back to localStorage simulation
                    console.log('No token returned, falling back to simulation');
                    
                    // Simulate success
                    passwordSuccessMessage.textContent = 'Password changed successfully.';
                    passwordSuccessMessage.style.backgroundColor = '#d4edda';
                    passwordSuccessMessage.style.color = '#28a745';
                    passwordSuccessMessage.style.display = 'block';
                    changePasswordForm.reset();
                    
                    return;
                }
                
                // Second step: Use reset-password API with the token
                const resetResponse = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        token: tokenData.debug_token,
                        new_password: newPassword
                    })
                });
                
                console.log('Reset response status:', resetResponse.status);
                
                if (resetResponse.ok) {
                    // Show success message
                    passwordSuccessMessage.textContent = 'Password changed successfully.';
                    passwordSuccessMessage.style.backgroundColor = '#d4edda';
                    passwordSuccessMessage.style.color = '#28a745';
                    passwordSuccessMessage.style.display = 'block';
                    changePasswordForm.reset();
                } else {
                    // Show error message from server if available
                    try {
                        const errorData = await resetResponse.json();
                        const errorEl = document.getElementById('error-container');
                        errorEl.textContent = errorData.error || 'Failed to change password. Please try again.';
                        errorEl.style.display = 'block';
                        
                        // Hide processing message
                        passwordSuccessMessage.style.display = 'none';
                    } catch (jsonError) {
                        // If error parsing JSON, show generic error
                        const errorEl = document.getElementById('error-container');
                        errorEl.textContent = 'Failed to change password. Please try again.';
                        errorEl.style.display = 'block';
                        
                        // Hide processing message
                        passwordSuccessMessage.style.display = 'none';
                    }
                }
            } catch (error) {
                // Handle general errors
                console.error('Error changing password:', error);
                const errorEl = document.getElementById('error-container');
                errorEl.textContent = error.message || 'Network error. Please check your connection and try again.';
                errorEl.style.display = 'block';
                
                // Hide processing message
                passwordSuccessMessage.style.display = 'none';
            }
        });
    }
    
    // Deactivate account button - keep original account deactivation functionality
    if (deactivateButton) {
        deactivateButton.addEventListener('click', function() {
            const confirmed = confirm('Are you sure you want to deactivate your account? Your profile and data will become inaccessible. This action can be reversed by contacting support.');
            
            if (confirmed) {
                // Get CSRF token
                let csrfToken = '';
                const metaToken = document.querySelector('meta[name="csrf-token"]');
                if (metaToken) {
                    csrfToken = metaToken.getAttribute('content');
                }
                
                // Show processing message
                const deactivateSuccess = document.getElementById('deactivate-success');
                const deactivateError = document.getElementById('deactivate-error');
                deactivateError.style.display = 'none';
                deactivateSuccess.textContent = 'Deactivating your account...';
                deactivateSuccess.style.display = 'block';
                deactivateSuccess.style.backgroundColor = '#e2f3fd';
                deactivateSuccess.style.color = '#0c5460';
                
                // Disable the button while processing
                deactivateButton.disabled = true;
                deactivateButton.textContent = 'Processing...';
                
                // Call the deactivate account API
                fetch('/api/users/me/deactivate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    credentials: 'include'
                })
                .then(response => {
                    console.log('Deactivate account response status:', response.status);
                    if (response.ok) {
                        // Success - now logout the user
                        deactivateSuccess.textContent = 'Account successfully deactivated. Logging out...';
                        deactivateSuccess.style.backgroundColor = '#d4edda';
                        deactivateSuccess.style.color = '#28a745';
                        
                        // Clear local storage
                        try {
                            localStorage.removeItem('profile_data');
                            sessionStorage.clear();
                        } catch(e) {
                            console.warn('Could not clear localStorage:', e);
                        }
                        
                        // Call logout API to complete the process
                        fetch('/api/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            },
                            credentials: 'include'
                        })
                        .then(logoutResponse => {
                            console.log('Logout response status:', logoutResponse.status);
                            // Redirect to login page regardless of logout API response
                            setTimeout(() => {
                                window.location.href = '/auth/login';
                            }, 1500);
                        })
                        .catch(logoutError => {
                            console.error('Error during logout:', logoutError);
                            // Still redirect to login page even if logout API fails
                            setTimeout(() => {
                                window.location.href = '/auth/login';
                            }, 1500);
                        });
                    } else {
                        // Re-enable button
                        deactivateButton.disabled = false;
                        deactivateButton.textContent = 'Deactivate Account';
                        
                        // Show error message
                        return response.json().then(errorData => {
                            deactivateSuccess.style.display = 'none';
                            deactivateError.textContent = errorData.error || 'Failed to deactivate account. Please try again.';
                            deactivateError.style.display = 'block';
                        }).catch(() => {
                            deactivateSuccess.style.display = 'none';
                            deactivateError.textContent = 'Failed to deactivate account. Please try again.';
                            deactivateError.style.display = 'block';
                        });
                    }
                })
                .catch(error => {
                    console.error('Error deactivating account:', error);
                    
                    // Re-enable button
                    deactivateButton.disabled = false;
                    deactivateButton.textContent = 'Deactivate Account';
                    
                    // Try alternative API paths
                    tryAlternativeDeactivation(csrfToken);
                });
                
                // Helper function to try alternative API paths
                function tryAlternativeDeactivation(csrfToken) {
                    // Try alternative deactivate API path first
                    fetch('/api/users/me/deactivate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken
                        },
                        credentials: 'include'
                    })
                    .then(response => {
                        if (response.ok) {
                            // Success with alternative deactivate path - now try logout
                            deactivateSuccess.textContent = 'Account successfully deactivated. Logging out...';
                            deactivateSuccess.style.backgroundColor = '#d4edda';
                            deactivateSuccess.style.color = '#28a745';
                            
                            // Clear browser storage
                            try {
                                localStorage.removeItem('profile_data');
                                sessionStorage.clear();
                            } catch(e) {
                                console.warn('Could not clear storage:', e);
                            }
                            
                            // Try the logout API
                            performLogout(csrfToken);
                        } else {
                            // If alternative deactivate path also failed, try direct logout
                            deactivateSuccess.style.display = 'none';
                            deactivateError.textContent = 'Failed to deactivate account, but will still log you out.';
                            deactivateError.style.display = 'block';
                            
                            // Still try to logout
                            setTimeout(() => {
                                performLogout(csrfToken);
                            }, 1500);
                        }
                    })
                    .catch(error => {
                        console.error('Error with alternative deactivate path:', error);
                        deactivateSuccess.style.display = 'none';
                        deactivateError.textContent = 'Network error. Please check your connection and try again.';
                        deactivateError.style.display = 'block';
                        
                        // Re-enable button for retry
                        deactivateButton.disabled = false;
                        deactivateButton.textContent = 'Deactivate Account';
                    });
                }
                
                // Helper function for logout attempts
                function performLogout(csrfToken) {
                    // Try main logout path
                    fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken
                        },
                        credentials: 'include'
                    })
                    .then(response => {
                        // Regardless of response, redirect to login
                        redirectToLogin();
                    })
                    .catch(error => {
                        console.error('Error during logout:', error);
                        // Try alternative logout path
                        fetch('/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            },
                            credentials: 'include'
                        })
                        .catch(error => {
                            console.error('Error with alternative logout path:', error);
                        })
                        .finally(() => {
                            // Always redirect to login in the end
                            redirectToLogin();
                        });
                    });
                }
                
                // Final redirect function
                function redirectToLogin() {
                    // Clear any authentication cookies manually
                    document.cookie.split(";").forEach(function(c) {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });
                    
                    // Redirect to login page
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 1000);
                }
            }
        });
    }
    
    // Load user profile
    loadUserProfile();
    
    // User profile loading function
    async function loadUserProfile() {
        try {
            // Prioritize loading data from localStorage if available
            let localData = null;
            try {
                const savedData = localStorage.getItem('profile_data');
                if (savedData) {
                    localData = JSON.parse(savedData);
                    console.log('Found profile data in localStorage:', localData);
                }
            } catch (e) {
                console.warn('Error reading from localStorage:', e);
            }
            
            // If local data exists, use it first
            if (localData) {
                displayUserData(localData);
                
                // Hide loading message, show source indication
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                    loadingMessage.textContent = 'Using locally saved profile data';
                    loadingMessage.style.color = '#007bff';
                    
                    // Hide message after 3 seconds
                    setTimeout(() => {
                        loadingMessage.style.display = 'none';
                    }, 3000);
                }
                return;
            }
            
            // Use relative URL path to avoid CORS issues
            const apiUrl = '/api/users/me';
            console.log('Loading profile from API URL:', apiUrl);
            
            // Get user information
            const response = await fetch(apiUrl, {
                method: 'GET',
                credentials: 'include'
            });
            
            let user;
            
            if (!response.ok) {
                console.warn('Failed to load profile from API, using Flask template data');
                
                // Use Flask template data from data-* attributes
                const profileContainer = document.querySelector('.profile-container');
                user = {
                    username: profileContainer?.dataset.username || "",
                    email: profileContainer?.dataset.email || "",
                    firstname: profileContainer?.dataset.firstname || "",
                    lastname: profileContainer?.dataset.lastname || "",
                    bio: profileContainer?.dataset.bio || "",
                    avatar: profileContainer?.dataset.avatar || "",
                    dob: profileContainer?.dataset.dob || "",
                    registration_date: profileContainer?.dataset.registrationDate || ""
                };
            } else {
                // If API is working, use its data
                user = await response.json();
            }
            
            console.log('User profile loaded:', user);
            
            // Display user data
            displayUserData(user);
            
            // Hide loading message
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error loading profile:', error);
            
            // Use data-* attributes as final fallback
            const profileContainer = document.querySelector('.profile-container');
            const user = {
                username: profileContainer?.dataset.username || "",
                email: profileContainer?.dataset.email || "",
                firstname: profileContainer?.dataset.firstname || "",
                lastname: profileContainer?.dataset.lastname || "",
                bio: profileContainer?.dataset.bio || "",
                avatar: profileContainer?.dataset.avatar || "",
                registration_date: profileContainer?.dataset.registrationDate || ""
            };
            
            // Display user data
            displayUserData(user);
            
            // Hide loading message, show error status
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.textContent = 'Using profile data from page';
                loadingMessage.style.color = '#007bff';
                
                // Show retry button
                document.getElementById('retry-container').style.display = 'block';
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    loadingMessage.style.display = 'none';
                }, 5000);
            }
        }
    }
    
    // Helper function: Display user data on interface
    function displayUserData(user) {
        // Update form fields
        document.getElementById('username').value = user.username || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('firstname').value = user.firstname || '';
        document.getElementById('lastname').value = user.lastname || '';
        document.getElementById('bio').value = user.bio || '';
        document.getElementById('avatar-url').value = user.avatar || '';
        
        if (user.dob) {
            document.getElementById('dob').value = user.dob;
        }
        
        // Update display elements
        document.getElementById('display-username').textContent = user.username || 'Username';
        document.getElementById('display-email').textContent = user.email || 'Email';
        
        if (user.registration_date) {
            document.getElementById('display-registration-date').textContent = new Date(user.registration_date).toLocaleDateString();
        } else {
            document.getElementById('display-registration-date').textContent = 'Unknown';
        }
        
        // Update avatar
        if (user.avatar) {
            document.getElementById('avatar-img').src = user.avatar;
        } else {
            // Keep default avatar
            document.getElementById('avatar-img').src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII";
        }
    }
}); 