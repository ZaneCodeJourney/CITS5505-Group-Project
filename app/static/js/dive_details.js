document.addEventListener('DOMContentLoaded', function() {
    // Handle Edit Button
    setupEditFunctionality();
    
    // Initialize map
    initMap();
    
    // Initialize dive profile chart if data exists
    const profileChartElement = document.getElementById('dive-profile-chart');
    if (profileChartElement) {
        initCombinedDiveProfileChart(profileChartElement);
    }
    
    // Load species images
    setupSpeciesImages();
    
    // Setup share modal
    setupShareModal();
    
    // Setup delete functionality
    setupDeleteFunctionality();
});

function setupEditFunctionality() {
    const editBtn = document.getElementById('edit-dive-btn');
    const editModal = document.getElementById('edit-modal');
    
    if (editBtn && editModal) {
        editBtn.addEventListener('click', function() {
            editModal.style.display = 'block';
            loadDiveData();
        });
    }
    
    // Modal Close Controls
    const closeButtons = document.querySelectorAll('#edit-modal .close-modal, #edit-modal .close-edit-btn');
    closeButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            editModal.style.display = 'none';
        });
    });
    
    // Save Button
    const saveBtn = document.querySelector('#edit-modal .save-dive-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveDiveData);
    }
    
    // Close on Outside Click
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
}

function loadDiveData() {
    const loadingEl = document.getElementById('edit-loading');
    const formEl = document.getElementById('edit-dive-form');
    const errorEl = document.getElementById('edit-error');
    
    loadingEl.style.display = 'block';
    formEl.style.display = 'none';
    errorEl.style.display = 'none';
    
    // Get the dive ID from the URL or a data attribute
    const diveId = document.querySelector('.dive-details-container').dataset.diveId;
    
    fetch('/api/dives/' + diveId)
        .then(function(response) {
            if (!response.ok) throw new Error('Failed to load dive data');
            return response.json();
        })
        .then(function(dive) {
            // Fill form with data
            formEl.querySelector('#edit-dive-id').value = dive.id;
            formEl.querySelector('#edit-location').value = dive.location || '';
            
            if (dive.start_time) {
                formEl.querySelector('#edit-start-time').value = formatDateTime(new Date(dive.start_time));
            }
            
            if (dive.end_time) {
                formEl.querySelector('#edit-end-time').value = formatDateTime(new Date(dive.end_time));
            }
            
            formEl.querySelector('#edit-max-depth').value = dive.max_depth || '';
            formEl.querySelector('#edit-visibility').value = dive.visibility || '';
            formEl.querySelector('#edit-weather').value = dive.weather || 'sunny';
            formEl.querySelector('#edit-weight-belt').value = dive.weight_belt || '';
            formEl.querySelector('#edit-dive-partner').value = dive.dive_partner || '';
            formEl.querySelector('#edit-notes').value = dive.notes || '';
            
            loadingEl.style.display = 'none';
            formEl.style.display = 'block';
        })
        .catch(function(error) {
            console.error(error);
            loadingEl.style.display = 'none';
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
        });
}

function saveDiveData() {
    const formEl = document.getElementById('edit-dive-form');
    const feedbackEl = document.getElementById('edit-feedback');
    const diveId = formEl.querySelector('#edit-dive-id').value;
    
    // Get form data
    const formData = {
        location: formEl.querySelector('#edit-location').value,
        start_time: formEl.querySelector('#edit-start-time').value,
        end_time: formEl.querySelector('#edit-end-time').value,
        max_depth: parseFloat(formEl.querySelector('#edit-max-depth').value),
        visibility: formEl.querySelector('#edit-visibility').value,
        weather: formEl.querySelector('#edit-weather').value,
        weight_belt: parseFloat(formEl.querySelector('#edit-weight-belt').value) || null,
        dive_partner: formEl.querySelector('#edit-dive-partner').value,
        notes: formEl.querySelector('#edit-notes').value
    };
    
    // Get CSRF token
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    fetch('/api/dives/' + diveId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token
        },
        body: JSON.stringify(formData)
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Failed to update dive');
        return response.json();
    })
    .then(function() {
        // Success
        document.getElementById('edit-modal').style.display = 'none';
        window.location.reload();
    })
    .catch(function(error) {
        console.error(error);
        feedbackEl.innerHTML = '<div class="alert alert-danger">' + error.message + '</div>';
        setTimeout(function() {
            feedbackEl.innerHTML = '';
        }, 5000);
    });
}

