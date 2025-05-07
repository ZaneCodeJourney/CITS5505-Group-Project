/**
 * JavaScript file for the shark warnings list page
 */

// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const warningsListContainer = document.getElementById('warnings-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');
    const statusFilter = document.getElementById('status-filter');
    const siteFilter = document.getElementById('site-filter');
    const alertContainer = document.getElementById('alert-container');
    const paginationContainer = document.getElementById('pagination');

    // Pagination settings
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalItems = 0;

    // Filter settings
    let currentStatus = 'active';
    let currentSiteId = '';

    // Initialize page
    init();

    /**
     * Initialization function
     */
    function init() {
        // Load dive sites list
        loadDiveSites();

        // Load shark warnings list
        loadSharkWarnings();

        // Add event listeners
        statusFilter.addEventListener('change', handleFilterChange);
        siteFilter.addEventListener('change', handleFilterChange);
    }

    /**
     * Load dive sites list
     */
    function loadDiveSites() {
        // Use fetch API to get dive sites data
        fetch('/api/sites?limit=100')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // Populate the dive site selector
                    const sites = data.data.sites;
                    sites.forEach(site => {
                        const option = document.createElement('option');
                        option.value = site.site_id;
                        option.textContent = site.name;
                        siteFilter.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading dive sites:', error);
                showAlert('Failed to load dive sites. Please try again later.', 'danger');
            });
    }

/**
 * Load shark warnings list
 */
function loadSharkWarnings() {
    // Show loading indicator
    showLoading(true);

    // Build API URL
    let url = `/api/shark-warnings?page=${currentPage}&limit=${itemsPerPage}`;

    if (currentStatus) {
        url += `&status=${currentStatus}`;
    }

    if (currentSiteId) {
        url += `&site_id=${currentSiteId}`;
    }

    // Use fetch API to get shark warnings data
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide loading indicator
            showLoading(false);

            if (data.status === 'success') {
                const warnings = data.data.warnings;
                totalItems = data.data.pagination.total_items;

                // Render shark warnings list
                renderWarningsList(warnings);

                // Render pagination
                renderPagination();
            } else {
                throw new Error('Failed to fetch warnings');
            }
        })
        .catch(error => {
            showLoading(false);
            console.error('Error loading shark warnings:', error);
            showAlert('Failed to load shark warnings. Please try again later.', 'danger');
        });
}

/**
 * Render shark warnings list
 * @param {Array} warnings - Array of shark warning data
 */
