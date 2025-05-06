/**
 * Dive.site - 主要JavaScript文件
 * 作者：开发团队
 * 版本：1.0.0
 * 最后更新：2025-04-27
 */

// 在DOM完全加载后执行
$(document).ready(function() {

    // 初始化Bootstrap工具提示
    initTooltips();

    // 初始化统计数据
    initStatistics();

    // 由于没有后端，直接使用模拟数据
    displayMockData();
    // 初始化Bootstrap工具提示
    initTooltips();

    // 由于没有后端，直接使用模拟数据
    // 实际项目中这里应该是从API获取数据
    displayMockData();

    // 监听搜索框
    initSearchListener();
});

/**
 * 初始化Bootstrap工具提示
 */
function initTooltips() {
    // 为所有带有data-toggle="tooltip"属性的元素启用工具提示
    $('[data-toggle="tooltip"]').tooltip();
}

/**
 * 初始化搜索框事件监听
 */
function initSearchListener() {
    $('.search-btn').on('click', function() {
        const searchQuery = $('.search-bar input').val().trim();
        if (searchQuery) {
            alert('搜索功能：在实际应用中这里会跳转到搜索结果页\n搜索内容: ' + searchQuery);
        }
    });

    // 为搜索框添加回车键事件
    $('.search-bar input').on('keypress', function(e) {
        if (e.which === 13) { // Enter键的keyCode是13
            $('.search-btn').click();
        }
    });
}

/**
 * 显示模拟数据
 * 由于没有后端API，我们直接使用模拟数据
 */
function displayMockData() {
    // 这里可以执行一些初始化动作
    // 在实际项目中这里会调用fetchSharkAlerts()从API获取数据

    // 展示模拟的鲨鱼警告数据
    // mockSharkAlerts已在HTML中静态添加，此处保留代码以供参考
    /*
    const mockData = [
        {
            species: 'Yellow-Edged Moray',
            dive_count: 1,
            site_count: 1,
            risk_level: 'high',
            first_reported: '2025-04-20T08:30:00Z'
        },
        {
            species: 'Pseudoceros Scriptus',
            dive_count: 1,
            site_count: 1,
            risk_level: 'medium',
            first_reported: '2025-04-18T14:15:00Z'
        },
        {
            species: 'Twocoat Coralblenny',
            dive_count: 1,
            site_count: 1,
            risk_level: 'low',
            first_reported: '2025-04-15T11:45:00Z'
        }
    ];

    displaySharkAlerts(mockData);
    */
}

/**
 * 初始化页面统计数据
 */
function initStatistics() {
    // 获取高风险鲨鱼警告数量
    getHighRiskSharkWarningsCount();
}

/**
 * 获取高风险鲨鱼警告数量
 */
function getHighRiskSharkWarningsCount() {
    // 模拟数据 - 在实际应用中应从API获取
    const highRiskCount = 12;

    // 更新高风险警告计数
    $('#high-risk-count').text(highRiskCount);
}

/**
 * 格式化日期为可读格式
 * @param {string} dateString - ISO格式的日期字符串
 * @returns {string} - 格式化后的日期字符串 (例如: "April 25, 2025")
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * 添加交互效果
 * 这些是一些额外的交互效果，可以根据需要添加
 */

// 为潜水点卡片添加悬停效果
$('.dive-site-card').hover(
    function() {
        $(this).css('transform', 'translateY(-3px)');
        $(this).css('box-shadow', '0 5px 15px rgba(0,0,0,0.1)');
    },
    function() {
        $(this).css('transform', 'translateY(0)');
        $(this).css('box-shadow', 'none');
    }
);

// 为鲨鱼警告添加点击展开详情功能
$(document).on('click', '.shark-alert-card', function() {
    alert('在完整版中，点击会显示此鲨鱼警告的详细信息');
});

// 为用户头像添加点击事件
$(document).on('click', '.diver-avatar img', function(e) {
    e.stopPropagation();
    const name = $(this).attr('alt');
    alert('在完整版中，点击会跳转到 ' + name + ' 的个人主页');
});