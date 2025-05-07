// Initialize new log form functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if new log form page
    const diveLogForm = document.querySelector('.dive-log-form');
    if (!diveLogForm) return;
    
    // Initialize map for dive location selection
    initDiveLocationMap();
    
    // Initialize dive buddy functionality
    initDiveBuddies();
    
    // Initialize marine life sightings functionality
    initMarineLifeSightings();
    
    // Initialize photo preview
    initPhotoPreview();
    
    // Initialize gas mix toggle
    initGasMixToggle();
    
    // Initialize dive computer import
    initDiveComputerImport();
    
    // Setup form validation and submission
    setupFormValidation();
    
    // Initialize privacy toggle
    initPrivacyToggle();
});

// Initialize map for selecting dive location
function initDiveLocationMap() {
    const mapContainer = document.getElementById('dive-location-map');
    if (!mapContainer) return;
    
    // Initialize the map
    const map = L.map('dive-location-map').setView([0, 0], 2);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add OpenSeaMap tiles for marine data
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Get latitude/longitude input fields
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    
    // Create a marker for the dive location
    let diveMarker = null;
    
    // If coordinates are already in the form, set the marker
    if (latitudeInput.value && longitudeInput.value) {
        const lat = parseFloat(latitudeInput.value);
        const lng = parseFloat(longitudeInput.value);
        if (!isNaN(lat) && !isNaN(lng)) {
            addMarker([lat, lng]);
            map.setView([lat, lng], 10);
        }
    }
    
    // Function to add or update marker
    function addMarker(latlng) {
        if (diveMarker) {
            // Update existing marker
            diveMarker.setLatLng(latlng);
        } else {
            // Create new marker
            diveMarker = L.marker(latlng, {
                draggable: true // Make marker draggable
            }).addTo(map);
            
            // When marker is dragged, update form values
            diveMarker.on('dragend', function(e) {
                const pos = diveMarker.getLatLng();
                updateCoordinateInputs(pos.lat, pos.lng);
            });
        }
    }
    
    // Function to update coordinate inputs
    function updateCoordinateInputs(lat, lng) {
        latitudeInput.value = lat.toFixed(6);
        longitudeInput.value = lng.toFixed(6);
    }
    
    // Map click handler for setting the marker
    map.on('click', function(e) {
        addMarker(e.latlng);
        updateCoordinateInputs(e.latlng.lat, e.latlng.lng);
    });
    
    // Update map when coordinates are entered manually
    function updateMapFromInputs() {
        const lat = parseFloat(latitudeInput.value);
        const lng = parseFloat(longitudeInput.value);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            addMarker([lat, lng]);
            map.setView([lat, lng], 10);
        }
    }
    
    latitudeInput.addEventListener('change', updateMapFromInputs);
    longitudeInput.addEventListener('change', updateMapFromInputs);
}

// Initialize dive buddy functionality
function initDiveBuddies() {
    const addBuddyBtn = document.getElementById('add-buddy-btn');
    const buddyNameInput = document.getElementById('buddy-name');
    const buddyEmailInput = document.getElementById('buddy-email');
    const buddiesList = document.getElementById('buddies-list');
    
    if (!addBuddyBtn || !buddyNameInput || !buddiesList) return;
    
    addBuddyBtn.addEventListener('click', function() {
        // Validate buddy name is not empty
        if (!buddyNameInput.value.trim()) {
            alert('Please enter a buddy name');
            return;
        }
        
        // Create buddy item
        const buddyItem = document.createElement('div');
        buddyItem.className = 'buddy-item';
        
        // Get buddy details
        const buddyName = buddyNameInput.value.trim();
        const buddyEmail = buddyEmailInput.value.trim();
        
        // Create email display
        const emailDisplay = buddyEmail ? 
            `<span class="buddy-email">${buddyEmail}</span>` : '';
        
        // Set buddy HTML
        buddyItem.innerHTML = `
            <div class="buddy-info">
                <span class="buddy-name">${buddyName}</span>
                ${emailDisplay}
            </div>
            <button type="button" class="btn btn-small btn-delete remove-buddy">Remove</button>
            <input type="hidden" name="buddy-names[]" value="${buddyName}">
            <input type="hidden" name="buddy-emails[]" value="${buddyEmail}">
        `;
        
        // Add to buddies list
        buddiesList.appendChild(buddyItem);
        
        // Clear inputs
        buddyNameInput.value = '';
        buddyEmailInput.value = '';
        
        // Add event listener to remove button
        const removeBtn = buddyItem.querySelector('.remove-buddy');
        removeBtn.addEventListener('click', function() {
            buddiesList.removeChild(buddyItem);
        });
    });
}

