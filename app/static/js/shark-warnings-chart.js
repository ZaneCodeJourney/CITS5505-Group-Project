/**
 * 鲨鱼警告统计图表的JavaScript文件
 * JavaScript file for shark warning statistics charts
 */

// 当DOM完全加载后执行代码
// Execute code when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在统计页面
    // Check if on stats page
    const statsContainer = document.getElementById('shark-warning-stats');
    if (!statsContainer) return;

    // 加载Chart.js库
    // Load Chart.js library
    loadChartJS().then(() => {
        // 加载统计数据
        // Load statistics data
        loadSharkWarningStats();
    }).catch(error => {
        console.error('Error loading Chart.js:', error);
        showError('加载图表库失败。请刷新页面重试。Failed to load chart library. Please refresh and try again.');
    });

    /**
     * 加载Chart.js库
     * Load Chart.js library
     * @returns {Promise} - Promise对象 Promise object
     */
    function loadChartJS() {
        return new Promise((resolve, reject) => {
            if (window.Chart) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 加载鲨鱼警告统计数据
     * Load shark warning statistics data
     */
    function loadSharkWarningStats() {
        // 显示加载指示器
        // Show loading indicator
        statsContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>加载中... Loading...</p></div>';

        // 使用fetch API获取统计数据
        // Use fetch API to get statistics data
        fetch('/api/shark-warnings/stats')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // 渲染统计图表
                    // Render statistics charts
                    renderStatisticsCharts(data.data);
                } else {
                    throw new Error('Failed to fetch statistics');
                }
            })
            .catch(error => {
                console.error('Error loading statistics:', error);
                showError('加载统计数据失败。请稍后再试。Failed to load statistics. Please try again later.');
            });
    }

    /**
     * 渲染统计图表
     * Render statistics charts
     * @param {Object} stats - 统计数据 Statistics data
     */
    function renderStatisticsCharts(stats) {
        // 清空容器
        // Clear container
        statsContainer.innerHTML = '';

        // 创建图表容器
        // Create chart containers
        const severityChartContainer = document.createElement('div');
        severityChartContainer.className = 'chart-container';

        const statusChartContainer = document.createElement('div');
        statusChartContainer.className = 'chart-container';

        const monthlyChartContainer = document.createElement('div');
        monthlyChartContainer.className = 'chart-container';

        const siteChartContainer = document.createElement('div');
        siteChartContainer.className = 'chart-container';

        // 添加标题和图表画布
        // Add titles and chart canvases
        severityChartContainer.innerHTML = '<h3>严重程度分布 Severity Distribution</h3><canvas id="severity-chart"></canvas>';
        statusChartContainer.innerHTML = '<h3>警告状态分布 Status Distribution</h3><canvas id="status-chart"></canvas>';
        monthlyChartContainer.innerHTML = '<h3>月度鲨鱼目击趋势 Monthly Shark Sighting Trends</h3><canvas id="monthly-chart"></canvas>';
        siteChartContainer.innerHTML = '<h3>热门鲨鱼目击地点 Top Shark Sighting Locations</h3><canvas id="site-chart"></canvas>';

        // 添加到主容器
        // Add to main container
        statsContainer.appendChild(severityChartContainer);
        statsContainer.appendChild(statusChartContainer);
        statsContainer.appendChild(monthlyChartContainer);
        statsContainer.appendChild(siteChartContainer);

        // 创建饼图：严重程度分布
        // Create pie chart: Severity distribution
        createPieChart('severity-chart',
                       '严重程度分布 Severity Distribution',
                       stats.severity_counts,
                       ['low', 'medium', 'high'],
                       ['低 Low', '中 Medium', '高 High'],
                       ['#1890ff', '#faad14', '#ff4d4f']);

        // 创建饼图：状态分布
        // Create pie chart: Status distribution
        createPieChart('status-chart',
                       '警告状态分布 Status Distribution',
                       stats.status_counts,
                       ['active', 'resolved', 'expired'],
                       ['活跃 Active', '已解决 Resolved', '已过期 Expired'],
                       ['#ff4d4f', '#52c41a', '#d9d9d9']);

        // 创建折线图：月度趋势
        // Create line chart: Monthly trends
        createLineChart('monthly-chart',
                        '月度鲨鱼目击趋势 Monthly Shark Sighting Trends',
                        stats.monthly_counts);

        // 创建柱状图：热门地点
        // Create bar chart: Top locations
        createBarChart('site-chart',
                       '热门鲨鱼目击地点 Top Shark Sighting Locations',
                       stats.site_counts);
    }

    /**
     * 创建饼图
     * Create pie chart
     * @param {String} canvasId - 画布ID Canvas ID
     * @param {String} title - 图表标题 Chart title
     * @param {Object} data - 图表数据 Chart data
     * @param {Array} keys - 数据键 Data keys
     * @param {Array} labels - 显示标签 Display labels
     * @param {Array} colors - 颜色数组 Color array
     */
    function createPieChart(canvasId, title, data, keys, labels, colors) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        const values = keys.map(key => data[key] || 0);

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = values.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 创建折线图
     * Create line chart
     * @param {String} canvasId - 画布ID Canvas ID
     * @param {String} title - 图表标题 Chart title
     * @param {Object} data - 图表数据 Chart data
     */
    function createLineChart(canvasId, title, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        // 排序月份
        // Sort months
        const months = Object.keys(data).sort();
        const values = months.map(month => data[month]);

        // 格式化月份标签
        // Format month labels
        const labels = months.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                               '七月', '八月', '九月', '十月', '十一月', '十二月'];
            return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '鲨鱼目击数量 Shark Sightings',
                    data: values,
                    borderColor: '#1890ff',
                    backgroundColor: 'rgba(24, 144, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom'
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
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    /**
     * 创建柱状图
     * Create bar chart
     * @param {String} canvasId - 画布ID Canvas ID
     * @param {String} title - 图表标题 Chart title
     * @param {Object} data - 图表数据 Chart data
     */
    function createBarChart(canvasId, title, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        // 按警告数量降序排序
        // Sort by warning count in descending order
        const sortedSites = Object.entries(data)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10); // 只显示前10个 Show only top 10

        const siteNames = sortedSites.map(site => site[1].name);
        const siteCounts = sortedSites.map(site => site[1].count);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: siteNames,
                datasets: [{
                    label: '警告数量 Warning Count',
                    data: siteCounts,
                    backgroundColor: 'rgba(24, 144, 255, 0.7)',
                    borderColor: '#1890ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom'
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
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    /**
     * 显示错误消息
     * Show error message
     * @param {String} message - 错误消息 Error message
     */
    function showError(message) {
        statsContainer.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>${message}</p></div>`;
    }
});