function setupSpeciesImages() {
    // Get all species items and fetch images
    const speciesElements = document.querySelectorAll('[id^="species-img-"]');
    speciesElements.forEach(function(element) {
        const taxonId = element.dataset.taxonId;
        if (taxonId) {
            fetchSpeciesImageForElement(taxonId, element.id);
        }
    });
}

function setupShareModal() {
    const shareModal = document.getElementById('share-modal');
    const shareDiveBtn = document.getElementById('share-dive-btn');
    const closeModal = document.querySelector('.close-modal');
    const closeBtn = document.querySelector('.close-btn');
    
    if (shareDiveBtn) {
        shareDiveBtn.addEventListener('click', function() {
            shareModal.style.display = 'block';
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            shareModal.style.display = 'none';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            shareModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });
    
    // Share with specific user functionality
    setupUserSearch();
}

function setupUserSearch() {
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
            const diveId = document.querySelector('.dive-details-container').dataset.diveId;
            
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
                const response = await fetch('/api/shared/dives/' + diveId + '/share-with-user', {
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
}

function setupDeleteFunctionality() {
    const deleteDiveBtn = document.getElementById('delete-dive-btn');
    if (deleteDiveBtn) {
        deleteDiveBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this dive log? This action cannot be undone.')) {
                deleteDive();
            }
        });
    }
}

async function deleteDive() {
    const diveId = document.querySelector('.dive-details-container').dataset.diveId;
    
    try {
        // Get CSRF token
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        // Make API request to delete dive
        const response = await fetch('/api/dives/' + diveId, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': token
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete dive');
        }
        
        // Redirect to my logs page
        window.location.href = '/my-logs';
    } catch (error) {
        console.error('Error deleting dive:', error);
        alert('Failed to delete dive. Please try again.');
    }
}

function initMap() {
    const mapElement = document.getElementById('dive-location-map');
    if (!mapElement) return;
    
    const location = mapElement.dataset.location;
    
    // Try to extract coordinates from location string
    let lat = 0, lng = 0;
    const coordsMatch = location.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
    
    if (coordsMatch) {
        lat = parseFloat(coordsMatch[1]);
        lng = parseFloat(coordsMatch[2]);
    } else {
        // Default coordinates if we can't extract them
        lat = 0;
        lng = 0;
    }
    
    // Initialize map
    const map = L.map('dive-location-map').setView([lat, lng], 10);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Attempt to add OpenSeaMap tiles
    try {
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
    } catch (e) {
        console.warn('Failed to load OpenSeaMap tiles:', e);
    }
    
    // Add marker
    if (lat !== 0 || lng !== 0) {
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`<b>${location}</b>`).openPopup();
    }
}

// Helper function to parse CSV data
function parseCSVData(csvData) {
    if (!csvData) return null;
    
    // Parse CSV data
    const rows = csvData.trim().split('\n');
    const headers = rows[0].split(',');
    
    // Find index of columns
    const timeIndex = headers.findIndex(h => h.toLowerCase().includes('time'));
    const depthIndex = headers.findIndex(h => h.toLowerCase().includes('depth'));
    const airIndex = headers.findIndex(h => h.toLowerCase().includes('air'));
    const tempIndex = headers.findIndex(h => h.toLowerCase().includes('temp'));
    
    if (timeIndex === -1 || depthIndex === -1) {
        console.error('Missing required columns in CSV data');
        return null;
    }
    
    // Extract data
    const data = {
        time: [],
        depth: [],
        air: [],
        temp: [],
        hasAir: airIndex !== -1,
        hasTemp: tempIndex !== -1
    };
    
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',');
        if (values.length > Math.max(timeIndex, depthIndex)) {
            data.time.push(parseFloat(values[timeIndex]));
            data.depth.push(parseFloat(values[depthIndex]));
            
            if (airIndex !== -1 && values.length > airIndex) {
                data.air.push(parseFloat(values[airIndex]));
            }
            
            if (tempIndex !== -1 && values.length > tempIndex) {
                data.temp.push(parseFloat(values[tempIndex]));
            }
        }
    }
    
    return data;
}

