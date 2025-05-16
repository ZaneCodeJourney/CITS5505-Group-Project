document.addEventListener('DOMContentLoaded', function() {
    // The dive_profile_chart.js library will handle chart initialization 
    // when the page loads. No need for manual initialization.
    
    // Setup event listeners for View Details buttons
    setupEventListeners();
    
    // Initialize maps for shared dives
    initializeMaps();
});

function setupEventListeners() {
    // View details buttons
    const viewDetailsButtons = document.querySelectorAll('.view-details');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                const token = this.dataset.token;
                // Redirect to shared dive details page
                window.location.href = `/shared/dive/${token}`;
            }
        });
    });
    
    // Toggle details buttons
    const toggleButtons = document.querySelectorAll('.toggle-details');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const diveId = this.dataset.diveId;
            const detailsSection = document.querySelector(`.details-section[data-dive-id="${diveId}"]`);
            
            if (detailsSection) {
                const isVisible = detailsSection.style.display !== 'none';
                detailsSection.style.display = isVisible ? 'none' : 'block';
                this.textContent = isVisible ? 'Show Details' : 'Hide Details';
                
                // Invalidate map size when shown
                if (!isVisible) {
                    const mapContainer = detailsSection.querySelector('.dive-map');
                    if (mapContainer && mapContainer.map) {
                        setTimeout(() => mapContainer.map.invalidateSize(), 100);
                    }
                }
            }
        });
    });
}

function initializeMaps() {
    // Find all map containers
    const mapContainers = document.querySelectorAll('.dive-map');
    
    mapContainers.forEach(container => {
        // Get dive coordinates from data attributes
        const lat = parseFloat(container.dataset.lat || 0);
        const lng = parseFloat(container.dataset.lng || 0);
        const zoom = parseInt(container.dataset.zoom || 13);
        const diveId = container.dataset.diveId;
        
        if (lat && lng) {
            // Initialize map
            const map = L.map(container.id).setView([lat, lng], zoom);
            
            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Add marker at dive location
            const marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(`<strong>Dive #${diveId}</strong><br>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            
            // Store map instance in data attribute for later access
            container.map = map;
            
            // Force a map resize when it becomes visible (for maps in initially hidden elements)
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'style' && 
                        container.style.display !== 'none' && 
                        container.offsetParent !== null) {
                        setTimeout(function() {
                            map.invalidateSize();
                        }, 100);
                    }
                });
            });
            observer.observe(container, { attributes: true });
        }
    });
} 