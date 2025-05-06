/**
 * 鲨鱼警告列表页面的JavaScript文件
 * JavaScript file for the shark warnings list page
 */

// 当DOM完全加载后执行代码
// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // 初始化变量
    // Initialize variables
    const warningsListContainer = document.getElementById('warnings-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');
    const statusFilter = document.getElementById('status-filter');
    const siteFilter = document.getElementById('site-filter');
    const alertContainer = document.getElementById('alert-container');
    const paginationContainer = document.getElementById('pagination');

    // 分页设置
    // Pagination settings
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalItems = 0;

    // 筛选器设置
    // Filter settings
    let currentStatus = 'active';
    let currentSiteId = '';

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

        // 加载鲨鱼警告列表
        // Load shark warnings list
        loadSharkWarnings();

        // 添加事件监听器
        // Add event listeners
        statusFilter.addEventListener('change', handleFilterChange);
        siteFilter.addEventListener('change', handleFilterChange);
    }

    /**
     * 加载潜水地点列表
     * Load dive sites list
     */
    function loadDiveSites() {
        // 使用fetch API获取潜水地点数据
        // Use fetch API to get dive sites data
        fetch('/api/sites?limit=100')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // 填充潜水地点选择器
                    // Populate the dive site selector
                    const sites = data.data.sites;
                    sites.forEach(site => {
                        const option = document.createElement('option');
                        option.value = site.site_id;
                        option.textContent = site.name;
                        siteFilter.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading dive sites:', error);
                showAlert('加载潜水地点失败。请稍后再试。Failed to load dive sites. Please try again later.', 'danger');
            });
    }

/**
 * 加载鲨鱼警告列表
 * Load shark warnings list
 */
function loadSharkWarnings() {
    // 显示加载指示器
    // Show loading indicator
    showLoading(true);

    // 构建API URL
    // Build API URL
    let url = `/api/shark-warnings?page=${currentPage}&limit=${itemsPerPage}`;

    if (currentStatus) {
        url += `&status=${currentStatus}`;
    }

    if (currentSiteId) {
        url += `&site_id=${currentSiteId}`;
    }

    // 使用fetch API获取鲨鱼警告数据
    // Use fetch API to get shark warnings data
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // 隐藏加载指示器
            // Hide loading indicator
            showLoading(false);

            if (data.status === 'success') {
                const warnings = data.data.warnings;
                totalItems = data.data.pagination.total_items;

                // 渲染鲨鱼警告列表
                // Render shark warnings list
                renderWarningsList(warnings);

                // 渲染分页控件
                // Render pagination
                renderPagination();
            } else {
                throw new Error('Failed to fetch warnings');
            }
        })
        .catch(error => {
            showLoading(false);
            console.error('Error loading shark warnings:', error);
            showAlert('加载鲨鱼警告失败。请稍后再试。Failed to load shark warnings. Please try again later.', 'danger');
        });
}

/**
 * 渲染鲨鱼警告列表
 * Render shark warnings list
 * @param {Array} warnings - 鲨鱼警告数据数组 Array of shark warning data
 */
