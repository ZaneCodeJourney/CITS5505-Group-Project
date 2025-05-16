document.addEventListener('DOMContentLoaded', function() {
    // Check URL for edit_dive parameter
    const urlParams = new URLSearchParams(window.location.search);
    const editDiveId = urlParams.get('edit_dive');
    
    if (editDiveId) {
        // Open edit modal with the specified dive ID
        openEditModal(editDiveId);
    }
    
    // Check if we have a hash in the URL (for directly jumping to a dive log)
    if (window.location.hash && window.location.hash.startsWith('#dive-')) {
        setTimeout(() => highlightDiveLog(window.location.hash.substring(1)), 500);
    }
    
    // Initialize the map
    initMap();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup modals
    setupModals();
});

// Helper function for API requests
async function apiRequest(url, method = 'GET', data = null) {
    // Get CSRF token
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    const options = {
        method: method,
        headers: {
            'X-CSRFToken': token
        }
    };
    
    if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `HTTP error ${response.status}`);
        } catch (e) {
            if (e instanceof SyntaxError) {
                throw new Error(`HTTP error ${response.status}: ${errorText}`);
            } else {
                throw e;
            }
        }
    }
    
    // For DELETE requests, just return success, no data
    if (method === 'DELETE') {
        return { success: true };
    }
    
    // For GET, POST, PUT requests, return the parsed JSON response
    try {
        return await response.json();
    } catch (e) {
        return { success: true }; // For endpoints that don't return JSON
    }
}

function initMap() {
    // Check if map container exists
    const mapContainer = document.getElementById('my-dive-map');
    if (!mapContainer) return;

    // Initialize the map with noWrap to prevent repeating world
    const map = L.map('my-dive-map', {
        worldCopyJump: false,
        maxBounds: [[-90, -180], [90, 180]],
        minZoom: 2
    }).setView([0, 0], 2);

    // Add OpenStreetMap tiles with noWrap option
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        noWrap: true
    }).addTo(map);

    // Attempt to add OpenSeaMap tiles
    try {
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors',
            maxZoom: 19,
            noWrap: true
        }).addTo(map);
    } catch (e) {
        console.warn('Failed to load OpenSeaMap tiles:', e);
    }

    // Create default icon
    const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
    });

    // Create a bounds object to fit all dive sites
    const bounds = L.latLngBounds();
    let hasValidMarkers = false;
    
    // Store coordinates to normalize them
    const coordinates = [];

    // First pass - collect all coordinates and normalize longitudes
    const logCards = document.querySelectorAll('.log-card');
    logCards.forEach(card => {
        const location = card.dataset.location;
        let lat = parseFloat(card.dataset.latitude);
        let lng = parseFloat(card.dataset.longitude);
        
        // Try to extract coordinates from location string if not provided
        if (isNaN(lat) || isNaN(lng)) {
            const coordsMatch = location.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
            if (coordsMatch) {
                lat = parseFloat(coordsMatch[1]);
                lng = parseFloat(coordsMatch[2]);
                
                // Store the extracted coordinates in the card
                card.dataset.latitude = lat;
                card.dataset.longitude = lng;
            }
        }
        
        // Skip if no valid coordinates
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Normalize longitude to -180 to 180 range
        while (lng > 180) lng -= 360;
        while (lng < -180) lng += 360;
        
        coordinates.push({card, lat, lng, location});
    });
    
    // Calculate the center of all points to determine which side of the map to use
    if (coordinates.length > 0) {
        // Create markers after normalizing coordinates
        coordinates.forEach(({card, lat, lng, location}) => {
            hasValidMarkers = true;
            
            // Create marker
            const marker = L.marker([lat, lng], {
                icon: defaultIcon,
                alt: location
            }).addTo(map);
            
            // No popup content, we only use marker click to jump to log
            marker.on('click', function() {
                highlightDiveLog(`dive-${card.dataset.diveId}`);
                history.pushState(null, null, `#dive-${card.dataset.diveId}`);
            });
            
            // Add this location to bounds
            bounds.extend([lat, lng]);
        });
    }

    // Fit the map to show all dive sites with some padding
    if (hasValidMarkers && bounds.isValid()) {
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 10
        });
    }

    // Inside initMap(), after map is created and before markers created
    // Add a single click listener to the map container for popup links
    map.getContainer().addEventListener('click', function(e) {
        const link = e.target.closest('.popup-link');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href && href.startsWith('#dive-')) {
            e.preventDefault();
            const diveId = href.substring(1); // remove '#'
            highlightDiveLog(diveId);
            history.pushState(null, null, href);
        }
    });
}

