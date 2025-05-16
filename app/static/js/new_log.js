// Initialize the map
let map;
let marker;
let selectedSpecies = []; // Array to store selected species

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map if the map container exists
    const mapContainer = document.getElementById('dive-location-map');
    if (mapContainer) {
        // Initialize map without a specific center - will default to a world view
        map = L.map('dive-location-map', {
            center: [0, 0],
            zoom: 2,
            worldCopyJump: true
        });
        
        // Add the tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Try to use browser geolocation to center the map if permission is granted
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    map.setView([lat, lng], 10);
                },
                function(error) {
                    console.log("Geolocation error or permission denied:", error);
                    // Keep default world view
                }
            );
        }
        
        // Add click event to the map
        map.on('click', function(e) {
            addMarker(e.latlng);
            updateCoordinateInputs(e.latlng);
        });
        
        // Check if we already have coordinates in the inputs
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        if (latInput.value && lngInput.value) {
            const latLng = L.latLng(parseFloat(latInput.value), parseFloat(lngInput.value));
            addMarker(latLng);
            map.setView(latLng, 10);
        }
        
        // Update map when coordinates are manually entered
        latInput.addEventListener('change', updateMapFromInputs);
        lngInput.addEventListener('change', updateMapFromInputs);
    }
    
    // Set up form submission
    const diveLogForm = document.getElementById('diveLogForm');
    if (diveLogForm) {
        diveLogForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Set up cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
    
    // Setup date defaults
    const dateInput = document.getElementById('dive-date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        dateInput.value = formattedDate;
    }
    
    // Setup file input preview
    const fileInput = document.getElementById('dive-photos');
    if (fileInput) {
        fileInput.addEventListener('change', handleFilePreview);
    }

    // Setup species search
    const searchButton = document.getElementById('search-species-btn');
    const searchInput = document.getElementById('species-search');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            searchSpecies(searchInput.value);
        });
        
        // Also search when pressing Enter in the search field
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                searchSpecies(searchInput.value);
            }
        });
    }
});

// Add a marker to the map
function addMarker(latLng) {
    // Remove existing marker if there is one
    if (marker) {
        map.removeLayer(marker);
    }
    
    // Add new marker
    marker = L.marker(latLng).addTo(map);
}

// Update coordinate inputs when the map is clicked
function updateCoordinateInputs(latLng) {
    document.getElementById('latitude').value = latLng.lat.toFixed(6);
    document.getElementById('longitude').value = latLng.lng.toFixed(6);
}

// Update map when coordinate inputs change
function updateMapFromInputs() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    if (latInput.value && lngInput.value) {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const latLng = L.latLng(lat, lng);
            addMarker(latLng);
            map.setView(latLng, 10);
        }
    }
}

// Preview uploaded files
function handleFilePreview(e) {
    const previewContainer = document.getElementById('photo-preview');
    previewContainer.innerHTML = '';
    
    const files = e.target.files;
    
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.classList.add('preview-image');
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                previewContainer.appendChild(img);
            }
        }
    }
}

