/**
 * Google Maps integration for shark warnings
 */

// Global map variable
let map;
let markers = [];

// Real dive locations with coordinates
const diveLocations = [
    {
        id: 1,
        name: 'Great Barrier Reef',
        lat: -16.7551,
        lng: 145.9853,
        description: 'The world\'s largest coral reef system'
    },
    {
        id: 2,
        name: 'Blue Corner, Palau',
        lat: 7.1390,
        lng: 134.2210,
        description: 'Famous for its strong currents and schools of sharks'
    },
    {
        id: 3,
        name: 'Ningaloo Reef',
        lat: -22.3323,
        lng: 113.9273,
        description: 'Home to whale sharks from March to August'
    },
    {
        id: 4,
        name: 'Barracuda Point, Sipadan',
        lat: 4.1147,
        lng: 118.6276,
        description: 'World-renowned for its tornados of barracudas'
    },
    {
        id: 5,
        name: 'Raja Ampat',
        lat: -0.5897,
        lng: 130.6794,
        description: 'Highest marine biodiversity on Earth'
    }
];

// Sample shark warning data
const sampleWarnings = [
    {
        id: 1,
        site_name: 'Great Barrier Reef',
        lat: -16.7551,
        lng: 145.9853,
        species: 'Great White Shark',
        severity: 'high',
        status: 'active',
        description: 'Large great white spotted near reef edge',
        sighting_time: new Date().toISOString()
    },
    {
        id: 2,
        site_name: 'Ningaloo Reef',
        lat: -22.3323,
        lng: 113.9273,
        species: 'Tiger Shark',
        severity: 'medium',
        status: 'active',
        description: 'Multiple tiger sharks in feeding pattern',
        sighting_time: new Date().toISOString()
    },
    {
        id: 3,
        site_name: 'Raja Ampat',
        lat: -0.5897,
        lng: 130.6794,
        species: 'Blacktip Reef Shark',
        severity: 'low',
        status: 'active',
        description: 'Small group of blacktip reef sharks',
        sighting_time: new Date().toISOString()
    }
];

// Initialize Google Map
function initMap() {
    // Check if we have dive locations
    if (diveLocations.length === 0) {
        console.error('No dive locations found');
        return;
    }

    // Create map centered on the average position of all locations
    const center = calculateMapCenter(diveLocations);
    
    // Initialize the Google Map
    map = new google.maps.Map(document.getElementById("shark-map"), {
        zoom: 4,
        center: center,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    // Add dive location markers
    addDiveLocationMarkers();
    
    // Add shark warning markers
    addSharkWarningMarkers(sampleWarnings);
    
    // Update the site filter dropdown
    updateSiteFilter();
    
    // Update warnings count
    document.getElementById('warnings-count').textContent = sampleWarnings.length;
    
    // Create warning cards
    createWarningCards(sampleWarnings);
    
    // Hide loading indicators
    document.getElementById('loading-spinner').classList.add('hidden');
}

// Calculate map center based on all locations
function calculateMapCenter(locations) {
    if (locations.length === 0) {
        return { lat: 0, lng: 0 }; // Default center
    }
    
    // Calculate average lat/lng
    let totalLat = 0;
    let totalLng = 0;
    
    locations.forEach(location => {
        totalLat += location.lat;
        totalLng += location.lng;
    });
    
    return {
        lat: totalLat / locations.length,
        lng: totalLng / locations.length
    };
}

// Add dive location markers to the map
function addDiveLocationMarkers() {
    diveLocations.forEach(location => {
        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.name,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `<div><strong>${location.name}</strong><p>${location.description}</p></div>`
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
    });
}

// Add shark warning markers to the map
function addSharkWarningMarkers(warnings) {
    warnings.forEach(warning => {
        let iconUrl;
        
        // Set icon based on severity
        switch (warning.severity) {
            case 'high':
                iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
                break;
            case 'medium':
                iconUrl = 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
                break;
            case 'low':
            default:
                iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
                break;
        }
        
        const marker = new google.maps.Marker({
            position: { lat: warning.lat, lng: warning.lng },
            map: map,
            title: `${warning.species} at ${warning.site_name}`,
            icon: {
                url: iconUrl,
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        
        // Format date
        const sightingDate = new Date(warning.sighting_time);
        const formattedDate = sightingDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Add info window with warning details
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="warning-info-window">
                    <h3>${warning.species}</h3>
                    <p><strong>Location:</strong> ${warning.site_name}</p>
                    <p><strong>Severity:</strong> ${warning.severity.toUpperCase()}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p>${warning.description}</p>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
    });
}

// Update site filter dropdown with real locations
function updateSiteFilter() {
    const siteFilter = document.getElementById('site-filter');
    
    // Clear existing options except first one
    while (siteFilter.options.length > 1) {
        siteFilter.remove(1);
    }
    
    // Add dive locations as options
    diveLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        siteFilter.appendChild(option);
    });
}

// Create warning cards in the UI
function createWarningCards(warnings) {
    const warningsGrid = document.getElementById('warnings-grid');
    warningsGrid.innerHTML = ''; // Clear existing cards
    
    warnings.forEach(warning => {
        const card = document.createElement('div');
        card.className = 'warning-card';
        
        // Determine severity class
        let severityClass = 'severity-low';
        if (warning.severity === 'medium') {
            severityClass = 'severity-medium';
        } else if (warning.severity === 'high') {
            severityClass = 'severity-high';
        }
        
        // Format date
        const sightingDate = new Date(warning.sighting_time);
        const formattedDate = sightingDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Create card content
        card.innerHTML = `
            <div class="warning-card-header ${severityClass}">
                <span class="warning-severity">${warning.severity.toUpperCase()} RISK</span>
                <span class="warning-status">${warning.status.toUpperCase()}</span>
            </div>
            <div class="warning-card-content">
                <h3 class="warning-site">${warning.site_name}</h3>
                <div class="warning-details">
                    <div class="warning-species">
                        <span class="detail-label">Species:</span>
                        <span class="detail-value">${warning.species || 'Unknown'}</span>
                    </div>
                    <div class="warning-date">
                        <span class="detail-label">Sighted:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                </div>
                <p class="warning-description">${warning.description}</p>
            </div>
            <div class="warning-card-footer">
                <button class="view-details-btn" data-id="${warning.id}">View Details</button>
            </div>
        `;
        
        // Add to grid
        warningsGrid.appendChild(card);
    });
}

// Event handlers for filter changes
document.addEventListener('DOMContentLoaded', function() {
    const statusFilter = document.getElementById('status-filter');
    const siteFilter = document.getElementById('site-filter');
    
    if (statusFilter && siteFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
        siteFilter.addEventListener('change', handleFilterChange);
    }
    
    // Add event listeners to modal close button
    const modalClose = document.querySelector('.close-modal');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
});

// Handle filter changes
function handleFilterChange() {
    // In a real app, this would filter the data from the backend
    // For now, we'll just show all warnings
    createWarningCards(sampleWarnings);
}

// Close the warning details modal
function closeModal() {
    const warningModal = document.getElementById('warning-modal');
    if (warningModal) {
        warningModal.style.display = 'none';
    }
} 