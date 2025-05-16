// Dropdown menu and logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const userDropdownToggle = document.getElementById('user-dropdown-toggle');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    
    if (userDropdownToggle && userDropdownMenu) {
        userDropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            userDropdownMenu.classList.toggle('show');
        });
        
        // Close the dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.user-menu')) {
                userDropdownMenu.classList.remove('show');
            }
        });
        
        // Logout functionality
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async function(e) {
                e.preventDefault();
                
                try {
                    // Use the centralized API request function
                    await apiRequest('/api/auth/logout', 'POST');
                    
                    // Redirect to home page on successful logout
                    window.location.href = '/';
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('An error occurred during logout. Please try again.');
                }
            });
        }
    }
}); 