function setupEventListeners() {
    // Filter form submission
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(filterForm);
            const queryParams = new URLSearchParams();
            
            // Add form data to query parameters
            for (const [key, value] of formData.entries()) {
                if (value) queryParams.append(key, value);
            }
            
            // Redirect to filtered URL
            window.location.href = `${window.location.pathname}?${queryParams.toString()}`;
        });
    }
    
    // Reset filters button
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Reset all form fields
            filterForm.reset();
            
            // Redirect to unfiltered URL
            window.location.href = window.location.pathname;
        });
    }
    
    // View details buttons
    const viewDetailsButtons = document.querySelectorAll('.view-details');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const diveId = this.dataset.id;
            // Redirect to dive details page
            window.location.href = `/dive/${diveId}`;
        });
    });
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-dive');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const diveId = this.dataset.id;
            // Open edit modal with dive data
            openEditModal(diveId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-dive');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const diveId = this.dataset.id;
            
            // Store dive ID in delete modal
            document.getElementById('delete-modal').dataset.diveId = diveId;
            
            // Show delete confirmation modal
            document.getElementById('delete-modal').style.display = 'block';
        });
    });
    
    // Share buttons
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const diveId = this.dataset.id;
            const diveLocation = this.closest('.log-card').querySelector('h3').textContent;
            
            // Store dive ID in share modal
            document.getElementById('share-modal').dataset.diveId = diveId;
            
            // Update modal title
            document.querySelector('#share-modal .modal-header h3').textContent = `Share - ${diveLocation}`;
            
            // Show share modal
            document.getElementById('share-modal').style.display = 'block';
        });
    });
}

// Function to fetch dive data and open edit modal
async function openEditModal(diveId) {
    try {
        // Show loading state
        const editModal = document.getElementById('edit-modal');
        const loadingEl = document.getElementById('edit-loading');
        const formEl = document.getElementById('edit-dive-form');
        const errorEl = document.getElementById('edit-error');
        
        // Reset state
        loadingEl.style.display = 'block';
        formEl.style.display = 'none';
        errorEl.style.display = 'none';
        
        // Show modal
        editModal.style.display = 'block';
        
        try {
            // Fetch dive data
            const dive = await apiRequest(`/api/dives/${diveId}`);
            
            // Populate form fields with dive data
            formEl.querySelector('#edit-dive-id').value = dive.id;
            formEl.querySelector('#edit-location').value = dive.location || '';
            
            // Format datetime-local inputs
            if (dive.start_time) {
                const startTime = new Date(dive.start_time);
                formEl.querySelector('#edit-start-time').value = formatDateTimeLocalInput(startTime);
            }
            
            if (dive.end_time) {
                const endTime = new Date(dive.end_time);
                formEl.querySelector('#edit-end-time').value = formatDateTimeLocalInput(endTime);
            }
            
            formEl.querySelector('#edit-max-depth').value = dive.max_depth || '';
            formEl.querySelector('#edit-visibility').value = dive.visibility || '';
            formEl.querySelector('#edit-weather').value = dive.weather || 'sunny';
            formEl.querySelector('#edit-weight-belt').value = dive.weight_belt || '';
            formEl.querySelector('#edit-dive-partner').value = dive.dive_partner || '';
            formEl.querySelector('#edit-notes').value = dive.notes || '';
            
            // Hide loading, show form
            loadingEl.style.display = 'none';
            formEl.style.display = 'block';
        } catch (error) {
            console.error('Error fetching dive data:', error);
            loadingEl.style.display = 'none';
            errorEl.textContent = 'Error loading dive data: ' + error.message;
            errorEl.style.display = 'block';
        }
    } catch (error) {
        console.error('General error in openEditModal:', error);
        alert('Error opening edit form: ' + error.message);
    }
}

