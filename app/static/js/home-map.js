// Initialize map on the homepage
document.addEventListener('DOMContentLoaded', function() {
    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Initialize the map
    const map = L.map('map').setView([0, 0], 2);

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

    // Sample dive site locations
    const diveSites = [
        {
            name: "Great Barrier Reef - Cod Hole",
            location: [-16.6818, 145.9919],
            description: "Famous for its friendly potato cod, offering amazing underwater encounters.",
            difficulty: "Intermediate",
            visibility: "15-30m",
            depthRange: "5-25m"
        },
        {
            name: "Blue Hole - Belize",
            location: [17.3162, -87.5351],
            description: "Perfect circular limestone sinkhole with crystal clear water.",
            difficulty: "Advanced",
            visibility: "30m+",
            depthRange: "10-40m"
        },
        {
            name: "Silfra Fissure - Iceland",
            location: [64.2558, -21.1168],
            description: "Dive between two continental plates with incredible visibility.",
            difficulty: "Intermediate",
            visibility: "100m+",
            depthRange: "5-18m"
        },
        {
            name: "SS Yongala - Australia",
            location: [-19.3056, 147.6234],
            description: "Historic shipwreck with abundant marine life.",
            difficulty: "Advanced",
            visibility: "10-30m",
            depthRange: "14-28m"
        },
        {
            name: "Manta Ray Night Dive - Kona, Hawaii",
            location: [19.5429, -156.0378],
            description: "Evening dive with majestic manta rays feeding on plankton.",
            difficulty: "Beginner to Intermediate",
            visibility: "15-25m",
            depthRange: "10-15m"
        },
        {
            name: "Barracuda Point - Sipadan, Malaysia",
            location: [4.1155, 118.6290],
            description: "Famous for its swirling tornado of barracudas and strong currents.",
            difficulty: "Intermediate to Advanced",
            visibility: "20-30m",
            depthRange: "10-40m"
        },
        {
            name: "Richelieu Rock - Thailand",
            location: [9.3625, 98.0215],
            description: "Horseshoe-shaped reef known for whale shark sightings.",
            difficulty: "Intermediate",
            visibility: "10-30m",
            depthRange: "5-35m"
        },
        {
            name: "Thistlegorm Wreck - Red Sea, Egypt",
            location: [27.8139, 33.9220],
            description: "WWII cargo ship with fascinating cargo including motorcycles and trucks.",
            difficulty: "Intermediate",
            visibility: "15-30m",
            depthRange: "15-30m"
        },
        {
            name: "Cenote Dos Ojos - Mexico",
            location: [20.3308, -87.3856],
            description: "Stunning cave system with crystal clear freshwater.",
            difficulty: "Intermediate to Advanced",
            visibility: "30-40m",
            depthRange: "5-10m"
        },
        {
            name: "Poor Knights Islands - New Zealand",
            location: [-35.4458, 174.7369],
            description: "Volcanic islands with diverse marine life and underwater arches.",
            difficulty: "Beginner to Advanced",
            visibility: "15-30m",
            depthRange: "5-40m"
        },
        {
            name: "Ningaloo Reef - WA",
            location: [-22.6936, 113.6732],
            description: "UNESCO World Heritage site known for whale shark encounters and pristine coral.",
            difficulty: "Beginner to Advanced",
            visibility: "10-30m",
            depthRange: "5-20m"
        },
        {
            name: "Rottnest Island - Perth, WA",
            location: [-32.0067, 115.5160],
            description: "Multiple dive sites with limestone reefs, caves and abundant fish life.",
            difficulty: "Beginner to Intermediate",
            visibility: "10-25m",
            depthRange: "8-18m"
        },
        {
            name: "Andaman Islands - India",
            location: [12.0, 92.9],
            description: "Remote archipelago with untouched reefs, WWII wrecks and diverse marine life.",
            difficulty: "Beginner to Advanced",
            visibility: "10-30m",
            depthRange: "5-40m"
        },
        {
            name: "Netrani Island - Karnataka, India",
            location: [14.0167, 74.3333],
            description: "Heart-shaped island with coral gardens and occasional whale shark sightings.",
            difficulty: "Beginner to Intermediate",
            visibility: "10-25m",
            depthRange: "8-20m"
        },
        {
            name: "Lakshadweep Islands - India",
            location: [10.5667, 72.6417],
            description: "Pristine coral atolls with crystal clear waters and abundant marine life.",
            difficulty: "Beginner to Intermediate",
            visibility: "15-30m",
            depthRange: "5-25m"
        },
        {
            name: "Maaya Thila - North Ari Atoll, Maldives",
            location: [4.0167, 72.8333],
            description: "Famous pinnacle with white tip reef sharks, stingrays and colorful soft corals.",
            difficulty: "Intermediate to Advanced",
            visibility: "15-30m",
            depthRange: "6-30m"
        },
        {
            name: "Fish Head - Ari Atoll, Maldives",
            location: [3.9333, 72.9167],
            description: "Marine protected area with grey reef sharks, napoleons and large pelagics.",
            difficulty: "Intermediate",
            visibility: "20-30m",
            depthRange: "10-35m"
        }
    ];

    // Custom icon for dive sites
    const diveIcon = L.icon({
        iconUrl: '/static/images/dive-marker.png',
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

    // Add markers for each dive site
    diveSites.forEach(site => {
        const marker = L.marker(site.location, {
            icon: diveIcon,
            alt: site.name
        }).addTo(map);

        // Add tooltip that shows on hover
        marker.bindTooltip(site.name, {
            direction: 'top',
            offset: [0, -32],
            permanent: false,
            opacity: 0.9,
            className: 'dive-site-tooltip'
        });

        // Create popup content
        const popupContent = `
            <div class="dive-site-popup">
                <h3>${site.name}</h3>
                <p>${site.description}</p>
                <div class="dive-site-details">
                    <div class="detail"><strong>Difficulty:</strong> ${site.difficulty}</div>
                    <div class="detail"><strong>Visibility:</strong> ${site.visibility}</div>
                    <div class="detail"><strong>Depth Range:</strong> ${site.depthRange}</div>
                </div>
                <a href="#" class="popup-link">View Dive Logs</a>
            </div>
        `;

        // Bind popup to marker
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'dive-site-popup'
        });

        // Handle marker errors
        marker.on('error', function() {
            this.setIcon(defaultIcon);
        });
    });
}); 