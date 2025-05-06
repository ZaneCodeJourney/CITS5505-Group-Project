/**
 * 初始化个人资料编辑功能
 */
function initProfileEditing() {
    // 姓名编辑
    $('#edit-name-btn').on('click', function() {
        // 获取当前姓名
        const fullName = $('#user-name-display').text();
        const nameParts = fullName.split(' ');

        // 填充表单并显示
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
            $('#profile-error-alert').text('请填写名字和姓氏 (Please fill in both first and last name)').removeClass('d-none');
            return;
        }

        updateProfile({
            firstname: firstName,
            lastname: lastName
        });
    });

    // 用户名编辑
    $('#edit-username-btn').on('click', function() {
        const username = $('#user-username-display').text().trim();

        // 填充表单并显示
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
            $('#profile-error-alert').text('用户名不能为空 (Username cannot be empty)').removeClass('d-none');
            return;
        }

        updateProfile({
            username: username
        });
    });

    // 简介编辑
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
            $('#profile-error-alert').text('简介不能超过200个字符 (Bio cannot exceed 200 characters)').removeClass('d-none');
            return;
        }

        updateProfile({
            bio: bio
        });
    });

    // 资料可见性编辑
    $('#edit-visibility-btn').on('click', function() {
        const visibility = $('#profile-visibility-display').text().toLowerCase();

        // 根据当前可见性设置选中相应的单选按钮
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
            $('#profile-error-alert').text('请选择资料可见性 (Please select profile visibility)').removeClass('d-none');
            return;
        }

        updateProfile({
            profile_visibility: visibility
        });
    });

    // 头像更改
    $('#change-avatar-btn').on('click', function() {
        // 创建文件选择器
        const fileInput = $('<input type="file" accept="image/*" style="display:none">');
        $('body').append(fileInput);

        fileInput.on('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = function(e) {
                    // 显示预览
                    $('#user-profile-image').attr('src', e.target.result);

                    // 这里应该调用API上传头像
                    // 在实际应用中，这里会将文件上传到服务器
                    // 为了示例，我们假设直接更新头像URL
                    updateProfile({
                        avatar: e.target.result
                    });
                };

                reader.readAsDataURL(file);
            }

            // 清理文件选择器
            fileInput.remove();
        });

        fileInput.click();
    });
}

/**
 * 更新用户资料
 * @param {Object} data - 更新的资料数据
 */
function updateProfile(data) {
    // 隐藏之前的提示
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
            // 显示成功消息
            $('#profile-success-alert').removeClass('d-none');

            // 更新UI显示
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

            // 重置表单的显示状态
            $('.edit-form-row').addClass('d-none');
            $('.profile-info-display').removeClass('d-none');

            // 处理可见性更新
            if (data.profile_visibility) {
                let visibilityText = 'Public';
                if (data.profile_visibility === 'friends_only') {
                    visibilityText = 'Friends Only';
                } else if (data.profile_visibility === 'private') {
                    visibilityText = 'Private';
                }
                $('#profile-visibility-display').text(visibilityText);
            }

            // 5秒后隐藏成功消息
            setTimeout(() => {
                $('#profile-success-alert').addClass('d-none');
            }, 5000);
        },
        error: function(xhr) {
            let errorMessage = '更新个人资料时出错 (Error updating profile)';

            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error.message || xhr.responseJSON.error;
            }

            $('#profile-error-alert').text(errorMessage).removeClass('d-none');
        }
    });
}