function renderWarningsList(warnings) {
    // Clear warnings list container
    warningsListContainer.innerHTML = '';

    // Check if there are any warnings
    if (warnings.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    // Hide empty state
    emptyState.classList.add('hidden');

    // Loop through warnings and create warning cards
    warnings.forEach(warning => {
        // Create warning card element
        const warningCard = document.createElement('div');
        warningCard.className = 'warning-card';

        // Check if warning is near expiry (within 24 hours)
        const expiryTime = new Date(warning.expires_at);
        const now = new Date();
        const hoursRemaining = (expiryTime - now) / (1000 * 60 * 60);
        const isNearExpiry = warning.status === 'active' && hoursRemaining > 0 && hoursRemaining <= 24;

        // If near expiry, add expiry warning label
        if (isNearExpiry) {
            const expiryWarning = document.createElement('div');
            expiryWarning.className = 'expiry-warning';
            expiryWarning.textContent = formatRemainingTime(warning.expires_at);
            warningCard.appendChild(expiryWarning);
        }

        // Add card content
        warningCard.innerHTML += `
            <div class="warning-card-header">
                <h2 class="warning-card-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${warning.species || 'Unknown Shark'} at ${warning.site.name}
                </h2>
                <a href="shark-warning-detail.html?id=${warning.warning_id}" class="btn btn-text">
                    View Details <i class="fas fa-arrow-right"></i>
                </a>
            </div>
            <div class="warning-card-content">
                <div class="warning-info">
                    <strong>Size:</strong> ${warning.size_estimate || 'Unknown'}
                </div>
                <div class="warning-info">
                    <strong>Reported by:</strong> ${warning.user?.username || 'Anonymous'}
                </div>
                <div class="warning-info">
                    <strong>Reported on:</strong> ${formatDate(warning.reported_at)}
                </div>
                ${warning.description ? `
                <div class="warning-description">
                    ${truncateText(warning.description, 150)}
                </div>` : ''}
            </div>
            <div class="warning-tags">
                <span class="tag tag-${warning.severity || 'medium'}">${getSeverityText(warning.severity)}</span>
                <span class="tag tag-${warning.status}">${getStatusText(warning.status)}</span>
                ${warning.status === 'active' && !isNearExpiry ? `
                <span class="tag">${formatRemainingTime(warning.expires_at)}</span>` : ''}
            </div>
        `;

        // Add warning card to container
        warningsListContainer.appendChild(warningCard);
    });
}

/**
 * Render pagination controls
 */
function renderPagination() {
    // Calculate total pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // If there's only one page, don't show pagination
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    // Create pagination HTML
    let paginationHTML = '<ul class="pagination">';

    // Previous page button
    if (currentPage > 1) {
        paginationHTML += `
            <li class="pagination-item">
                <a href="#" class="pagination-link" data-page="${currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }

    // Page number buttons
    const pageRange = getPageRange(currentPage, totalPages);

    pageRange.forEach(page => {
        if (page === '...') {
            paginationHTML += `
                <li class="pagination-item">
                    <span class="pagination-ellipsis">...</span>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="pagination-item">
                    <a href="#" class="pagination-link ${page === currentPage ? 'active' : ''}"
                       data-page="${page}">${page}</a>
                </li>
            `;
        }
    });

    // Next page button
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="pagination-item">
                <a href="#" class="pagination-link" data-page="${currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }

    paginationHTML += '</ul>';

    // Set pagination HTML
    paginationContainer.innerHTML = paginationHTML;

    // Add pagination click events
    const pageLinks = document.querySelectorAll('.pagination-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            currentPage = page;
            loadSharkWarnings();

            // Scroll to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

/**
 * Get pagination range
 * @param {Number} currentPage - Current page number
 * @param {Number} totalPages - Total pages
 * @returns {Array} - Array of page numbers and ellipses
 */
function getPageRange(currentPage, totalPages) {
    const range = [];

    if (totalPages <= 7) {
        // If total pages is less than or equal to 7, show all page numbers
        for (let i = 1; i <= totalPages; i++) {
            range.push(i);
        }
    } else {
        // Always show first page
        range.push(1);

        if (currentPage > 3) {
            // If current page is greater than 3, add ellipsis
            range.push('...');
        }

        // Determine middle range
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        if (currentPage < totalPages - 2) {
            // If current page is less than total pages - 2, add ellipsis
            range.push('...');
        }

        // Always show last page
        range.push(totalPages);
    }

    return range;
}

/**
 * Handle filter changes
 */
function handleFilterChange() {
    // Get filter values
    currentStatus = statusFilter.value;
    currentSiteId = siteFilter.value;

    // Reset to first page
    currentPage = 1;

    // Reload warnings list
    loadSharkWarnings();
}

/**
 * Show or hide loading indicator
 * @param {Boolean} show - Whether to show
 */
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        warningsListContainer.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        warningsListContainer.classList.remove('hidden');
    }
}

/**
 * Show alert message
 * @param {String} message - Message content
 * @param {String} type - Message type (success, danger, warning, info)
 */
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Clear and add alert
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Auto close alert after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

/**
 * Format date
 * @param {String} dateString - Date string
 * @returns {String} - Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format remaining time
 * @param {String} expiryDateString - Expiry date string
 * @returns {String} - Formatted remaining time
 */
function formatRemainingTime(expiryDateString) {
    const expiryDate = new Date(expiryDateString);
    const now = new Date();

    if (now > expiryDate) {
        return 'Expired';
    }

    const diffMs = expiryDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
        return `Expires in ${diffDays}d ${diffHours}h`;
    }
    return `Expires in ${diffHours}h`;
}

/**
 * Get severity text
 * @param {String} severity - Severity
 * @returns {String} - Corresponding text
 */
function getSeverityText(severity) {
    switch (severity) {
        case 'high':
            return 'High Risk';
        case 'medium':
            return 'Medium Risk';
        case 'low':
            return 'Low Risk';
        default:
            return severity || 'Medium Risk';
    }
}

/**
 * Get status text
 * @param {String} status - Status
 * @returns {String} - Corresponding text
 */
function getStatusText(status) {
    switch (status) {
        case 'active':
            return 'Active Warning';
        case 'resolved':
            return 'Resolved';
        case 'expired':
            return 'Expired';
        default:
            return status || 'Active';
    }
}

/**
 * Truncate text
 * @param {String} text - Text
 * @param {Number} maxLength - Maximum length
 * @returns {String} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}