// Initialize marine life sightings functionality
function initMarineLifeSightings() {
    const addSpeciesBtn = document.getElementById('add-species-btn');
    const speciesNameInput = document.getElementById('species-name');
    const speciesCountInput = document.getElementById('species-count');
    const sightingsList = document.getElementById('sightings-list');
    
    if (!addSpeciesBtn || !speciesNameInput || !sightingsList) return;
    
    addSpeciesBtn.addEventListener('click', function() {
        // Validate species name is not empty
        if (!speciesNameInput.value.trim()) {
            alert('Please enter a species name');
            return;
        }
        
        // Get count or default to 1
        let count = parseInt(speciesCountInput.value);
        if (isNaN(count) || count < 1) {
            count = 1;
        }
        
        // Create sighting item
        const sightingItem = document.createElement('div');
        sightingItem.className = 'sighting-item';
        
        // Get species details
        const speciesName = speciesNameInput.value.trim();
        
        // Set sighting HTML
        sightingItem.innerHTML = `
            <div class="sighting-info">
                <span class="species-name">${speciesName}</span>
                <span class="species-count">× ${count}</span>
            </div>
            <button type="button" class="btn btn-small btn-delete remove-sighting">Remove</button>
            <input type="hidden" name="species-names[]" value="${speciesName}">
            <input type="hidden" name="species-counts[]" value="${count}">
        `;
        
        // Add to sightings list
        sightingsList.appendChild(sightingItem);
        
        // Clear inputs
        speciesNameInput.value = '';
        speciesCountInput.value = '';
        
        // Add event listener to remove button
        const removeBtn = sightingItem.querySelector('.remove-sighting');
        removeBtn.addEventListener('click', function() {
            sightingsList.removeChild(sightingItem);
        });
    });
}

// Initialize photo preview
function initPhotoPreview() {
    const photoInput = document.getElementById('dive-photos');
    const photoPreview = document.getElementById('photo-preview');
    
    if (!photoInput || !photoPreview) return;
    
    photoInput.addEventListener('change', function() {
        // Clear previous previews
        photoPreview.innerHTML = '';
        
        // Loop through selected files
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            
            // Check if file is an image
            if (!file.type.match('image.*')) continue;
            
            // Create preview container
            const preview = document.createElement('div');
            preview.className = 'photo-preview-item';
            
            // Create image element
            const img = document.createElement('img');
            preview.appendChild(img);
            
            // Create remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-photo';
            removeBtn.innerHTML = '×';
            removeBtn.setAttribute('type', 'button');
            preview.appendChild(removeBtn);
            
            // Add preview to container
            photoPreview.appendChild(preview);
            
            // Set up file reader to load image
            const reader = new FileReader();
            reader.onload = (function(image) {
                return function(e) {
                    image.src = e.target.result;
                };
            })(img);
            
            // Read the file as a data URL
            reader.readAsDataURL(file);
            
            // Set up remove button click handler
            // Note: This won't actually remove from the file input
            // For a full implementation, you'd need a custom file upload handling
            removeBtn.addEventListener('click', function() {
                photoPreview.removeChild(preview);
            });
        }
    });
}

// Initialize gas mix toggle
function initGasMixToggle() {
    const gasMixSelect = document.getElementById('gas-mix');
    const nitroxDetails = document.getElementById('nitrox-details');
    
    if (!gasMixSelect || !nitroxDetails) return;
    
    gasMixSelect.addEventListener('change', function() {
        if (this.value === 'nitrox' || this.value === 'trimix' || this.value === 'heliox') {
            nitroxDetails.style.display = 'block';
        } else {
            nitroxDetails.style.display = 'none';
        }
    });
}

