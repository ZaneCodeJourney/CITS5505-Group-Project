document.addEventListener('DOMContentLoaded', function() {
    // The dive_profile_chart.js library will handle chart initialization 
    // when the page loads. No need for manual initialization.
    
    // Setup event listeners for View Details buttons
    setupEventListeners();
    
    // Setup search functionality
    setupSearchFunctionality();
});

function setupEventListeners() {
    // View details buttons
    const viewDetailsButtons = document.querySelectorAll('.view-details');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const token = this.dataset.token;
            // Redirect to shared dive details page
            window.location.href = `/shared/dive/${token}`;
        });
    });
}

function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-search');
    const logCards = document.querySelectorAll('.log-card');
    
    // Search function
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            // If search is empty, show all cards
            logCards.forEach(card => {
                card.classList.remove('hidden');
            });
            return;
        }
        
        // Filter cards by the user who shared the dive
        logCards.forEach(card => {
            const sharedByElement = card.querySelector('.detail-item:nth-child(5) .detail-value');
            if (sharedByElement) {
                const sharedBy = sharedByElement.textContent.toLowerCase();
                
                if (sharedBy.includes(searchTerm)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            }
        });
    }
    
    // Event listeners
    searchButton.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
    
    resetButton.addEventListener('click', function() {
        searchInput.value = '';
        // Show all cards
        logCards.forEach(card => {
            card.classList.remove('hidden');
        });
    });
} 