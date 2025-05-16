/**
 * Setup search functionality for any element
 * @param {string} idPrefix - The prefix for search input and button IDs
 * @param {string} itemSelector - The CSS selector for items to search through
 * @param {Array} searchFields - Array of CSS selectors for fields to search within each item
 */
function setupSearchFunctionality(idPrefix, itemSelector, searchFields) {
    const searchInput = document.getElementById(`${idPrefix}-input`);
    const searchButton = document.getElementById(`${idPrefix}-button`);
    const resetButton = document.getElementById(`${idPrefix}-reset`);
    const items = document.querySelectorAll(itemSelector);
    
    if (!searchInput || !searchButton || !resetButton || items.length === 0) {
        console.error('Search elements not found');
        return;
    }
    
    // Search function
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            // If search is empty, show all items
            items.forEach(item => {
                item.classList.remove('hidden');
            });
            return;
        }
        
        // Filter items based on the search term
        items.forEach(item => {
            let matchFound = false;
            
            if (searchFields.length === 0) {
                // If no specific fields are provided, search in the entire item text
                matchFound = item.textContent.toLowerCase().includes(searchTerm);
            } else {
                // Search in specific fields
                for (const field of searchFields) {
                    const fieldElement = item.querySelector(field);
                    if (fieldElement && fieldElement.textContent.toLowerCase().includes(searchTerm)) {
                        matchFound = true;
                        break;
                    }
                }
            }
            
            if (matchFound) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
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
        // Show all items
        items.forEach(item => {
            item.classList.remove('hidden');
        });
    });
}

// Initialize search functionality when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Look for any elements with data-search attributes
    const searchContainers = document.querySelectorAll('[data-search]');
    
    searchContainers.forEach(container => {
        const idPrefix = container.dataset.searchIdPrefix || 'search';
        const itemSelector = container.dataset.searchItemSelector || '.item';
        const searchFields = container.dataset.searchFields ? 
            JSON.parse(container.dataset.searchFields) : [];
        
        setupSearchFunctionality(idPrefix, itemSelector, searchFields);
    });
}); 