// Initialize privacy toggle
function initPrivacyToggle() {
    const privacyToggle = document.getElementById('privacy-toggle');
    const publicText = document.querySelector('.toggle-label .public');
    const privateText = document.querySelector('.toggle-label .private');
    
    if (!privacyToggle) return;
    
    // Set initial state
    if (privacyToggle.checked) {
        publicText.style.display = 'block';
        privateText.style.display = 'none';
    } else {
        publicText.style.display = 'none';
        privateText.style.display = 'block';
    }
    
    // Toggle event
    privacyToggle.addEventListener('change', function() {
        if (this.checked) {
            publicText.style.display = 'block';
            privateText.style.display = 'none';
        } else {
            publicText.style.display = 'none';
            privateText.style.display = 'block';
        }
    });
}

// Setup form validation and submission
function setupFormValidation() {
    const diveLogForm = document.querySelector('.dive-log-form');
    
    if (!diveLogForm) return;
    
    diveLogForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent actual form submission
        
        // Basic validation
        const diveSite = document.getElementById('dive-site');
        const diveDate = document.getElementById('dive-date');
        const duration = document.getElementById('duration');
        const maxDepth = document.getElementById('max-depth');
        
        let isValid = true;
        
        // Validate required fields
        if (!diveSite.value.trim()) {
            highlightError(diveSite, 'Dive site name is required');
            isValid = false;
        } else {
            removeHighlight(diveSite);
        }
        
        if (!diveDate.value) {
            highlightError(diveDate, 'Date is required');
            isValid = false;
        } else {
            removeHighlight(diveDate);
        }
        
        if (!duration.value || isNaN(duration.value) || parseInt(duration.value) < 1) {
            highlightError(duration, 'Valid duration is required');
            isValid = false;
        } else {
            removeHighlight(duration);
        }
        
        if (!maxDepth.value || isNaN(maxDepth.value)) {
            highlightError(maxDepth, 'Valid max depth is required');
            isValid = false;
        } else {
            removeHighlight(maxDepth);
        }
        
        // If valid, show success message (in real app would submit to server)
        if (isValid) {
            alert('Dive log successfully saved!');
            // In a real app, you'd submit the form to the server
            // window.location.href = 'my-logs.html'; // Redirect to logs page
        }
    });
    
    // Function to highlight error field
    function highlightError(element, message) {
        element.classList.add('error-input');
        
        // Add error message if it doesn't exist
        let errorMessage = element.parentNode.querySelector('.error-message');
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            element.parentNode.appendChild(errorMessage);
        }
        
        errorMessage.textContent = message;
    }
    
    // Function to remove highlight
    function removeHighlight(element) {
        element.classList.remove('error-input');
        
        // Remove error message if it exists
        const errorMessage = element.parentNode.querySelector('.error-message');
        if (errorMessage) {
            element.parentNode.removeChild(errorMessage);
        }
    }
}

