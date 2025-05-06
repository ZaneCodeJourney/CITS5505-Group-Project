/**
 * Authentication related functionality
 * 认证相关功能
 *
 * This file contains functions for handling user authentication
 * 此文件包含处理用户认证的函数
 */

// Execute when document is ready
// 文档就绪时执行
$(document).ready(function() {
    // Check authentication status on every page load
    // 在每次页面加载时检查认证状态
    checkAuthStatus();
});

/**
 * Check if user is authenticated and update UI accordingly
 * 检查用户是否已认证并相应地更新UI
 */

function checkAuthStatus() {
    // Try to get auth token from storage
    // 尝试从存储中获取认证令牌
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (token) {
        // If token exists, check if it's valid
        // 如果令牌存在，检查它是否有效
        validateToken(token);
    } else {
        // If no token, update UI to show logged-out state
        // 如果没有令牌，更新UI以显示已登出状态
        updateAuthUI(false);
    }
}


/**
 * Validate authentication token with the server
 * 使用服务器验证认证令牌
 * @param {string} token - The authentication token
 */
function validateToken(token) {
    // In a real application, you would make an API call to validate the token
    // 在实际应用中，你会发起API调用来验证令牌
    $.ajax({
        url: '/api/auth/validate',  // Replace with your actual endpoint
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            // If validation successful
            // 如果验证成功
            if (response.status === 'success') {
                updateAuthUI(true);
            } else {
                // If validation failed, clear tokens and update UI
                // 如果验证失败，清除令牌并更新UI
                logout();
            }
        },
        error: function() {
            // On error, assume token is invalid
            // 出错时，假定令牌无效
            logout();
        }
    });

    // For development without a backend, you can use this instead:
    // 对于没有后端的开发，你可以使用此替代方法：
    // updateAuthUI(true);
}

/**
 * Update the UI based on authentication status
 * 根据认证状态更新UI
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 */
function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        // Show authenticated UI elements
        // 显示已认证的UI元素
        $('.auth-item').addClass('d-none');
        $('#profile-nav-item').removeClass('d-none');
    } else {
        // Show non-authenticated UI elements
        // 显示未认证的UI元素
        $('.auth-item').removeClass('d-none');
        $('#profile-nav-item').addClass('d-none');
    }
}

/**
 * Log the user out
 * 注销用户
 */
function logout() {
    // Clear authentication data
    // 清除认证数据
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    // Update UI
    // 更新UI
    updateAuthUI(false);

    // Redirect to home page if on a protected page
    // 如果在受保护的页面上，重定向到首页
    const protectedPages = ['/profile', '/dashboard', '/settings'];
    const currentPath = window.location.pathname;

    if (protectedPages.some(page => currentPath.includes(page))) {
        window.location.href = '/';
    }
}

/**
 * Initialize logout button click handler
 * 初始化注销按钮点击处理程序
 */
function initLogoutButton() {
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();

        // In a real application, you would make an API call to invalidate the token
        // 在实际应用中，你会发起API调用来使令牌失效
        $.ajax({
            url: '/api/auth/logout',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))
            },
            success: function() {
                logout();
            },
            error: function() {
                // Even on error, perform local logout
                // 即使出错，也执行本地注销
                logout();
            }
        });
    });
}

/**
 * Data Visualization Helpers
 * 数据可视化助手
 */

/**
 * Create a responsive line chart
 * 创建响应式折线图
 * @param {string} selector - Canvas element selector
 * @param {Array} labels - X-axis labels
 * @param {Array} data - Y-axis data
 * @param {string} label - Dataset label
 * @param {Object} options - Additional chart options
 */
function createLineChart(selector, labels, data, label, options = {}) {
    const ctx = document.querySelector(selector).getContext('2d');

    // Set default options
    // 设置默认选项
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    borderDash: [3, 3]
                }
            }
        }
    };

    // Merge options
    // 合并选项
    const chartOptions = {...defaultOptions, ...options};

    // Create chart
    // 创建图表
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                fill: true,
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4
            }]
        },
        options: chartOptions
    });
}

