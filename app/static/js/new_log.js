// Initialize the map
let map;
let marker;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map if the map container exists
    const mapContainer = document.getElementById('dive-location-map');
    if (mapContainer) {
        // Initialize map centered at a default location (Great Barrier Reef)
        map = L.map('dive-location-map').setView([-16.7, 145.8], 10);
        
        // Add the tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
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

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formElement = e.target;
    const photoFile = document.getElementById('dive-photos').files[0];
    
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
    diveData.user_id = 1; // This would normally come from the logged-in user session
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
        // Step 1: Submit dive data to API
        const response = await fetch('/api/dives/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(diveData)
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Success - dive created:', result);
        
        const diveId = result.id;
        
        // Step 2: Upload media file if one was selected
        if (photoFile) {
            const mediaFormData = new FormData();
            mediaFormData.append('media', photoFile);
            
            const uploadResponse = await fetch(`/api/dives/${diveId}/upload`, {
                method: 'POST',
                body: mediaFormData
            });
            
            if (!uploadResponse.ok) {
                console.warn('File upload failed, but dive was created');
            } else {
                const uploadResult = await uploadResponse.json();
                console.log('Media upload success:', uploadResult);
            }
        }
        
        // Show success message and redirect to my-logs page
        alert('Dive log created successfully!');
        window.location.href = '/my-logs?success=dive_created';
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to save dive log. Please try again.');
    }
} 