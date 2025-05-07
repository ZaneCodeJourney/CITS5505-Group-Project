/**
 * JavaScript file for the edit profile page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const profileForm = document.getElementById('profile-edit-form');
    const avatarInput = document.getElementById('avatar-upload');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const profileImage = document.getElementById('user-profile-image');
    const successAlert = document.getElementById('save-success-alert');
    const errorAlert = document.getElementById('save-error-alert');
    
    // Add event listeners
    changeAvatarBtn.addEventListener('click', function() {
        avatarInput.click();
    });
    
    avatarInput.addEventListener('change', previewAvatar);
    profileForm.addEventListener('submit', handleSubmit);
    
    /**
     * Preview avatar before upload
     */
    function previewAvatar() {
        if (avatarInput.files && avatarInput.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                profileImage.src = e.target.result;
            }
            
            reader.readAsDataURL(avatarInput.files[0]);
        }
    }
    
    /**
     * Handle form submission
     * @param {Event} e - Event object
     */
    function handleSubmit(e) {
        e.preventDefault();
        
        // Hide any existing alerts
        successAlert.classList.add('d-none');
        errorAlert.classList.add('d-none');
        
        // Get form data
        const formData = new FormData();
        formData.append('firstname', document.getElementById('firstname').value);
        formData.append('lastname', document.getElementById('lastname').value);
        formData.append('username', document.getElementById('username').value);
        formData.append('bio', document.getElementById('bio').value);
        
        // Add avatar if a new one was selected
        if (avatarInput.files && avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }
        
        // Send request to API
        fetch('/api/users/me', {
            method: 'PUT',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                // Show success message
                successAlert.textContent = data.message;
                successAlert.classList.remove('d-none');
                
                // Scroll to top to show the alert
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Redirect to profile page after a delay
                setTimeout(() => {
                    window.location.href = '/profile';
                }, 2000);
            } else if (data.error) {
                // Show error message
                errorAlert.textContent = data.error;
                errorAlert.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorAlert.textContent = 'An error occurred while updating your profile. Please try again.';
            errorAlert.classList.remove('d-none');
        });
    }
}); 