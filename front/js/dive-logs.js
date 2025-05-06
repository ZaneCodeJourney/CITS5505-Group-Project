/*
* Dive.site - 潜水日志页面样式
* 作者：开发团队
* 版本：1.0.0
* 最后更新：2025-04-27
*/

/* 页面标题样式 */
.page-title {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 10px;
    color: var(--primary-color);
}

.title-wavy {
    position: relative;
    padding-bottom: 15px;
}

.title-wavy::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 80px;
    height: 3px;
    background-color: var(--accent-color);
    border-radius: 3px;
}

/* 图表容器样式 */
.chart-container {
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
}

.chart-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
    color: var(--primary-color);
}

/* 表格样式 */
.table-responsive {
    margin-top: 20px;
}

.table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

.table th {
    background-color: var(--bg-color);
    color: var(--primary-color);
    font-weight: 600;
    border-bottom: 2px solid #ddd;
}

.table td {
    vertical-align: middle;
}

.table tr:hover {
    background-color: rgba(52, 152, 219, 0.05);
}

/* 按钮样式 */
.btn-action {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    border-radius: 0.2rem;
    margin-right: 5px;
}

/* 表单样式 */
.form-label {
    font-weight: 500;
    color: var(--primary-color);
}

.form-control:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 0.25rem rgba(52, 152, 219, 0.25);
}

/* 模态框样式 */
.modal-header {
    background-color: var(--accent-color);
    color: white;
    border-bottom: none;
}

.modal-title {
    font-weight: 600;
}

.modal-footer {
    border-top: none;
}

/* 加载中动画 */
.loading {
    text-align: center;
    padding: 20px;
    color: var(--light-text);
}

.loading i {
    font-size: 30px;
    animation: spin 1s infinite linear;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* 错误信息样式 */
.error-message {
    padding: 10px;
    color: var(--danger-color);
    text-align: center;
    border: 1px solid rgba(231, 76, 60, 0.2);
    border-radius: 5px;
    margin: 10px 0;
    background-color: rgba(231, 76, 60, 0.05);
}

/* 警告提示样式 */
#alertContainer {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
}

/* 响应式调整 */
@media (max-width: 992px) {
    .content-container {
        padding: 0 15px;
    }
}

@media (max-width: 768px) {
    .chart-container {
        padding: 15px;
    }

    .btn-action {
        padding: 0.2rem 0.4rem;
        font-size: 0.8rem;
    }

    .table th, .table td {
        padding: 0.5rem;
    }
}