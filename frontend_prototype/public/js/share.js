// Share page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the share page
    const shareContainer = document.querySelector('.share-container');
    if (!shareContainer) return;
    
    // Initialize share options tabs
    initShareOptions();
    
    // Initialize share modal
    initShareModal();
    
    // Initialize copy to clipboard functionality
    initCopyToClipboard();
});

// Initialize share options tabs
function initShareOptions() {
    const shareOptions = document.querySelectorAll('.share-option-card');
    const shareSections = document.querySelectorAll('.share-section');
    
    if (!shareOptions.length || !shareSections.length) return;
    
    // Add click event to each option
    shareOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Get the target section id from the option id
            const optionId = this.id;
            const sectionId = optionId.replace('option', 'section');
            
            // Remove active class from all options and sections
            shareOptions.forEach(opt => opt.classList.remove('active'));
            shareSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked option and corresponding section
            this.classList.add('active');
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Initialize search functionality
    initLogSearch();
}

// Initialize log search
function initLogSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const logItems = document.querySelectorAll('.share-log-item');
    
    if (!searchInput || !logItems.length) return;
    
    // Search function
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // If search term is empty, show all items
        if (!searchTerm) {
            logItems.forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        // Filter logs based on search term
        logItems.forEach(item => {
            const logName = item.querySelector('h3').textContent.toLowerCase();
            const logDate = item.querySelector('p').textContent.toLowerCase();
            
            // Show or hide based on match
            if (logName.includes(searchTerm) || logDate.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Add event listeners
    searchInput.addEventListener('keyup', function(e) {
        // Perform search on Enter key press
        if (e.key === 'Enter') {
            performSearch();
        }
        
        // Clear results if search input is cleared
        if (this.value.trim() === '') {
            performSearch();
        }
    });
    
    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

// Initialize share modal
function initShareModal() {
    const modal = document.getElementById('share-modal');
    const shareButtons = document.querySelectorAll('.share-btn');
    const closeModal = document.querySelector('.close-modal');
    const closeBtn = document.querySelector('.close-btn');
    
    if (!modal || !shareButtons.length) return;
    
    // Open modal when share button is clicked
    shareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get log or collection info to share (in a real app, would get this from data attributes)
            const itemContainer = this.closest('.share-log-item') || this.closest('.collection-item');
            if (itemContainer) {
                const itemName = itemContainer.querySelector('h3').textContent;
                
                // Update modal title with item name
                const modalTitle = modal.querySelector('.modal-header h3');
                if (modalTitle) {
                    if (itemContainer.classList.contains('collection-item')) {
                        modalTitle.textContent = `Share Collection - ${itemName}`;
                    } else {
                        modalTitle.textContent = `Share - ${itemName}`;
                    }
                }
                
                // In a real app, would load share permissions and users here
                console.log(`Opening share modal for: ${itemName}`);
            }
            
            // Display modal
            modal.style.display = 'block';
            
            // Add body class to prevent scrolling
            document.body.classList.add('modal-open');
        });
    });
    
    // Close modal when close button is clicked
    if (closeModal) {
        closeModal.addEventListener('click', closeShareModal);
    }
    
    // Close modal when close button in footer is clicked
    if (closeBtn) {
        closeBtn.addEventListener('click', closeShareModal);
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeShareModal();
        }
    });
    
    // Close modal when pressing escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeShareModal();
        }
    });
    
    // Function to close the share modal
    function closeShareModal() {
        modal.style.display = 'none';
        
        // Remove body class to allow scrolling again
        document.body.classList.remove('modal-open');
    }
    
    // Initialize user search in modal
    initUserSearch();
    
    // Initialize share button functionality in modal
    initModalShareButtons();
}

