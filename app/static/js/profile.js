/**
 * Initialize profile editing functionality
 */
function initProfileEditing() {
    // Name editing
    $('#edit-name-btn').on('click', function() {
        // Get current name
        const fullName = $('#user-name-display').text();
        const nameParts = fullName.split(' ');

        // Fill form and display
        $('#firstname').val(nameParts[0] || '');
        $('#lastname').val(nameParts.slice(1).join(' ') || '');
        $('#user-name-display').parent().parent().addClass('d-none');
        $('#name-edit-form').removeClass('d-none');
    });

    $('#cancel-name-edit').on('click', function() {
        $('#user-name-display').parent().parent().removeClass('d-none');
        $('#name-edit-form').addClass('d-none');
    });

    $('#save-name').on('click', function() {
        const firstName = $('#firstname').val();
        const lastName = $('#lastname').val();

        if (!firstName || !lastName) {
            $('#profile-error-alert').text('Please fill in both first and last name').removeClass('d-none');
            return;
        }

        updateProfile({
            firstname: firstName,
            lastname: lastName
        });
    });

    // Username editing
    $('#edit-username-btn').on('click', function() {
        const username = $('#user-username-display').text().trim();

        // Fill form and display
        $('#username').val(username);
        $('#user-username-display').parent().parent().addClass('d-none');
        $('#username-edit-form').removeClass('d-none');
    });

    $('#cancel-username-edit').on('click', function() {
        $('#user-username-display').parent().parent().removeClass('d-none');
        $('#username-edit-form').addClass('d-none');
    });

    $('#save-username').on('click', function() {
        const username = $('#username').val();

        if (!username) {
            $('#profile-error-alert').text('Username cannot be empty').removeClass('d-none');
            return;
        }

        updateProfile({
            username: username
        });
    });

    // Bio editing
    $('#edit-bio-btn').on('click', function() {
        const bio = $('#user-bio-display').text();
        if (bio === 'No bio yet') {
            $('#bio').val('');
        } else {
            $('#bio').val(bio);
        }

        $('#user-bio-display').parent().parent().addClass('d-none');
        $('#bio-edit-form').removeClass('d-none');
    });

    $('#cancel-bio-edit').on('click', function() {
        $('#user-bio-display').parent().parent().removeClass('d-none');
        $('#bio-edit-form').addClass('d-none');
    });

    $('#save-bio').on('click', function() {
        const bio = $('#bio').val();

        if (bio.length > 200) {
            $('#profile-error-alert').text('Bio cannot exceed 200 characters').removeClass('d-none');
            return;
        }

        updateProfile({
            bio: bio
        });
    });

    // Profile visibility editing
    $('#edit-visibility-btn').on('click', function() {
        const visibility = $('#profile-visibility-display').text().toLowerCase();

        // Set the appropriate radio button based on current visibility
        if (visibility === 'public') {
            $('#visibility-public').prop('checked', true);
        } else if (visibility === 'friends only') {
            $('#visibility-friends').prop('checked', true);
        } else if (visibility === 'private') {
            $('#visibility-private').prop('checked', true);
        }

        $('#profile-visibility-display').parent().parent().addClass('d-none');
        $('#visibility-edit-form').removeClass('d-none');
    });

    $('#cancel-visibility-edit').on('click', function() {
        $('#profile-visibility-display').parent().parent().removeClass('d-none');
        $('#visibility-edit-form').addClass('d-none');
    });

    $('#save-visibility').on('click', function() {
        const visibility = $('input[name="profile_visibility"]:checked').val();

        if (!visibility) {
            $('#profile-error-alert').text('Please select profile visibility').removeClass('d-none');
            return;
        }

        updateProfile({
            profile_visibility: visibility
        });
    });

    // Avatar change
    $('#change-avatar-btn').on('click', function() {
        // Create file input
        const fileInput = $('<input type="file" accept="image/*" style="display:none">');
        $('body').append(fileInput);

        fileInput.on('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = function(e) {
                    // Show preview
                    $('#user-profile-image').attr('src', e.target.result);

                    // This should call an API to upload the avatar
                    // In a real application, this would upload the file to the server
                    // For the example, we assume the avatar URL is updated directly
                    updateProfile({
                        avatar: e.target.result
                    });
                };

                reader.readAsDataURL(file);
            }

            // Clean up file input
            fileInput.remove();
        });

        fileInput.click();
    });
}

/**
 * Update user profile
 * @param {Object} data - Updated profile data
 */
function updateProfile(data) {
    // Hide previous alerts
    $('#profile-success-alert').addClass('d-none');
    $('#profile-error-alert').addClass('d-none');

    const token = getAuthToken();
    if (!token) {
        window.location.href = '/login';
        return;
    }

    $.ajax({
        url: '/api/users/me',
        type: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data),
        success: function(response) {
            // Show success message
            $('#profile-success-alert').removeClass('d-none');

            // Update UI display
            if (response.data || response.user) {
                const userData = response.data || response.user;

                if (userData.firstname && userData.lastname) {
                    $('#user-name-display').text(`${userData.firstname} ${userData.lastname}`);
                }

                if (userData.username) {
                    $('#user-username-display').text(userData.username);
                }

                if ('bio' in userData) {
                    if (userData.bio) {
                        $('#user-bio-display').text(userData.bio);
                    } else {
                        $('#user-bio-display').text('No bio yet');
                    }
                }

                if (userData.avatar) {
                    $('#user-profile-image').attr('src', userData.avatar);
                }
            }

            // Reset form display state
            $('.edit-form-row').addClass('d-none');
            $('.profile-info-display').removeClass('d-none');

            // Handle visibility update
            if (data.profile_visibility) {
                let visibilityText = 'Public';
                if (data.profile_visibility === 'friends_only') {
                    visibilityText = 'Friends Only';
                } else if (data.profile_visibility === 'private') {
                    visibilityText = 'Private';
                }
                $('#profile-visibility-display').text(visibilityText);
            }

            // Hide success message after 5 seconds
            setTimeout(() => {
                $('#profile-success-alert').addClass('d-none');
            }, 5000);
        },
        error: function(xhr) {
            let errorMessage = 'Error updating profile';

            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error.message || xhr.responseJSON.error;
            }

            $('#profile-error-alert').text(errorMessage).removeClass('d-none');
        }
    });
}