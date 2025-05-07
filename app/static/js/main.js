/**
 * Dive.site - Main JavaScript File
 * Author: Development Team
 * Version: 1.0.0
 * Last Updated: 2025-04-27
 */

// Execute after DOM is fully loaded
$(document).ready(function() {

    // Initialize Bootstrap tooltips
    initTooltips();

    // Initialize statistics
    initStatistics();

    // Since there's no backend, use mock data directly
    displayMockData();
    // Initialize Bootstrap tooltips
    initTooltips();

    // Since there's no backend, use mock data directly
    // In a real project, this would fetch data from an API
    displayMockData();

    // Listen for search input
    initSearchListener();
});

/**
 * Initialize Bootstrap tooltips
 */
function initTooltips() {
    // Enable tooltips for all elements with data-toggle="tooltip" attribute
    $('[data-toggle="tooltip"]').tooltip();
}

/**
 * Initialize search box event listener
 */
function initSearchListener() {
    $('.search-btn').on('click', function() {
        const searchQuery = $('.search-bar input').val().trim();
        if (searchQuery) {
            alert('Search function: In a real application this would redirect to search results page\nSearch content: ' + searchQuery);
        }
    });

    // Add Enter key event for search box
    $('.search-bar input').on('keypress', function(e) {
        if (e.which === 13) { // Enter key has keyCode 13
            $('.search-btn').click();
        }
    });
}

/**
 * Display mock data
 * Since there's no backend API, we use mock data directly
 */
function displayMockData() {
    // Here we can perform some initialization actions
    // In a real project, this would call fetchSharkAlerts() to get data from the API

    // Display mock shark warning data
    // mockSharkAlerts is already added statically in HTML, code kept here for reference
    /*
    const mockData = [
        {
            species: 'Yellow-Edged Moray',
            dive_count: 1,
            site_count: 1,
            risk_level: 'high',
            first_reported: '2025-04-20T08:30:00Z'
        },
        {
            species: 'Pseudoceros Scriptus',
            dive_count: 1,
            site_count: 1,
            risk_level: 'medium',
            first_reported: '2025-04-18T14:15:00Z'
        },
        {
            species: 'Twocoat Coralblenny',
            dive_count: 1,
            site_count: 1,
            risk_level: 'low',
            first_reported: '2025-04-15T11:45:00Z'
        }
    ];

    displaySharkAlerts(mockData);
    */
}

/**
 * Initialize page statistics
 */
function initStatistics() {
    // Get high risk shark warning count
    getHighRiskSharkWarningsCount();
}

/**
 * Get high risk shark warning count
 */
function getHighRiskSharkWarningsCount() {
    // Mock data - in a real application, this would be fetched from an API
    const highRiskCount = 12;

    // Update high risk warning count
    $('#high-risk-count').text(highRiskCount);
}

/**
 * Format date to readable format
 * @param {string} dateString - ISO format date string
 * @returns {string} - Formatted date string (e.g., "April 25, 2025")
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Add interactive effects
 * These are some additional interactive effects that can be added as needed
 */

// Add hover effect for dive site cards
$('.dive-site-card').hover(
    function() {
        $(this).css('transform', 'translateY(-3px)');
        $(this).css('box-shadow', '0 5px 15px rgba(0,0,0,0.1)');
    },
    function() {
        $(this).css('transform', 'translateY(0)');
        $(this).css('box-shadow', 'none');
    }
);

// Add click to expand details function for shark alerts
$(document).on('click', '.shark-alert-card', function() {
    alert('In the full version, clicking would display detailed information for this shark alert');
});

// Add click event for user avatars
$(document).on('click', '.diver-avatar img', function(e) {
    e.stopPropagation();
    const name = $(this).attr('alt');
    alert('In the full version, clicking would redirect to ' + name + '\'s profile page');
});