/**
 * Create a responsive bar chart
 * 创建响应式条形图
 * @param {string} selector - Canvas element selector
 * @param {Array} labels - X-axis labels
 * @param {Array} data - Y-axis data
 * @param {string} label - Dataset label
 * @param {Object} options - Additional chart options
 */
function createBarChart(selector, labels, data, label, options = {}) {
    const ctx = document.querySelector(selector).getContext('2d');

    // Set default options
    // 设置默认选项
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    borderDash: [3, 3]
                }
            }
        }
    };

    // Merge options
    // 合并选项
    const chartOptions = {...defaultOptions, ...options};

    // Create chart
    // 创建图表
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: chartOptions
    });
}

/**
 * Validates password strength
 * 验证密码强度
 * @param {string} password - The password to validate
 * @returns {boolean} True if password meets requirements
 */
function isValidPassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number
    // 至少8个字符，包含大写字母、小写字母和数字
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

/**
 * Validates email format
 * 验证邮箱格式
 * @param {string} email - The email to validate
 * @returns {boolean} True if email format is valid
 */
function isValidEmail(email) {
    const pattern = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    return pattern.test(email);
}

/**
 * Handle form validation
 * 处理表单验证
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} True if form is valid
 */
function validateForm(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

/**
 * Get auth token from storage
 * 从存储中获取认证令牌
 * @returns {string|null} The auth token or null if not found
 */
function getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function handleApiError(errorAlert, error) {
    let errorMessage = '发生未知错误，请稍后重试。 (An unknown error occurred. Please try again later.)';

    if (error.responseJSON && error.responseJSON.error) {
        errorMessage = error.responseJSON.error;
    } else if (error.statusText) {
        errorMessage = `Error: ${error.statusText}`;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    $(errorAlert).text(errorMessage).removeClass('d-none');
}

/**
 * Show success message and reset form
 * 显示成功消息并重置表单
 * @param {HTMLElement} form - The form to reset
 * @param {HTMLElement} successAlert - The success alert element
 */
function showSuccess(form, successAlert) {
    form.reset();
    form.classList.remove('was-validated');
    $(successAlert).removeClass('d-none');

    // Hide success message after 5 seconds
    // 5秒后隐藏成功消息
    setTimeout(() => {
        $(successAlert).addClass('d-none');
    }, 5000);
}

/**
 * Initialize change password functionality
 * 初始化更改密码功能
 */
function initChangePassword() {
    const form = document.getElementById('password-change-form');
    const successAlert = document.getElementById('password-success-alert');
    const errorAlert = document.getElementById('password-error-alert');

    if (!form) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Hide previous alerts
        // 隐藏之前的提示
        $(successAlert).addClass('d-none');
        $(errorAlert).addClass('d-none');

        // Validate form
        // 验证表单
        if (!validateForm(this)) return;

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Check password strength
        // 检查密码强度
        if (!isValidPassword(newPassword)) {
            $(errorAlert).text('新密码不符合强度要求。密码必须至少包含8个字符，包括大写字母、小写字母和数字。 (New password does not meet strength requirements. Password must be at least 8 characters long and include uppercase, lowercase letters, and numbers.)').removeClass('d-none');
            return;
        }

        // Check if passwords match
        // 检查密码是否匹配
        if (newPassword !== confirmPassword) {
            $(errorAlert).text('新密码与确认密码不匹配。 (New password and confirmation do not match.)').removeClass('d-none');
            return;
        }

        // Get auth token
        // 获取认证令牌
        const token = getAuthToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // API call to change password
        // 调用API更改密码
        $.ajax({
            url: '/api/users/me/change-password',
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            }),
            success: function(response) {
                showSuccess(form, successAlert);
            },
            error: function(xhr) {
                handleApiError(errorAlert, xhr);
            }
        });
    });
}

/**
 * Initialize change email functionality
 * 初始化更改邮箱功能
 */
