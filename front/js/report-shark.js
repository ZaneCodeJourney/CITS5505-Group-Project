/**
 * 报告鲨鱼目击页面的JavaScript文件
 * JavaScript file for the report shark sighting page
 */

// 当DOM完全加载后执行代码
// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // 初始化变量
    // Initialize variables
    const reportForm = document.getElementById('report-form');
    const siteSelect = document.getElementById('site-id');
    const photoInput = document.getElementById('photo');
    const fileNameSpan = document.getElementById('file-name');
    const alertContainer = document.getElementById('alert-container');
    const successModal = document.getElementById('success-modal');

    // 初始化页面
    // Initialize page
    init();

    /**
     * 初始化函数
     * Initialization function
     */
    function init() {
        // 加载潜水地点列表
        // Load dive sites list
        loadDiveSites();

        // 设置默认目击时间为当前时间
        // Set default sighting time to current time
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // 解决时区问题 Fix timezone issue
        const formattedNow = now.toISOString().slice(0, 16);
        document.getElementById('sighting-time').value = formattedNow;

        // 添加文件上传事件监听器
        // Add file upload event listener
        photoInput.addEventListener('change', updateFileName);

        // 添加表单提交事件监听器
        // Add form submission event listener
        reportForm.addEventListener('submit', handleFormSubmit);
    }

    /**
     * 加载潜水地点列表
     * Load dive sites list
     */
    function loadDiveSites() {
        // 模拟API调用 - 实际项目中替换为真实API
        // Simulate API call - replace with real API in actual project
        simulateApiCall('/api/sites?limit=100', function(response) {
            if (response.status === 'success') {
                // 填充潜水地点选择器
                // Populate dive site selector
                const sites = response.data.sites;
                sites.forEach(site => {
                    const option = document.createElement('option');
                    option.value = site.site_id;
                    option.textContent = site.name;
                    siteSelect.appendChild(option);
                });
            } else {
                console.error('Error loading dive sites:', response.error);
                showAlert('加载潜水地点失败。请稍后再试。Failed to load dive sites. Please try again later.', 'danger');
            }
        });
    }

    /**
     * 更新文件名显示
     * Update file name display
     */
    function updateFileName() {
        const fileName = photoInput.files.length > 0 ?
                        photoInput.files[0].name :
                        '未选择文件 No file chosen';

        fileNameSpan.textContent = fileName;
    }

    /**
     * 处理表单提交
     * Handle form submission
     * @param {Event} e - 事件对象 Event object
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // 获取表单数据
        // Get form data
        const formData = new FormData(reportForm);

        // 添加加载效果到提交按钮
        // Add loading effect to submit button
        const submitButton = reportForm.querySelector('.submit-button');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中... Submitting...';
        submitButton.disabled = true;

        // 读取照片文件（如果有）
        // Read photo file (if any)
        const photoFile = photoInput.files[0];

        if (photoFile) {
            // 验证文件大小
            // Validate file size
            if (photoFile.size > 5 * 1024 * 1024) { // 5MB
                showAlert('照片大小超过限制（最大5MB）。Photo size exceeds limit (max 5MB).', 'danger');
                resetSubmitButton();
                return;
            }

            // 读取文件为Base64格式
            // Read file as Base64 format
            const reader = new FileReader();

            reader.onload = function(fileEvent) {
                // 构建请求数据
                // Build request data
                const requestData = {
                    site_id: formData.get('site_id'),
                    species: formData.get('species'),
                    size_estimate: formData.get('size_estimate'),
                    sighting_time: formData.get('sighting_time'),
                    severity: formData.get('severity'),
                    description: formData.get('description'),
                    photo: fileEvent.target.result
                };

                // 发送数据
                // Send data
                submitReport(requestData, resetSubmitButton);
            };

            reader.onerror = function() {
                showAlert('读取照片时发生错误。请稍后再试。Error reading photo. Please try again.', 'danger');
                resetSubmitButton();
            };

            reader.readAsDataURL(photoFile);
        } else {
            // 无照片，直接构建请求数据
            // No photo, build request data directly
            const requestData = {
                site_id: formData.get('site_id'),
                species: formData.get('species'),
                size_estimate: formData.get('size_estimate'),
                sighting_time: formData.get('sighting_time'),
                severity: formData.get('severity'),
                description: formData.get('description')
            };

            // 发送数据
            // Send data
            submitReport(requestData, resetSubmitButton);
        }

        /**
         * 重置提交按钮
         * Reset submit button
         */
        function resetSubmitButton() {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }

    /**
     * 提交报告
     * Submit report
     * @param {Object} data - 请求数据 Request data
     * @param {Function} callback - 回调函数 Callback function
     */
    function submitReport(data, callback) {
        // 模拟API调用 - 实际项目中替换为真实API
        // Simulate API call - replace with real API in actual project
        simulateApiCall(`/api/sites/${data.site_id}/shark-warnings`, function(response) {
            if (response.status === 'success') {
                // 显示成功模态窗口
                // Show success modal
                showSuccessModal();
            } else {
                console.error('Error submitting report:', response.error);
                showAlert('提交报告失败。请稍后再试。Failed to submit report. Please try again later.', 'danger');
            }

            // 执行回调
            // Execute callback
            if (callback) callback();
        }, data, 'POST');
    }

    /**
     * 显示成功模态窗口
     * Show success modal
     */
    function showSuccessModal() {
        successModal.classList.add('show');
    }

    /**
     * 显示警告消息
     * Show alert message
     * @param {String} message - 消息内容 Message content
     * @param {String} type - 消息类型 Message type (success, danger, warning, info)
     */
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // 清空并添加警告
        // Clear and add alert
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alert);

        // 5秒后自动关闭警告
        // Auto close alert after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);

        // 滚动到警告消息
        // Scroll to alert message
        alertContainer.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 模拟API调用（用于演示）
     * Simulate API call (for demonstration)
     * @param {String} url - API URL
     * @param {Function} callback - 回调函数 Callback function
     * @param {Object} data - 请求数据 Request data
     * @param {String} method - 请求方法 Request method
     */
    function simulateApiCall(url, callback, data = null, method = 'GET') {
        console.log(`Simulating ${method} API call to:`, url);
        if (data) console.log('With data:', data);

        // 模拟网络延迟
        // Simulate network delay
        setTimeout(() => {
            if (url.includes('/api/sites') && method === 'GET') {
                // 模拟潜水地点数据
                // Simulate dive sites data
                callback({
                    status: 'success',
                    data: {
                        sites: [
                            { site_id: 1, name: '蓝洞 Blue Hole', lat: -31.9523, lng: 115.8613 },
                            { site_id: 2, name: '大堡礁 Great Barrier Reef', lat: -16.7551, lng: 145.9823 },
                            { site_id: 3, name: '珊瑚湾 Coral Bay', lat: 22.3456, lng: 114.1234 },
                            { site_id: 4, name: '龙洞 Dragon Cave', lat: 25.1234, lng: 121.9876 },
                            { site_id: 5, name: '鲨鱼点 Shark Point', lat: -34.5678, lng: 150.8765 }
                        ]
                    }
                });
            } else if (url.includes('/shark-warnings') && method === 'POST') {
                // 模拟提交鲨鱼警告
                // Simulate submitting shark warning
                callback({
                    status: 'success',
                    data: {
                        warning_id: Math.floor(Math.random() * 1000) + 1,
                        message: '鲨鱼警告已成功提交。Shark warning has been successfully submitted.'
                    }
                });
            } else {
                // 模拟错误
                // Simulate error
                callback({
                    status: 'error',
                    error: {
                        code: 'api_error',
                        message: '无效的API请求 Invalid API request'
                    }
                });
            }
        }, 1500); // 模拟1.5秒延迟 Simulate 1.5s delay
    }
});