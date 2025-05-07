/**
 * JavaScript file for the shark warnings page
 * Manages the display and filtering of shark warning data
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const warningsGrid = document.getElementById('warnings-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');
    const warningsCount = document.getElementById('warnings-count');
    const loadMoreButton = document.getElementById('load-more');
    const statusFilter = document.getElementById('status-filter');
    const siteFilter = document.getElementById('site-filter');
    const alertContainer = document.getElementById('alert-container');
    const warningModal = document.getElementById('warning-modal');
    const modalClose = document.querySelector('.close-modal');
    const modalBody = document.getElementById('modal-body');

    // Map placeholder - would be initialized with a real map library
    const sharkMap = document.getElementById('shark-map');
    
    // State variables
    let warnings = [];
    let diveSites = [];
    let currentPage = 1;
    let hasMorePages = false;
    let activeFilters = {
        status: 'active',
        site_id: ''
    };

    // Initialize page
    init();

    /**
     * Initialize the page
     */
    function init() {
        // Fetch initial data
        fetchWarnings();
        fetchDiveSites();
        
        // Add event listeners
        statusFilter.addEventListener('change', handleFilterChange);
        siteFilter.addEventListener('change', handleFilterChange);
        loadMoreButton.addEventListener('click', loadMoreWarnings);
        modalClose.addEventListener('click', closeModal);
        
        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            if (event.target === warningModal) {
                closeModal();
            }
        });
    }

    /**
     * Fetch shark warnings from the API
     */
    function fetchWarnings() {
        // Show loading spinner
        loadingSpinner.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        // If this is the first page, clear the grid
        if (currentPage === 1) {
            warningsGrid.innerHTML = '';
        }
        
        // Build query string from filters
        let queryString = `?page=${currentPage}`;
        if (activeFilters.status) {
            queryString += `&status=${activeFilters.status}`;
        }
        if (activeFilters.site_id) {
            queryString += `&site_id=${activeFilters.site_id}`;
        }
        
        // Use the API endpoint
        fetch('/shark/warnings/api' + queryString)
            .then(response => response.json())
            .then(data => {
                // Hide loading spinner
                loadingSpinner.classList.add('hidden');
                
                // Process the returned warnings
                processWarnings(data);
            })
            .catch(error => {
                console.error('Error fetching warnings:', error);
                loadingSpinner.classList.add('hidden');
                showAlert('Failed to load shark warnings. Please try again later.', 'danger');
            });
    }

    /**
     * Fetch dive sites for the site filter
     */
    function fetchDiveSites() {
        // In a real app, we would fetch from an API
        // For now, we'll use sample data
        diveSites = [
            { id: 1, name: 'Blue Hole' },
            { id: 2, name: 'Great Barrier Reef' },
            { id: 3, name: 'Coral Bay' },
            { id: 4, name: 'Dragon Cave' },
            { id: 5, name: 'Shark Point' }
        ];
        
        // Populate site filter dropdown
        diveSites.forEach(site => {
            const option = document.createElement('option');
            option.value = site.id;
            option.textContent = site.name;
            siteFilter.appendChild(option);
        });
    }

    /**
     * Process and display warnings
     * @param {Array} data - Warning data from API
     */
    function processWarnings(data) {
        warnings = data;
        
        // Update warnings count
        warningsCount.textContent = warnings.length;
        
        if (warnings.length === 0) {
            // Show empty state
            emptyState.classList.remove('hidden');
            loadMoreButton.classList.add('hidden');
            return;
        }
        
        // Hide empty state
        emptyState.classList.add('hidden');
        
        // Render warnings
        warnings.forEach(warning => {
            const warningCard = createWarningCard(warning);
            warningsGrid.appendChild(warningCard);
        });
        
        // Show/hide load more button based on whether there are more pages
        loadMoreButton.classList.toggle('hidden', !hasMorePages);
        
        // Update the map (in a real app)
        updateMap(warnings);
    }

    /**
     * Create a warning card element
     * @param {Object} warning - Warning data
     * @returns {HTMLElement} The warning card element
     */
    function createWarningCard(warning) {
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
                    <div class="warning-size">
                        <span class="detail-label">Size:</span>
                        <span class="detail-value">${warning.size_estimate || 'Unknown'}</span>
                    </div>
                    <div class="warning-date">
                        <span class="detail-label">Sighted:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                </div>
                <p class="warning-description">${warning.description.substring(0, 100)}${warning.description.length > 100 ? '...' : ''}</p>
            </div>
            <div class="warning-card-footer">
                <button class="view-details-btn" data-id="${warning.id}">View Details</button>
            </div>
        `;
        
        // Add event listener to the details button
        card.querySelector('.view-details-btn').addEventListener('click', () => {
            openWarningDetails(warning);
        });
        
        return card;
    }

    /**
     * Handle filter changes
     */
    function handleFilterChange() {
        // Update active filters
        activeFilters.status = statusFilter.value;
        activeFilters.site_id = siteFilter.value;
        
        // Reset to first page
        currentPage = 1;
        
        // Fetch filtered warnings
        fetchWarnings();
    }

    /**
     * Load more warnings
     */
    function loadMoreWarnings() {
        currentPage++;
        fetchWarnings();
    }

    /**
     * Open warning details modal
     * @param {Object} warning - Warning data
     */
    function openWarningDetails(warning) {
        // Set modal title
        document.getElementById('modal-title').textContent = `Shark Warning: ${warning.site_name}`;
        
        // Format dates
        const sightingDate = new Date(warning.sighting_time);
        const reportDate = new Date(warning.report_time);
        const formattedSightingDate = sightingDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const formattedReportDate = reportDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determine severity class and text
        let severityClass = 'severity-low';
        let severityText = 'Low Risk';
        if (warning.severity === 'medium') {
            severityClass = 'severity-medium';
            severityText = 'Medium Risk';
        } else if (warning.severity === 'high') {
            severityClass = 'severity-high';
            severityText = 'High Risk';
        }
        
        // Update modal content
        modalBody.innerHTML = `
            <div class="modal-warning-header ${severityClass}">
                <div class="modal-warning-severity">${severityText}</div>
                <div class="modal-warning-status">${warning.status.toUpperCase()}</div>
            </div>
            
            <div class="modal-warning-content">
                <div class="modal-warning-main">
                    <div class="modal-warning-info">
                        <h3>Warning Details</h3>
                        <div class="detail-row">
                            <span class="detail-label">Dive Site:</span>
                            <span class="detail-value">${warning.site_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Species:</span>
                            <span class="detail-value">${warning.species || 'Unknown'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Size Estimate:</span>
                            <span class="detail-value">${warning.size_estimate || 'Unknown'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Sighting Time:</span>
                            <span class="detail-value">${formattedSightingDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Reported By:</span>
                            <span class="detail-value">${warning.reporter_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Report Time:</span>
                            <span class="detail-value">${formattedReportDate}</span>
                        </div>
                    </div>
                    
                    ${warning.photo_url ? `
                    <div class="modal-warning-photo">
                        <img src="${warning.photo_url}" alt="Shark sighting photo">
                    </div>
                    ` : ''}
                </div>
                
                <div class="modal-warning-description">
                    <h3>Description</h3>
                    <p>${warning.description}</p>
                </div>
            </div>
        `;
        
        // Show the modal
        warningModal.style.display = 'block';
    }

    /**
     * Close the warning details modal
     */
    function closeModal() {
        warningModal.style.display = 'none';
    }

    /**
     * Update the shark activity map
     * @param {Array} warnings - Warning data
     */
    function updateMap(warnings) {
        // In a real app, this would update a map library like Google Maps or Leaflet
        // For now, we'll just show a placeholder
        sharkMap.innerHTML = `
            <div class="map-placeholder">
                <div class="map-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>Map showing ${warnings.length} shark warnings</p>
                    <p class="map-note">In a real application, this would display an interactive map with shark sighting locations.</p>
                </div>
            </div>
        `;
    }

    /**
     * Show alert message
     * @param {String} message - Alert message
     * @param {String} type - Alert type (success, danger, warning)
     */
    function showAlert(message, type) {
        alertContainer.innerHTML = `
            <div class="alert alert-${type}">
                ${message}
            </div>
        `;
        
        // Auto-hide alert after 5 seconds
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }
});