function renderWarningsList(warnings) {
    // 清空警告列表容器
    // Clear warnings list container
    warningsListContainer.innerHTML = '';

    // 检查是否有警告数据
    // Check if there are any warnings
    if (warnings.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    // 隐藏空状态
    // Hide empty state
    emptyState.classList.add('hidden');

    // 遍历警告数据并创建警告卡片
    // Loop through warnings and create warning cards
    warnings.forEach(warning => {
        // 创建警告卡片元素
        // Create warning card element
        const warningCard = document.createElement('div');
        warningCard.className = 'warning-card';

        // 检查是否接近过期（24小时内）
        // Check if warning is near expiry (within 24 hours)
        const expiryTime = new Date(warning.expires_at);
        const now = new Date();
        const hoursRemaining = (expiryTime - now) / (1000 * 60 * 60);
        const isNearExpiry = warning.status === 'active' && hoursRemaining > 0 && hoursRemaining <= 24;

        // 如果接近过期，添加过期警告标签
        // If near expiry, add expiry warning label
        if (isNearExpiry) {
            const expiryWarning = document.createElement('div');
            expiryWarning.className = 'expiry-warning';
            expiryWarning.textContent = formatRemainingTime(warning.expires_at);
            warningCard.appendChild(expiryWarning);
        }

        // 添加卡片内容
        // Add card content
        warningCard.innerHTML += `
            <div class="warning-card-header">
                <h2 class="warning-card-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${warning.species || '未知鲨鱼 Unknown Shark'} at ${warning.site.name}
                </h2>
                <a href="shark-warning-detail.html?id=${warning.warning_id}" class="btn btn-text">
                    查看详情 View Details <i class="fas fa-arrow-right"></i>
                </a>
            </div>
            <div class="warning-card-content">
                <div class="warning-info">
                    <strong>大小 Size:</strong> ${warning.size_estimate || '未知 Unknown'}
                </div>
                <div class="warning-info">
                    <strong>报告者 Reported by:</strong> ${warning.user?.username || '匿名 Anonymous'}
                </div>
                <div class="warning-info">
                    <strong>报告时间 Reported on:</strong> ${formatDate(warning.reported_at)}
                </div>
                ${warning.description ? `
                <div class="warning-description">
                    ${truncateText(warning.description, 150)}
                </div>` : ''}
            </div>
            <div class="warning-tags">
                <span class="tag tag-${warning.severity || 'medium'}">${getSeverityText(warning.severity)}</span>
                <span class="tag tag-${warning.status}">${getStatusText(warning.status)}</span>
                ${warning.status === 'active' && !isNearExpiry ? `
                <span class="tag">${formatRemainingTime(warning.expires_at)}</span>` : ''}
            </div>
        `;

        // 将警告卡片添加到容器中
        // Add warning card to container
        warningsListContainer.appendChild(warningCard);
    });
}

/**
 * 渲染分页控件
 * Render pagination controls
 */
function renderPagination() {
    // 计算总页数
    // Calculate total pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 如果只有一页，不显示分页控件
    // If there's only one page, don't show pagination
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    // 创建分页HTML
    // Create pagination HTML
    let paginationHTML = '<ul class="pagination">';

    // 上一页按钮
    // Previous page button
    if (currentPage > 1) {
        paginationHTML += `
            <li class="pagination-item">
                <a href="#" class="pagination-link" data-page="${currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }

    // 页码按钮
    // Page number buttons
    const pageRange = getPageRange(currentPage, totalPages);

    pageRange.forEach(page => {
        if (page === '...') {
            paginationHTML += `
                <li class="pagination-item">
                    <span class="pagination-ellipsis">...</span>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="pagination-item">
                    <a href="#" class="pagination-link ${page === currentPage ? 'active' : ''}"
                       data-page="${page}">${page}</a>
                </li>
            `;
        }
    });

    // 下一页按钮
    // Next page button
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="pagination-item">
                <a href="#" class="pagination-link" data-page="${currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }

    paginationHTML += '</ul>';

    // 设置分页HTML
    // Set pagination HTML
    paginationContainer.innerHTML = paginationHTML;

    // 添加分页点击事件
    // Add pagination click events
    const pageLinks = document.querySelectorAll('.pagination-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            currentPage = page;
            loadSharkWarnings();

            // 滚动到页面顶部
            // Scroll to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

/**
 * 获取分页范围
 * Get pagination range
 * @param {Number} currentPage - 当前页码 Current page number
 * @param {Number} totalPages - 总页数 Total pages
 * @returns {Array} - 页码范围数组 Array of page numbers and ellipses
 */
function getPageRange(currentPage, totalPages) {
    const range = [];

    if (totalPages <= 7) {
        // 如果总页数少于等于7，显示所有页码
        // If total pages is less than or equal to 7, show all page numbers
        for (let i = 1; i <= totalPages; i++) {
            range.push(i);
        }
    } else {
        // 总是显示第一页
        // Always show first page
        range.push(1);

        if (currentPage > 3) {
            // 如果当前页大于3，添加省略号
            // If current page is greater than 3, add ellipsis
            range.push('...');
        }

        // 确定中间范围
        // Determine middle range
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        if (currentPage < totalPages - 2) {
            // 如果当前页小于总页数-2，添加省略号
            // If current page is less than total pages - 2, add ellipsis
            range.push('...');
        }

        // 总是显示最后一页
        // Always show last page
        range.push(totalPages);
    }

    return range;
}

/**
 * 处理筛选器变化
 * Handle filter changes
 */
function handleFilterChange() {
    // 获取筛选器值
    // Get filter values
    currentStatus = statusFilter.value;
    currentSiteId = siteFilter.value;

    // 重置到第一页
    // Reset to first page
    currentPage = 1;

    // 重新加载警告列表
    // Reload warnings list
    loadSharkWarnings();
}

/**
 * 显示或隐藏加载指示器
 * Show or hide loading indicator
 * @param {Boolean} show - 是否显示 Whether to show
 */
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        warningsListContainer.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        warningsListContainer.classList.remove('hidden');
    }
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
}

/**
 * 格式化日期
 * Format date
 * @param {String} dateString - 日期字符串 Date string
 * @returns {String} - 格式化后的日期 Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('zh-CN', options);
}

/**
 * 格式化剩余时间
 * Format remaining time
 * @param {String} expiryDateString - 过期日期字符串 Expiry date string
 * @returns {String} - 格式化后的剩余时间 Formatted remaining time
 */
function formatRemainingTime(expiryDateString) {
    const expiryDate = new Date(expiryDateString);
    const now = new Date();

    if (now > expiryDate) {
        return '已过期 Expired';
    }

    const diffMs = expiryDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
        return `${diffDays}天${diffHours}小时后过期 Expires in ${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}小时后过期 Expires in ${diffHours}h`;
}

/**
 * 获取严重程度文本
 * Get severity text
 * @param {String} severity - 严重程度 Severity
 * @returns {String} - 对应的文本 Corresponding text
 */
function getSeverityText(severity) {
    switch (severity) {
        case 'high':
            return '高风险 High Risk';
        case 'medium':
            return '中风险 Medium Risk';
        case 'low':
            return '低风险 Low Risk';
        default:
            return severity || '中风险 Medium Risk';
    }
}

/**
 * 获取状态文本
 * Get status text
 * @param {String} status - 状态 Status
 * @returns {String} - 对应的文本 Corresponding text
 */
function getStatusText(status) {
    switch (status) {
        case 'active':
            return '活跃警告 Active Warning';
        case 'resolved':
            return '已解决 Resolved';
        case 'expired':
            return '已过期 Expired';
        default:
            return status || '活跃 Active';
    }
}

/**
 * 截断文本
 * Truncate text
 * @param {String} text - 文本 Text
 * @param {Number} maxLength - 最大长度 Maximum length
 * @returns {String} - 截断后的文本 Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}