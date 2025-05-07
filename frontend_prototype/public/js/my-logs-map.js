// Initialize map on the My Logs page
document.addEventListener('DOMContentLoaded', function() {
    // Check if map container exists
    const mapContainer = document.getElementById('my-dive-map');
    if (!mapContainer) return;

    // Initialize the map
    const map = L.map('my-dive-map').setView([0, 0], 2);

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

    // Sample user's dive log data
    const userDiveLogs = [
        {
            id: 1,
            name: "Great Barrier Reef - Cod Hole",
            location: [-16.6818, 145.9919],
            date: "May 12, 2023",
            depth: "18m",
            duration: "48 min",
            waterTemp: "24°C",
            visibility: "15m",
            notes: "Amazing dive with great visibility. Saw plenty of colorful coral and a massive potato cod!",
            isPublic: true,
            buddies: ["Sarah", "Mike"]
        },
        {
            id: 2,
            name: "Silfra Fissure - Iceland",
            location: [64.2558, -21.1168],
            date: "April 2, 2023",
            depth: "12m",
            duration: "35 min",
            waterTemp: "2°C",
            visibility: "100m+",
            notes: "Incredible crystal clear water! Very cold but the drysuit kept me comfortable. Amazing experience diving between continental plates.",
            isPublic: false,
            buddies: ["Emma"]
        },
        {
            id: 3,
            name: "Blue Hole - Belize",
            location: [17.3162, -87.5351],
            date: "January 15, 2023",
            depth: "32m",
            duration: "42 min",
            waterTemp: "26°C",
            visibility: "30m",
            notes: "Amazing cave dive with perfect conditions. Spotted several reef sharks and a large school of jacks.",
            isPublic: true,
            buddies: ["Alex", "James"]
        },

        {
            id: 4,
            name: "Netrani Island - Karnataka, India",
            location: [14.0167, 74.3333],
            date: "July 20, 2023",
            depth: "18m",
            duration: "45 min",
            waterTemp: "28°C",
            visibility: "15m",
            notes: "Heart-shaped island with coral gardens and occasional whale shark sightings. Beautiful dive site with rich marine life.",
            isPublic: true,
            buddies: ["Raj", "Priya"]
        },

        {
            id: 5,
            name: "Helengeli - Maldives",
            location: [4.3167, 73.5833],
            date: "September 8, 2023",
            depth: "22m",
            duration: "55 min",
            waterTemp: "29°C",
            visibility: "25m",
            notes: "Spectacular reef dive with abundant marine life. Encountered manta rays, reef sharks, and colorful coral formations. Perfect conditions with gentle current.",
            isPublic: true,
            buddies: ["Maya", "David"]
        },

        


    ];

    // Custom icons for dive logs based on visibility
    const publicDiveIcon = L.icon({
        iconUrl: 'public/images/dive-marker.png', // You'll need to create these icons
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const privateDiveIcon = L.icon({
        iconUrl: 'public/images/dive-marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    // Fallback icon if custom icon fails to load
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

    // Add markers for each dive log
    userDiveLogs.forEach(log => {
        // Choose icon based on privacy setting
        const icon = log.isPublic ? publicDiveIcon : privateDiveIcon;
        
        const marker = L.marker(log.location, {
            icon: icon,
            alt: log.name
        }).addTo(map);

        // Format buddies list
        const buddiesHtml = log.buddies.length > 0 
            ? `<div class="detail"><strong>Buddies:</strong> ${log.buddies.join(', ')}</div>`
            : '';

        // Create popup content
        const popupContent = `
            <div class="dive-log-popup">
                <h3>${log.name}</h3>
                <div class="dive-date">${log.date}</div>
                <div class="dive-log-details">
                    <div class="detail"><strong>Depth:</strong> ${log.depth}</div>
                    <div class="detail"><strong>Duration:</strong> ${log.duration}</div>
                    <div class="detail"><strong>Water Temp:</strong> ${log.waterTemp}</div>
                    <div class="detail"><strong>Visibility:</strong> ${log.visibility}</div>
                    ${buddiesHtml}
                </div>
                <div class="dive-notes">
                    <p>${log.notes}</p>
                </div>
                <div class="dive-visibility">
                    <span class="${log.isPublic ? 'public-badge' : 'private-badge'}">
                        ${log.isPublic ? 'Public' : 'Private'}
                    </span>
                </div>
                <div class="popup-actions">
                    <a href="#" class="popup-link view-log" data-id="${log.id}">View Details</a>
                    <a href="#" class="popup-link edit-log" data-id="${log.id}">Edit</a>
                </div>
            </div>
        `;

        // Bind popup to marker
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'dive-log-popup'
        });

        // Handle marker errors
        marker.on('error', function() {
            this.setIcon(defaultIcon);
        });

        // Add this location to bounds
        bounds.extend(log.location);
    });

    // Fit the map to show all dive sites with some padding
    if (bounds.isValid()) {
        map.fitBounds(bounds, {
            padding: [50, 50], // Add padding around bounds
            maxZoom: 10 // Limit zoom level
        });
    }

    // Add event listeners for filter changes
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            // Here you would implement filtering logic based on form values
            console.log('Filters applied');
        });
    }

    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Reset filter form values
            const filterForm = document.querySelectorAll('.filter-section input, .filter-section select');
            filterForm.forEach(input => {
                if (input.type === 'date' || input.type === 'number' || input.tagName === 'SELECT') {
                    input.value = '';
                }
            });
            console.log('Filters reset');
        });
    }

    // Initialize dive profile chart if it exists
    initDiveProfileChart();
});

// Initialize dive profile chart
function initDiveProfileChart() {
    const chartCanvas = document.getElementById('dive-profile-chart-log');
    if (!chartCanvas) return;
    
    // Sample dive data
    const times = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48];
    const depths = [0, 5, 10, 15, 20, 25, 22, 20, 18, 20, 22, 25, 20, 15, 10, 5, 0];
    const temps = [26, 25, 24, 23, 22, 21, 21, 21, 21, 21, 21, 21, 22, 22, 23, 24, 25];
    const air = [200, 190, 180, 170, 160, 150, 140, 135, 130, 125, 120, 115, 110, 105, 104, 104, 104];
    
    // Create chart
    const diveProfileChart = new Chart(chartCanvas, {
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
                    max: 30
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
            }
        }
    });
} 