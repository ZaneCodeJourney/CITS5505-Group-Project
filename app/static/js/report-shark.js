/**
 * JavaScript file for the report shark sighting page
 */

// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const reportForm = document.getElementById('report-form');
    const siteSelect = document.getElementById('site-id');
    const photoInput = document.getElementById('photo');
    const fileNameSpan = document.getElementById('file-name');
    const alertContainer = document.getElementById('alert-container');
    const successModal = document.getElementById('success-modal');
    const resetButton = document.getElementById('reset-button');

    // Initialize page
    init();

    /**
     * Initialization function
     */
    function init() {
        // Load dive sites list
        loadDiveSites();

        // Set default sighting time to current time if field is empty
        const sightingTimeField = document.getElementById('sighting-time');
        if (sightingTimeField && !sightingTimeField.value) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Fix timezone issue
            const formattedNow = now.toISOString().slice(0, 16);
            sightingTimeField.value = formattedNow;
        }

        // Add file upload event listener
        if (photoInput && fileNameSpan) {
            photoInput.addEventListener('change', function() {
                if (photoInput.files.length > 0) {
                    let fileName = photoInput.files[0].name;
                    // Truncate long filenames
                    if (fileName.length > 25) {
                        fileName = fileName.substr(0, 22) + '...';
                    }
                    fileNameSpan.textContent = fileName;
                } else {
                    fileNameSpan.textContent = 'No file chosen';
                }
            });
        }

        // Add reset button event listener
        if (resetButton) {
            resetButton.addEventListener('click', function(e) {
                console.log('Reset button clicked');
                e.preventDefault();
                if (reportForm) {
                    reportForm.reset();
                    if (fileNameSpan) {
                        fileNameSpan.textContent = 'No file chosen';
                    }
                    
                    // Reset time to current time
                    if (sightingTimeField) {
                        const now = new Date();
                        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                        const formattedNow = now.toISOString().slice(0, 16);
                        sightingTimeField.value = formattedNow;
                    }
                }
            });
        }

        // 允许表单正常提交，不再阻止默认行为
        // 已经在模板中设置了action属性，表单会直接提交到服务器端
    }

    /**
     * Load dive sites list
     */
    function loadDiveSites() {
        // Simulate API call - replace with real API in actual project
        simulateApiCall('/api/sites?limit=100', function(response) {
            if (response.status === 'success') {
                // Populate dive site selector
                const sites = response.data.sites;
                sites.forEach(site => {
                    const option = document.createElement('option');
                    option.value = site.site_id;
                    option.textContent = site.name;
                    siteSelect.appendChild(option);
                });
            } else {
                console.error('Error loading dive sites:', response.error);
                showAlert('Failed to load dive sites. Please try again later.', 'danger');
            }
        });
    }

    /**
     * Handle form submission
     * @param {Event} e - Event object
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(reportForm);

        // Add loading effect to submit button
        const submitButton = reportForm.querySelector('.submit-button');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitButton.disabled = true;

        // Read photo file (if any)
        const photoFile = photoInput.files[0];

        if (photoFile) {
            // Validate file size
            if (photoFile.size > 5 * 1024 * 1024) { // 5MB
                showAlert('Photo size exceeds limit (max 5MB).', 'danger');
                resetSubmitButton();
                return;
            }

            // Read file as Base64 format
            const reader = new FileReader();

            reader.onload = function(fileEvent) {
                // Build request data
                const requestData = {
                    site_id: formData.get('site_id'),
                    species: formData.get('species'),
                    size_estimate: formData.get('size_estimate'),
                    sighting_time: formData.get('sighting_time'),
                    severity: formData.get('severity'),
                    description: formData.get('description'),
                    photo: fileEvent.target.result
                };

                // Send data
                submitReport(requestData, resetSubmitButton);
            };

            reader.onerror = function() {
                showAlert('Error reading photo. Please try again.', 'danger');
                resetSubmitButton();
            };

            reader.readAsDataURL(photoFile);
        } else {
            // No photo, build request data directly
            const requestData = {
                site_id: formData.get('site_id'),
                species: formData.get('species'),
                size_estimate: formData.get('size_estimate'),
                sighting_time: formData.get('sighting_time'),
                severity: formData.get('severity'),
                description: formData.get('description')
            };

            // Send data
            submitReport(requestData, resetSubmitButton);
        }

        /**
         * Reset submit button
         */
        function resetSubmitButton() {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }

    /**
     * Submit report
     * @param {Object} data - Request data
     * @param {Function} callback - Callback function
     */
    function submitReport(data, callback) {
        // Simulate API call - replace with real API in actual project
        simulateApiCall(`/api/sites/${data.site_id}/shark-warnings`, function(response) {
            if (response.status === 'success') {
                // Show success modal
                showSuccessModal();
            } else {
                console.error('Error submitting report:', response.error);
                showAlert('Failed to submit report. Please try again later.', 'danger');
            }

            // Execute callback
            if (callback) callback();
        }, data, 'POST');
    }

    /**
     * Show success modal
     */
    function showSuccessModal() {
        successModal.classList.add('show');
    }

    /**
     * Show alert message
     * @param {String} message - Message content
     * @param {String} type - Message type (success, danger, warning, info)
     */
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Clear and add alert
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alert);

        // Auto close alert after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);

        // Scroll to alert message
        alertContainer.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Simulate API call (for demonstration)
     * @param {String} url - API URL
     * @param {Function} callback - Callback function
     * @param {Object} data - Request data
     * @param {String} method - Request method
     */
    function simulateApiCall(url, callback, data = null, method = 'GET') {
        console.log(`Simulating ${method} API call to:`, url);
        if (data) console.log('With data:', data);

        // Simulate network delay
        setTimeout(() => {
            if (url.includes('/api/sites') && method === 'GET') {
                // Simulate dive sites data
                callback({
                    status: 'success',
                    data: {
                        sites: [
                            { site_id: 1, name: 'Blue Hole', lat: -31.9523, lng: 115.8613 },
                            { site_id: 2, name: 'Great Barrier Reef', lat: -16.7551, lng: 145.9823 },
                            { site_id: 3, name: 'Coral Bay', lat: 22.3456, lng: 114.1234 },
                            { site_id: 4, name: 'Dragon Cave', lat: 25.1234, lng: 121.9876 },
                            { site_id: 5, name: 'Shark Point', lat: -34.5678, lng: 150.8765 }
                        ]
                    }
                });
            } else if (url.includes('/shark-warnings') && method === 'POST') {
                // Simulate submitting shark warning
                callback({
                    status: 'success',
                    data: {
                        warning_id: Math.floor(Math.random() * 1000) + 1,
                        message: 'Shark warning has been successfully submitted.'
                    }
                });
            } else {
                // Simulate error
                callback({
                    status: 'error',
                    error: {
                        code: 'api_error',
                        message: 'Invalid API request'
                    }
                });
            }
        }, 1500); // Simulate 1.5s delay
    }
});