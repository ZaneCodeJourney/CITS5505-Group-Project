document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile page functionality
    initProfileNavigation();
});

// Handle profile navigation tabs
function initProfileNavigation() {
    // Get all navigation items and section containers
    const navItems = document.querySelectorAll('.profile-nav-item');
    const sections = document.querySelectorAll('.profile-section');
    
    // Add click event listener to each navigation item
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section ID from the href attribute
            const targetId = this.querySelector('a').getAttribute('href');
            
            // Remove active class from all navigation items and sections
            navItems.forEach(item => item.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked navigation item
            this.classList.add('active');
            
            // Show the target section
            document.querySelector(targetId).classList.add('active');
            
            // Scroll to top of content area on mobile
            if (window.innerWidth < 992) {
                document.querySelector('.profile-content').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Add form submission handling
    const profileForm = document.querySelector('.profile-form');
    const saveButton = document.querySelector('.profile-header .btn-primary');
    
    if (saveButton) {
        saveButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Simulate saving profile data
            alert('Profile changes saved successfully!');
        });
    }
    
    // Handle image upload
    const changeImageBtn = document.querySelector('.profile-avatar .btn');
    
    if (changeImageBtn) {
        changeImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Simulate opening file dialog
            alert('Image upload functionality would be implemented here.');
        });
    }
} 