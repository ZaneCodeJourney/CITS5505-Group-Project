// Main JavaScript file for DiveLogger
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dropdown functionality
    initDropdowns();
    
    // Initialize mobile navigation
    initMobileNav();
    
    // Initialize scroll effects
    initScrollEffects();
    
    // Load placeholder images for development (can be removed in production)
    loadPlaceholderImages();
});

// Initialize dropdown menu functionality
function initDropdowns() {
    const userMenus = document.querySelectorAll('.user-menu');
    userMenus.forEach(menu => {
        // In a real app, you would create a dropdown menu with user options here
        menu.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('User menu clicked');
            // For full implementation, would toggle a dropdown here
        });
    });
}

// Initialize mobile navigation
function initMobileNav() {
    // This is a placeholder for mobile navigation implementation
    // In a real app, you would implement a mobile menu toggle
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav-toggle';
    mobileNav.innerHTML = '☰';
    mobileNav.style.display = 'none'; // Hide by default, would show in media query
    
    mobileNav.addEventListener('click', function() {
        console.log('Mobile nav toggle clicked');
        // Would toggle mobile menu visibility
    });
    
    // Add to DOM in small screens (would normally be done with CSS)
    const header = document.querySelector('header');
    if (header) {
        header.prepend(mobileNav);
    }
}

// Initialize scroll effects
function initScrollEffects() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's a functional link (like dropdown toggle)
            if (href === '#' || href === '') return;
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Scroll to top button
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '↑';
    scrollBtn.style.position = 'fixed';
    scrollBtn.style.bottom = '20px';
    scrollBtn.style.right = '20px';
    scrollBtn.style.display = 'none';
    scrollBtn.style.backgroundColor = 'var(--primary-blue)';
    scrollBtn.style.color = 'white';
    scrollBtn.style.border = 'none';
    scrollBtn.style.borderRadius = '50%';
    scrollBtn.style.width = '40px';
    scrollBtn.style.height = '40px';
    scrollBtn.style.fontSize = '20px';
    scrollBtn.style.cursor = 'pointer';
    scrollBtn.style.boxShadow = 'var(--shadow-md)';
    scrollBtn.style.zIndex = '999';
    
    document.body.appendChild(scrollBtn);
    
    // Show button when scrolled down
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollBtn.style.display = 'block';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // Scroll to top when clicked
    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Load placeholder images for development
function loadPlaceholderImages() {
    // This function loads placeholder images if the real ones don't exist
    // In a production app, this would be replaced with actual images
    
    // Function to check if an image exists
    function imageExists(url, callback) {
        const img = new Image();
        img.onload = function() { callback(true); };
        img.onerror = function() { callback(false); };
        img.src = url;
    }
    
    // Function to replace with placeholder if needed
    function setPlaceholderIfNeeded(imgElement, placeholder) {
        if (imgElement.src && !imgElement.src.includes('data:image')) {
            imageExists(imgElement.src, function(exists) {
                if (!exists) {
                    imgElement.src = placeholder;
                }
            });
        }
    }
    
    // Set placeholders for different image types
    const placeholders = {
        'dive-marker': 'https://via.placeholder.com/32/1a73e8/ffffff?text=D',
        'private-dive-marker': 'https://via.placeholder.com/32/616161/ffffff?text=P',
        'public-dive-marker': 'https://via.placeholder.com/32/009688/ffffff?text=P',
        'hero-bg': 'https://via.placeholder.com/1200x500/0c3b75/ffffff?text=Ocean+Background',
        'great-barrier-reef': 'https://via.placeholder.com/300x180/64b5f6/ffffff?text=Great+Barrier+Reef',
        'blue-hole': 'https://via.placeholder.com/300x180/1a73e8/ffffff?text=Blue+Hole',
        'silfra': 'https://via.placeholder.com/300x180/0c3b75/ffffff?text=Silfra+Fissure',
        'turtle': 'https://via.placeholder.com/120x120/4db6ac/ffffff?text=Turtle',
        'manta': 'https://via.placeholder.com/120x120/009688/ffffff?text=Manta+Ray',
        'google-icon': 'https://via.placeholder.com/20/4285F4/ffffff?text=G',
        'facebook-icon': 'https://via.placeholder.com/20/3b5998/ffffff?text=F',
        'twitter-icon': 'https://via.placeholder.com/20/1da1f2/ffffff?text=T',
        'instagram-icon': 'https://via.placeholder.com/20/e1306c/ffffff?text=I',
        'user1': 'https://via.placeholder.com/40/1a73e8/ffffff?text=S',
        'user2': 'https://via.placeholder.com/40/009688/ffffff?text=M',
        'user3': 'https://via.placeholder.com/40/ff7043/ffffff?text=E',
        'auth-bg': 'https://via.placeholder.com/800x600/0c3b75/ffffff?text=Ocean+Background'
    };
    
    // Apply placeholders to images
    document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (!src || src === '') return;
        
        // Check if the image contains one of our placeholder keys
        for (const [key, placeholder] of Object.entries(placeholders)) {
            if (src.includes(key)) {
                setPlaceholderIfNeeded(img, placeholder);
                break;
            }
        }
    });
    
    // Apply placeholders to background images
    document.querySelectorAll('.hero, .auth-info').forEach(element => {
        // Hero and auth-info sections typically have background images
        // Would replace with placeholder if needed
        // In a real app, you would check if the background image loads
    });
} 