// Search for species using the iNaturalist API
async function searchSpecies(query) {
    if (!query || query.trim().length < 2) {
        alert('Please enter at least 2 characters to search for species.');
        return;
    }

    const searchResults = document.getElementById('species-search-results');
    searchResults.innerHTML = '<p>Searching...</p>';
    searchResults.classList.add('active');

    try {
        const response = await fetch(`/api/species/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error('Species search failed');
        }
        
        const data = await response.json();
        
        // Display results
        searchResults.innerHTML = '';
        
        if (data.length === 0) {
            searchResults.innerHTML = '<p>No species found. Try a different search term.</p>';
            return;
        }
        
        for (const species of data) {
            const resultItem = document.createElement('div');
            resultItem.className = 'species-result-item';
            
            const speciesInfo = document.createElement('div');
            speciesInfo.className = 'species-info';
            
            const speciesName = document.createElement('div');
            speciesName.className = 'species-name';
            speciesName.textContent = species.common_name || 'Unknown common name';
            
            const speciesScientific = document.createElement('div');
            speciesScientific.className = 'species-scientific';
            speciesScientific.textContent = species.scientific_name;
            
            speciesInfo.appendChild(speciesName);
            speciesInfo.appendChild(speciesScientific);
            
            const addButton = document.createElement('button');
            addButton.className = 'add-species-btn';
            addButton.textContent = 'Add';
            addButton.type = 'button';
            addButton.addEventListener('click', function() {
                addSpeciesToSelection(species);
                searchResults.classList.remove('active');
                document.getElementById('species-search').value = '';
            });
            
            resultItem.appendChild(speciesInfo);
            resultItem.appendChild(addButton);
            
            searchResults.appendChild(resultItem);
        }
    } catch (error) {
        console.error('Error searching for species:', error);
        searchResults.innerHTML = '<p>Error searching for species. Please try again.</p>';
    }
}

// Add a species to the selected species list
function addSpeciesToSelection(species) {
    // Check if species is already in the selection
    if (selectedSpecies.some(s => s.taxon_id === species.taxon_id)) {
        return;
    }
    
    // Add to our selected species array
    selectedSpecies.push(species);
    
    // Update the UI
    updateSelectedSpeciesUI();
}

// Update the selected species UI
function updateSelectedSpeciesUI() {
    const container = document.getElementById('selected-species-container');
    const noSpeciesMessage = document.getElementById('no-species-message');
    
    // Clear container (except for the no-species message)
    const tags = container.querySelectorAll('.species-tag');
    tags.forEach(tag => tag.remove());
    
    // Show/hide the "no species" message
    if (selectedSpecies.length === 0) {
        noSpeciesMessage.style.display = 'block';
        return;
    } else {
        noSpeciesMessage.style.display = 'none';
    }
    
    // Add each species as a tag
    for (let i = 0; i < selectedSpecies.length; i++) {
        const species = selectedSpecies[i];
        
        const tag = document.createElement('div');
        tag.className = 'species-tag';
        
        const tagName = document.createElement('span');
        tagName.className = 'species-tag-name';
        tagName.textContent = species.common_name || species.scientific_name;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'species-tag-remove';
        removeButton.innerHTML = '&times;';
        removeButton.setAttribute('title', 'Remove');
        removeButton.type = 'button'; // Prevent form submission
        removeButton.addEventListener('click', function() {
            removeSpeciesFromSelection(i);
        });
        
        tag.appendChild(tagName);
        tag.appendChild(removeButton);
        
        container.appendChild(tag);
    }
}

// Remove a species from the selection
function removeSpeciesFromSelection(index) {
    selectedSpecies.splice(index, 1);
    updateSelectedSpeciesUI();
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formElement = e.target;
    const photoFile = document.getElementById('dive-photos').files[0];
    const csvFile = document.getElementById('dive-profile-csv').files[0];
    
    // Extract form data (excluding file inputs)
    const formData = new FormData(formElement);
    const diveData = {};
    
    // Convert form data to JSON payload
    const dateInput = document.getElementById('dive-date').value;
    const startTimeInput = document.getElementById('start-time').value || '00:00';
    const endTimeInput = document.getElementById('end-time').value || '00:00';
    
    // Create ISO datetime strings for start and end times
    const startTimeISOString = `${dateInput}T${startTimeInput}:00`;
    const endTimeISOString = `${dateInput}T${endTimeInput}:00`;
    
    // Required fields from our dive model
    diveData.location = formData.get('location');
    diveData.start_time = startTimeISOString;
    diveData.end_time = endTimeISOString;
    diveData.max_depth = parseFloat(formData.get('max_depth'));
    
    // Optional fields
    if (formData.get('weight_belt')) diveData.weight_belt = formData.get('weight_belt');
    if (formData.get('visibility')) diveData.visibility = formData.get('visibility');
    if (formData.get('weather')) diveData.weather = formData.get('weather');
    if (formData.get('dive_partner')) diveData.dive_partner = formData.get('dive_partner');
    if (formData.get('notes')) diveData.notes = formData.get('notes');
    
    // Add latitude and longitude if available
    const lat = document.getElementById('latitude').value;
    const lng = document.getElementById('longitude').value;
    if (lat && lng) {
        diveData.location += ` (${lat}, ${lng})`;
    }
    
    console.log('Submitting dive data:', diveData);
    
    try {
        // Step 1: Create dive using our centralized API request function
        const result = await apiRequest('/api/dives/', 'POST', diveData);
        console.log('Success - dive created:', result);
        
        const diveId = result.id;
        
        // Step 2: Upload media file if one was selected
        if (photoFile) {
            const mediaFormData = new FormData();
            mediaFormData.append('media', photoFile);
            
            // Use our centralized file upload function
            const uploadResult = await uploadFile(`/api/dives/${diveId}/upload`, mediaFormData);
            console.log('Media upload success:', uploadResult);
        }
        
        // Step 3: Upload CSV file if one was selected
        if (csvFile) {
            console.log("Uploading CSV file:", csvFile.name, "size:", csvFile.size, "type:", csvFile.type);
            
            // Basic client-side validation
            if (!csvFile.name.toLowerCase().endsWith('.csv')) {
                console.warn('Not a CSV file');
                alert('Please select a CSV file (must have .csv extension)');
                window.location.href = '/my-logs?success=dive_created';
                return;
            }
            
            const csvFormData = new FormData();
            csvFormData.append('profile_csv', csvFile);
            
            try {
                console.log(`Sending CSV upload request to /api/dives/${diveId}/upload-csv`);
                
                // Use the centralized file upload function that handles CSRF tokens
                const csvUploadResult = await uploadFile(`/api/dives/${diveId}/upload-csv`, csvFormData);
                
                console.log('CSV data upload success:', csvUploadResult);
            } catch (error) {
                console.error('CSV upload error:', error);
                alert('The dive log was created, but there was an issue uploading the CSV file. You can try adding it later.');
            }
        }
        
        // Step 4: Add selected species to the dive
        if (selectedSpecies.length > 0) {
            console.log('Adding species to dive:', selectedSpecies);
            
            try {
                for (const species of selectedSpecies) {
                    await apiRequest(`/api/species/dive/${diveId}/species`, 'POST', {
                        taxon_id: species.taxon_id,
                        scientific_name: species.scientific_name,
                        common_name: species.common_name,
                        rank: species.rank
                    });
                }
                console.log('All species added successfully');
                window.location.href = '/my-logs?success=dive_created_with_species';
            } catch (error) {
                console.error('Error adding species:', error);
                alert('The dive log was created, but there was an issue adding some species. You can add them later.');
                window.location.href = '/my-logs?success=dive_created';
            }
        } else {
            // No species selected, just redirect to logs page
            window.location.href = '/my-logs?success=dive_created';
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to save dive log: ' + error.message);
    }
} 