// Helper function to format date for datetime-local input
function formatDateTimeLocalInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function setupModals() {
    // Setup Share Modal
    const shareModal = document.getElementById('share-modal');
    const shareCloseBtn = shareModal.querySelector('.close-modal');
    const shareCloseFooterBtn = shareModal.querySelector('.close-btn');
    
    if (shareCloseBtn) {
        shareCloseBtn.addEventListener('click', function() {
            shareModal.style.display = 'none';
        });
    }
    
    if (shareCloseFooterBtn) {
        shareCloseFooterBtn.addEventListener('click', function() {
            shareModal.style.display = 'none';
        });
    }
    
    // Share with specific user functionality
    const shareWithUserBtn = document.getElementById('share-with-user-btn');
    const shareUserFeedback = document.getElementById('share-user-feedback');
    const userSuggestions = document.getElementById('user-suggestions');
    const shareRecipient = document.getElementById('share-recipient');
    const inviteSection = document.getElementById('invite-section');
    const inviteLink = document.getElementById('invite-link');
    const copyInviteBtn = document.getElementById('copy-invite-link');
    
    let suggestionTimeout;
    
    // User search functionality
    if (shareRecipient) {
        // Focus event - when input gets focus, show suggestions if there are any
        shareRecipient.addEventListener('focus', function() {
            if (userSuggestions.children.length > 0) {
                userSuggestions.style.display = 'block';
            }
        });
        
        shareRecipient.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Clear previous timeout
            if (suggestionTimeout) {
                clearTimeout(suggestionTimeout);
            }
            
            // Hide suggestions if input is empty
            if (!query) {
                userSuggestions.style.display = 'none';
                return;
            }
            
            // Debounce the search to avoid too many requests
            suggestionTimeout = setTimeout(async function() {
                if (query.length < 2) return;
                
                try {
                    // Get CSRF token
                    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                    
                    // Make API request to search users
                    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                    
                    if (!response.ok) {
                        console.error('Error searching users:', await response.text());
                        return;
                    }
                    
                    const data = await response.json();
                    
                    // Display user suggestions
                    userSuggestions.innerHTML = '';
                    
                    if (data.users.length === 0) {
                        userSuggestions.style.display = 'none';
                        return;
                    }
                    
                    // Create suggestion items
                    data.users.forEach(user => {
                        const item = document.createElement('div');
                        item.className = 'suggestion-item';
                        item.innerHTML = `
                            <span class="suggestion-username">${user.username}</span>
                            <span class="suggestion-email">${user.email}</span>
                        `;
                        
                        // Select user when clicked
                        item.addEventListener('click', function() {
                            // Always use username for sharing
                            shareRecipient.value = user.username;
                            userSuggestions.style.display = 'none';
                        });
                        
                        userSuggestions.appendChild(item);
                    });
                    
                    userSuggestions.style.display = 'block';
                } catch (error) {
                    console.error('Error searching users:', error);
                }
            }, 300);
        });
        
        // Handle clicks outside to hide suggestions
        document.addEventListener('click', function(e) {
            if (!shareRecipient.contains(e.target) && !userSuggestions.contains(e.target)) {
                userSuggestions.style.display = 'none';
            }
        });
    }
    
    // Copy invite link functionality
    if (copyInviteBtn) {
        copyInviteBtn.addEventListener('click', function() {
            inviteLink.select();
            document.execCommand('copy');
            
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            
            setTimeout(() => {
                this.textContent = originalText;
            }, 2000);
        });
    }
    
    if (shareWithUserBtn) {
        shareWithUserBtn.addEventListener('click', async function() {
            const recipient = shareRecipient.value.trim();
            const diveId = shareModal.dataset.diveId;
            
            if (!recipient) {
                shareUserFeedback.innerHTML = '<div class="alert alert-warning">Please enter a username or email address</div>';
                return;
            }
            
            try {
                // Show loading state
                shareWithUserBtn.disabled = true;
                shareWithUserBtn.textContent = 'Sharing...';
                
                // Get CSRF token
                const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                
                // Hide invite section if previously shown
                inviteSection.style.display = 'none';
                
                // Make API request to share with user
                const response = await fetch(`/api/shared/dives/${diveId}/share-with-user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': token
                    },
                    body: JSON.stringify({
                        username: recipient
                    })
                });
                
                const data = await response.json();
                
                if (response.status === 404) {
                    // Handle user not found errors
                    // Show the invite section
                    inviteSection.style.display = 'block';
                    
                    // Generate invite link
                    const signupURL = `${window.location.origin}/register`;
                    inviteLink.value = signupURL;
                    
                    // Show error message
                    const recipientType = recipient.includes('@') ? 'email address' : 'username';
                    shareUserFeedback.innerHTML = `<div class="alert alert-warning">No user found with this ${recipientType}. You can invite them to sign up!</div>`;
                    return;
                }
                
                if (!response.ok) {
                    shareUserFeedback.innerHTML = `<div class="alert alert-danger">${data.error || 'Failed to share dive. Please try again.'}</div>`;
                    return;
                }
                
                // Show success message
                shareUserFeedback.innerHTML = `<div class="alert alert-success">${data.message || 'Dive successfully shared!'}</div>`;
                
                // Clear input
                shareRecipient.value = '';
                
            } catch (error) {
                console.error('Error sharing with user:', error);
                shareUserFeedback.innerHTML = '<div class="alert alert-danger">An error occurred. Please try again.</div>';
            } finally {
                // Reset button state
                shareWithUserBtn.disabled = false;
                shareWithUserBtn.textContent = 'Share';
            }
        });
    }
    
    // Setup Delete Confirmation Modal
    const deleteModal = document.getElementById('delete-modal');
    const deleteCloseBtn = deleteModal.querySelector('.close-modal');
    const deleteCancelBtn = deleteModal.querySelector('.cancel-btn');
    const deleteConfirmBtn = deleteModal.querySelector('.confirm-delete-btn');
    
    if (deleteCloseBtn) {
        deleteCloseBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    if (deleteCancelBtn) {
        deleteCancelBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', async function() {
            const diveId = deleteModal.dataset.diveId;
            
            try {
                // Use the centralized API request function with CSRF protection
                await apiRequest(`/api/dives/${diveId}`, 'DELETE');
                
                // Remove the dive card from the page
                const diveCard = document.querySelector(`.log-card[data-dive-id="${diveId}"]`);
                if (diveCard) {
                    diveCard.remove();
                }
                
                // Close modal
                deleteModal.style.display = 'none';
                
                // Show success message
                alert('Dive log deleted successfully');
                
                // Reload page to update stats
                window.location.reload();
            } catch (error) {
                console.error('Error deleting dive log:', error);
                alert('Error deleting dive log: ' + error.message);
            }
        });
    }
    
    // Setup Edit Modal
    const editModal = document.getElementById('edit-modal');
    const editCloseBtn = editModal.querySelector('.close-modal');
    const editCancelBtn = editModal.querySelector('.close-edit-btn');
    const editSaveBtn = editModal.querySelector('.save-dive-btn');
    
    if (editCloseBtn) {
        editCloseBtn.addEventListener('click', function() {
            editModal.style.display = 'none';
        });
    }
    
    if (editCancelBtn) {
        editCancelBtn.addEventListener('click', function() {
            editModal.style.display = 'none';
        });
    }
    
    if (editSaveBtn) {
        editSaveBtn.addEventListener('click', async function() {
            // Get form data
            const form = document.getElementById('edit-dive-form');
            const diveId = form.querySelector('#edit-dive-id').value;
            const feedbackEl = document.getElementById('edit-feedback');
            
            try {
                // Show loading state
                editSaveBtn.disabled = true;
                editSaveBtn.textContent = 'Saving...';
                
                // Prepare data
                const formData = {
                    location: form.querySelector('#edit-location').value,
                    start_time: form.querySelector('#edit-start-time').value,
                    end_time: form.querySelector('#edit-end-time').value,
                    max_depth: parseFloat(form.querySelector('#edit-max-depth').value),
                    visibility: form.querySelector('#edit-visibility').value,
                    weather: form.querySelector('#edit-weather').value,
                    weight_belt: parseFloat(form.querySelector('#edit-weight-belt').value) || null,
                    dive_partner: form.querySelector('#edit-dive-partner').value,
                    notes: form.querySelector('#edit-notes').value
                };
                
                // Send update request
                await apiRequest(`/api/dives/${diveId}`, 'PUT', formData);
                
                // Hide modal
                editModal.style.display = 'none';
                
                // Show success message
                const messageEl = document.getElementById('js-success-message');
                const textEl = document.getElementById('js-success-text');
                textEl.textContent = 'Dive log updated successfully!';
                messageEl.style.display = 'block';
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 5000);
                
                // Reload page to show updated data
                window.location.reload();
            } catch (error) {
                console.error('Error updating dive log:', error);
                
                // Show error feedback
                feedbackEl.innerHTML = `<div class="alert alert-danger">${error.message || 'Error updating dive log'}</div>`;
                
                // Auto-hide error after 5 seconds
                setTimeout(() => {
                    feedbackEl.innerHTML = '';
                }, 5000);
            } finally {
                // Reset button state
                editSaveBtn.disabled = false;
                editSaveBtn.textContent = 'Save Changes';
            }
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
        
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
        
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
}

// Helper function to animate scroll
function smoothScrollTo(targetY, duration = 800) {
    const startY = window.scrollY || window.pageYOffset;
    const distance = targetY - startY;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percent = Math.min(progress / duration, 1);
        window.scrollTo(0, startY + distance * percent);
        if (progress < duration) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

function highlightDiveLog(diveElementId) {
    const diveElement = document.getElementById(diveElementId);
    if (!diveElement) return;
    
    // Scroll with custom duration (1s)
    smoothScrollTo(diveElement.offsetTop - 20, 1000);
    
    // Add highlight animation (reset if already applied)
    diveElement.classList.remove('highlight-dive');
    void diveElement.offsetWidth; // force reflow to restart animation
    diveElement.classList.add('highlight-dive');
} 