// Initialize user search in modal
function initUserSearch() {
    const userSearchInput = document.querySelector('.user-search .search-input');
    
    if (!userSearchInput) return;
    
    // Sample user data (in a real app, this would come from the server)
    const sampleUsers = [
        { name: 'Sarah', email: 'sarah@example.com', avatar: 'public/images/user1.jpg' },
        { name: 'Mike', email: 'mike@example.com', avatar: 'public/images/user2.jpg' },
        { name: 'Emma', email: 'emma@example.com', avatar: 'public/images/user3.jpg' },
        { name: 'Alex', email: 'alex@example.com', avatar: 'public/images/user4.jpg' },
        { name: 'James', email: 'james@example.com', avatar: 'public/images/user5.jpg' },
        { name: 'Olivia', email: 'olivia@example.com', avatar: 'public/images/user6.jpg' }
    ];
    
    userSearchInput.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        // In a real app, this would make an API call to search users
        console.log(`Searching for user: ${searchTerm}`);
        
        // Simple search implementation for demonstration
        if (searchTerm.length >= 2) {
            // Filter users based on search term
            const filteredUsers = sampleUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) || 
                user.email.toLowerCase().includes(searchTerm)
            );
            
            // In a real app, would update the UI with search results
            console.log('Search results:', filteredUsers);
        }
    });
}

// Initialize share buttons in modal
function initModalShareButtons() {
    // User share buttons
    const userShareButtons = document.querySelectorAll('.user-item .btn');
    
    if (userShareButtons.length) {
        userShareButtons.forEach(button => {
            button.addEventListener('click', function() {
                const userItem = this.closest('.user-item');
                const userName = userItem.querySelector('.user-name').textContent;
                
                if (this.textContent === 'Share') {
                    // In a real app, this would share with the user
                    console.log(`Sharing with ${userName}`);
                    this.textContent = 'Shared';
                    this.classList.add('btn-success');
                    this.classList.remove('btn-primary');
                    
                    // Move to "Already Shared With" section
                    // In a real app, this would be handled differently
                } else if (this.textContent === 'Remove') {
                    // In a real app, this would remove sharing permission
                    console.log(`Removing share permission from ${userName}`);
                    userItem.remove();
                }
            });
        });
    }
    
    // Social media share buttons
    const socialShareButtons = document.querySelectorAll('.social-share-btn');
    
    if (socialShareButtons.length) {
        socialShareButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get platform from class
                const platform = this.classList.contains('facebook') ? 'Facebook' :
                                this.classList.contains('twitter') ? 'Twitter' :
                                this.classList.contains('instagram') ? 'Instagram' : 'social media';
                
                // In a real app, this would open a sharing dialog
                console.log(`Sharing to ${platform}`);
                alert(`Opening ${platform} sharing...`);
            });
        });
    }
}

// Initialize copy to clipboard functionality
function initCopyToClipboard() {
    const copyBtn = document.querySelector('.copy-btn');
    const linkInput = document.querySelector('.link-input');
    
    if (!copyBtn || !linkInput) return;
    
    copyBtn.addEventListener('click', function() {
        // Select the text
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        
        // Copy to clipboard
        document.execCommand('copy');
        
        // Deselect the text
        window.getSelection().removeAllRanges();
        
        // Change button text temporarily
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        
        // Revert button text after 2 seconds
        setTimeout(() => {
            this.textContent = originalText;
        }, 2000);
    });
    
    // Link permission dropdown
    const linkPermissionsSelect = document.querySelector('.link-permissions select');
    
    if (linkPermissionsSelect) {
        linkPermissionsSelect.addEventListener('change', function() {
            // In a real app, this would update link permissions on the server
            console.log('Link permission changed to:', this.value);
            
            // If set to "no one", disable the link input and copy button
            if (this.value === 'none') {
                linkInput.disabled = true;
                copyBtn.disabled = true;
                linkInput.value = 'Link sharing disabled';
            } else {
                linkInput.disabled = false;
                copyBtn.disabled = false;
                linkInput.value = 'https://divelogger.com/share/log/123456';
            }
        });
    }
} 