// Initialize dive computer data import
function initDiveComputerImport() {
    const fileInput = document.getElementById('dive-computer-file');
    const loadSampleBtn = document.getElementById('load-sample-data');
    const profileContainer = document.querySelector('.dive-profile-container');
    
    if (!fileInput || !profileContainer) return;
    
    // Dive profile chart
    let diveProfileChart = null;
    
    // Event listener for file input change
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if file is CSV
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a CSV file.');
            return;
        }
        
        // Read file
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvData = e.target.result;
            processCSVData(csvData);
        };
        
        reader.readAsText(file);
    });
    
    // Event listener for sample data button
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Sample dive data
            const sampleCSV = `Time,Depth (m),Air (bar),Temp (°C)
0:00,0,200,26
0:01,2,198,26
0:02,4,196,25.8
0:03,6,194,25.5
0:04,8,192,25.2
0:05,10,190,25
0:06,12,188,24.8
0:07,14,186,24.5
0:08,16,184,24.2
0:09,18,182,24
0:10,19,180,23.8
0:11,20,178,23.5
0:12,20,176,23.2
0:13,20,174,23
0:14,20,172,22.8
0:15,20,170,22.5
0:16,19,168,22.2
0:17,18,166,22
0:18,17,164,22
0:19,16,162,22
0:20,15,160,22
0:21,14,158,22
0:22,13,156,22
0:23,12,154,22
0:24,11,152,22
0:25,10,150,22.2
0:26,12,148,22
0:27,14,146,21.8
0:28,16,144,21.5
0:29,18,142,21.2
0:30,20,140,21
0:31,22,138,20.8
0:32,24,136,20.5
0:33,25,134,20.2
0:34,25,132,20
0:35,25,130,20
0:36,24,128,20
0:37,22,126,20.2
0:38,20,124,20.5
0:39,18,122,20.8
0:40,16,120,21
0:41,14,118,21.2
0:42,12,116,21.5
0:43,10,114,21.8
0:44,8,112,22
0:45,6,110,22.5
0:46,4,108,23
0:47,2,106,24
0:48,0,104,25`;
            
            processCSVData(sampleCSV);
        });
    }
    
    // Function to process CSV data
    function processCSVData(csvData) {
        // Split CSV into lines
        const lines = csvData.trim().split('\n');
        
        // Check if there's a header row and at least one data row
        if (lines.length < 2) {
            alert('CSV file must have a header row and at least one data row.');
            return;
        }
        
        // Get header row and verify expected columns
        const header = lines[0].split(',');
        const expectedColumns = ['Time', 'Depth (m)', 'Air (bar)', 'Temp (°C)'];
        
        // Check if all expected columns are present (case insensitive)
        const headerLower = header.map(h => h.toLowerCase().trim());
        const expectedLower = expectedColumns.map(h => h.toLowerCase().trim());
        
        // Ensure all expected columns are present
        const allColumnsPresent = expectedLower.every(col => 
            headerLower.some(h => h.includes(col.replace(/\s*\(.*\)/, ''))));
            
        if (!allColumnsPresent) {
            alert(`CSV file must have the following columns: ${expectedColumns.join(', ')}`);
            return;
        }
        
        // Parse data rows
        const diveData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            
            // Skip if wrong number of columns
            if (values.length !== header.length) continue;
            
            // Get time
            const timeStr = values[0].trim();
            
            // Parse depth, air, and temperature values
            let depth = parseFloat(values[1]);
            let air = parseFloat(values[2]);
            let temp = parseFloat(values[3]);
            
            // Skip invalid entries
            if (isNaN(depth) || isNaN(air) || isNaN(temp)) continue;
            
            // Add to dive data array
            diveData.push({
                time: timeStr,
                depth: depth,
                air: air,
                temp: temp,
                timeMinutes: convertTimeToMinutes(timeStr)
            });
        }
        
        // Check if we have enough data
        if (diveData.length === 0) {
            alert('No valid data found in CSV file.');
            return;
        }
        
        // Show profile container
        profileContainer.style.display = 'block';
        
        // Display data
        displayDiveData(diveData);
        
        // Update dive stats from data
        updateDiveStats(diveData);
        
        // Create or update chart
        createDiveProfileChart(diveData);
        
        // Auto-fill some form fields based on dive data
        autoFillFormFields(diveData);
    }
    
    // Create dive profile chart
    function createDiveProfileChart(diveData) {
        // Get chart canvas
        const chartCanvas = document.getElementById('dive-profile-chart');
        if (!chartCanvas) return;
        
        // Extract data for chart
        const times = diveData.map(d => d.timeMinutes);
        const depths = diveData.map(d => d.depth);
        const temps = diveData.map(d => d.temp);
        const air = diveData.map(d => d.air);
        
        // Destroy previous chart if it exists
        if (diveProfileChart) {
            diveProfileChart.destroy();
        }
        
        // Create chart
        diveProfileChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: times,
                datasets: [
                    {
                        label: 'Depth (m)',
                        data: depths,
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        fill: true,
                        yAxisID: 'y-depth',
                        tension: 0.3
                    },
                    {
                        label: 'Temperature (°C)',
                        data: temps,
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        fill: false,
                        yAxisID: 'y-temp',
                        borderDash: [5, 5]
                    },
                    {
                        label: 'Air (bar)',
                        data: air,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: false,
                        yAxisID: 'y-air',
                        borderDash: [10, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (minutes)'
                        }
                    },
                    'y-depth': {
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Depth (m)'
                        },
                        reverse: true, // Inverted axis for depth
                        min: 0,
                        max: Math.ceil(Math.max(...depths) * 1.2)
                    },
                    'y-temp': {
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        },
                        grid: {
                            display: false
                        }
                    },
                    'y-air': {
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Air (bar)'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                return `Time: ${diveData[index].time}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Display dive data in table
    function displayDiveData(diveData) {
        const tableBody = document.getElementById('dive-data-body');
        if (!tableBody) return;
        
        // Clear existing data
        tableBody.innerHTML = '';
        
        // Add each row to table
        diveData.forEach(dive => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${dive.time}</td>
                <td>${dive.depth.toFixed(1)}</td>
                <td>${dive.air.toFixed(0)}</td>
                <td>${dive.temp.toFixed(1)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Update dive stats
    function updateDiveStats(diveData) {
        // Calculate stats
        const maxDepth = Math.max(...diveData.map(d => d.depth));
        
        // Calculate average depth (ignoring surface readings)
        const underwaterReadings = diveData.filter(d => d.depth > 0);
        const avgDepth = underwaterReadings.length > 0 
            ? underwaterReadings.reduce((sum, d) => sum + d.depth, 0) / underwaterReadings.length 
            : 0;
        
        // Calculate dive time in minutes
        const diveTimeMinutes = diveData.length > 0 
            ? diveData[diveData.length - 1].timeMinutes 
            : 0;
        
        // Calculate air used
        const startAir = diveData.length > 0 ? diveData[0].air : 0;
        const endAir = diveData.length > 0 ? diveData[diveData.length - 1].air : 0;
        const airUsed = startAir - endAir;
        
        // Calculate minimum temperature
        const minTemp = Math.min(...diveData.map(d => d.temp));
        
        // Update stats display
        document.getElementById('stat-max-depth')?.textContent = `${maxDepth.toFixed(1)} m`;
        document.getElementById('stat-avg-depth')?.textContent = `${avgDepth.toFixed(1)} m`;
        document.getElementById('stat-dive-time')?.textContent = `${diveTimeMinutes.toFixed(0)} min`;
        document.getElementById('stat-air-used')?.textContent = `${airUsed.toFixed(0)} bar`;
        document.getElementById('stat-min-temp')?.textContent = `${minTemp.toFixed(1)} °C`;
    }
    
    // Auto-fill form fields based on dive data
    function autoFillFormFields(diveData) {
        // Only fill if values are empty
        const maxDepth = Math.max(...diveData.map(d => d.depth));
        const diveTimeMinutes = diveData.length > 0 
            ? diveData[diveData.length - 1].timeMinutes 
            : 0;
        const minTemp = Math.min(...diveData.map(d => d.temp));
        
        // Fill max depth field if empty
        const maxDepthField = document.getElementById('max-depth');
        if (maxDepthField && maxDepthField.value === '') {
            maxDepthField.value = maxDepth.toFixed(1);
        }
        
        // Fill duration field if empty
        const durationField = document.getElementById('duration');
        if (durationField && durationField.value === '') {
            durationField.value = Math.round(diveTimeMinutes);
        }
        
        // Fill temperature field if empty
        const tempField = document.getElementById('water-temp');
        if (tempField && tempField.value === '') {
            tempField.value = minTemp.toFixed(1);
        }
    }
    
    // Helper function to convert time string (mm:ss) to minutes
    function convertTimeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        
        return minutes + seconds / 60;
    }
} 