function initChangeEmail() {
    const form = document.getElementById('email-change-form');
    const successAlert = document.getElementById('email-success-alert');
    const errorAlert = document.getElementById('email-error-alert');
    const currentEmail = document.getElementById('current-email');

    if (!form) return;

    // Fetch and display current email
    // 获取并显示当前邮箱
    const token = getAuthToken();
    if (token) {
        $.ajax({
            url: '/api/users/me',
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(response) {
                if (response.status === 'success' && response.data && response.data.email) {
                    currentEmail.value = response.data.email;
                }
            }
        });
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Hide previous alerts
        // 隐藏之前的提示
        $(successAlert).addClass('d-none');
        $(errorAlert).addClass('d-none');

        // Validate form
        // 验证表单
        if (!validateForm(this)) return;

        const newEmail = document.getElementById('new-email').value;
        const password = document.getElementById('email-password').value;

        // Validate email format
        // 验证邮箱格式
        if (!isValidEmail(newEmail)) {
            $(errorAlert).text('请输入有效的邮箱地址格式。 (Please enter a valid email address format.)').removeClass('d-none');
            return;
        }

        // Check if new email is same as current
        // 检查新邮箱是否与当前邮箱相同
        if (newEmail === currentEmail.value) {
            $(errorAlert).text('新邮箱地址与当前邮箱地址相同。 (New email address is the same as the current one.)').removeClass('d-none');
            return;
        }

        // Get auth token
        // 获取认证令牌
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // API call to change email
        // 调用API更改邮箱
        $.ajax({
            url: '/api/users/me/change-email',
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                new_email: newEmail,
                password: password
            }),
            success: function(response) {
                showSuccess(form, successAlert);
                // Update displayed current email
                // 更新显示的当前邮箱
                currentEmail.value = newEmail;
            },
            error: function(xhr) {
                handleApiError(errorAlert, xhr);
            }
        });
    });
}

/**
 * Initialize close account functionality
 * 初始化关闭账户功能
 */
function initCloseAccount() {
    const form = document.getElementById('close-account-form');
    const successAlert = document.getElementById('close-success-alert');
    const errorAlert = document.getElementById('close-error-alert');

    if (!form) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Hide previous alerts
        // 隐藏之前的提示
        $(successAlert).addClass('d-none');
        $(errorAlert).addClass('d-none');

        // Validate form
        // 验证表单
        if (!validateForm(this)) return;

        const password = document.getElementById('close-password').value;
        const dataPreference = document.querySelector('input[name="data_preference"]:checked').value;
        const confirmed = document.getElementById('confirm-close').checked;

        if (!confirmed) {
            $(errorAlert).text('您必须确认此操作。 (You must confirm this action.)').removeClass('d-none');
            return;
        }

        // Get auth token
        // 获取认证令牌
        const token = getAuthToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Confirm with a modal dialog
        // 使用模态对话框确认
        if (confirm('您确定要永久关闭您的账户吗？此操作不可撤销。 (Are you sure you want to permanently close your account? This action cannot be undone.)')) {
            // API call to close account
            // 调用API关闭账户
            $.ajax({
                url: '/api/users/me/deactivate',
                type: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    password: password,
                    data_preference: dataPreference
                }),
                success: function(response) {
                    showSuccess(form, successAlert);

                    // Remove auth tokens
                    // 移除认证令牌
                    localStorage.removeItem('auth_token');
                    sessionStorage.removeItem('auth_token');

                    // Redirect to home page after 3 seconds
                    // 3秒后重定向到首页
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                },
                error: function(xhr) {
                    handleApiError(errorAlert, xhr);
                }
            });
        }
    });
}

/**
 * Initialize all account management forms when document is ready
 * 当文档准备就绪时初始化所有账户管理表单
 */
$(document).ready(function() {
    // Initialize change password functionality
    // 初始化更改密码功能
    initChangePassword();

    // Initialize change email functionality
    // 初始化更改邮箱功能
    initChangeEmail();

    // Initialize close account functionality
    // 初始化关闭账户功能
    initCloseAccount();

    // 初始化公开资料编辑按钮
    $('.public-profile-btn').on('click', function(e) {
        e.preventDefault();
        // 直接切换到资料编辑选项卡
        $('#profile-tab').tab('show');
    });

});