function initCombinedDiveProfileChart(chartElement) {
    const csvData = chartElement.dataset.csvData;
    const parsedData = parseCSVData(csvData);
    
    if (!parsedData) return;
    
    // Create datasets
    const datasets = [
        {
            label: 'Depth (m)',
            data: parsedData.depth,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            yAxisID: 'y-depth',
            fill: true
        }
    ];
    
    // Add air pressure dataset if available
    if (parsedData.hasAir && parsedData.air.length > 0) {
        datasets.push({
            label: 'Air Pressure (bar)',
            data: parsedData.air,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            yAxisID: 'y-air',
            fill: false
        });
    }
    
    // Add temperature dataset if available
    if (parsedData.hasTemp && parsedData.temp.length > 0) {
        datasets.push({
            label: 'Temperature (°C)',
            data: parsedData.temp,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            yAxisID: 'y-temp',
            fill: false
        });
    }
    
    // Configure scales
    const scales = {
        x: {
            title: {
                display: true,
                text: 'Time (minutes)'
            },
            grid: {
                color: 'rgba(200, 200, 200, 0.3)'
            }
        },
        'y-depth': {
            type: 'linear',
            position: 'left',
            reverse: true,
            title: {
                display: true,
                text: 'Depth (m)'
            },
            grid: {
                color: 'rgba(54, 162, 235, 0.3)'
            }
        }
    };
    
    // Add air pressure axis if needed
    if (parsedData.hasAir && parsedData.air.length > 0) {
        scales['y-air'] = {
            type: 'linear',
            position: 'right',
            title: {
                display: true,
                text: 'Air Pressure (bar)'
            },
            grid: {
                display: false
            }
        };
    }
    
    // Add temperature axis if needed
    if (parsedData.hasTemp && parsedData.temp.length > 0) {
        scales['y-temp'] = {
            type: 'linear',
            position: 'right',
            title: {
                display: true,
                text: 'Temperature (°C)'
            },
            grid: {
                display: false
            }
        };
    }
    
    // Create chart
    const ctx = chartElement.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: parsedData.time,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: scales,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y;
                            if (label.includes('Depth')) {
                                return `${label}: ${value.toFixed(1)} m`;
                            } else if (label.includes('Air')) {
                                return `${label}: ${value.toFixed(0)} bar`;
                            } else if (label.includes('Temp')) {
                                return `${label}: ${value.toFixed(1)} °C`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

// Function to fetch species image from iNaturalist API - like stats page
function fetchSpeciesImageForElement(taxonId, elementId) {
    fetch(`https://api.inaturalist.org/v1/taxa/${taxonId}`)
        .then(response => response.json())
        .then(data => {
            const imgElement = document.getElementById(elementId);
            if (!imgElement) return;
            
            const imagePlaceholder = imgElement.nextElementSibling;
            
            if (data && data.results && data.results.length > 0 && 
                data.results[0].default_photo && data.results[0].default_photo.medium_url) {
                
                // Set the image source to the medium URL from the API
                imgElement.src = data.results[0].default_photo.medium_url;
            } else {
                // If no image is found, show the placeholder
                imgElement.style.display = 'none';
                imagePlaceholder.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('Error fetching species image:', error);
            // Show placeholder on error
            const imgElement = document.getElementById(elementId);
            if (imgElement) {
                imgElement.style.display = 'none';
                imgElement.nextElementSibling.style.display = 'flex';
            }
        });
}

// Helper function to format date for datetime-local input
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
} 