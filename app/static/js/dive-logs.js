/*
* Dive.site - Dive Logs Page Styles
* Author: Development Team
* Version: 1.0.0
* Last Updated: 2025-04-27
*/

/* Page title styles */
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

/* Chart container styles */
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

/* Table styles */
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

/* Button styles */
.btn-action {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    border-radius: 0.2rem;
    margin-right: 5px;
}

/* Form styles */
.form-label {
    font-weight: 500;
    color: var(--primary-color);
}

.form-control:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 0.25rem rgba(52, 152, 219, 0.25);
}

/* Modal styles */
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

/* Loading animation */
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

/* Error message styles */
.error-message {
    padding: 10px;
    color: var(--danger-color);
    text-align: center;
    border: 1px solid rgba(231, 76, 60, 0.2);
    border-radius: 5px;
    margin: 10px 0;
    background-color: rgba(231, 76, 60, 0.05);
}

/* Alert styles */
#alertContainer {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
}

/* Responsive adjustments */
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