let allWarnings = [];
let allSites = [];
let warningsChart = null;

document.addEventListener('DOMContentLoaded', function() {
    // Load data
    loadSharkWarnings();
    loadDiveSites();
});

async function loadSharkWarnings() {
    try {
        // Try actual API path
        let response;
        
        try {
            console.log("Attempting to load shark warnings from primary API path");
            response = await fetch('/api/shark-warnings/', {
                method: 'GET',
                headers: {
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                credentials: 'same-origin'
            });
        } catch (firstError) {
            console.log("First attempt failed, trying alternative path:", firstError);
            response = await fetch('/shark/', {
                method: 'GET',
                headers: {
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                credentials: 'same-origin'
            });
        }
        
        if (response.ok) {
            allWarnings = await response.json();
            console.log("Successfully loaded shark warnings:", allWarnings.length, "warnings");
            
            // Ensure consistency in data types by converting IDs to strings
            allWarnings = allWarnings.map(warning => ({
                ...warning,
                id: String(warning.id),
                site_id: String(warning.site_id),
                user_id: String(warning.user_id)
            }));
            
            // Check for expired warnings (older than 7 days)
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            allWarnings = allWarnings.map(warning => {
                // Skip already resolved warnings
                if (warning.status === 'resolved') {
                    return warning;
                }
                
                try {
                    const warningDate = new Date(warning.sighting_time);
                    // Check if warning is older than 7 days
                    if (warningDate < sevenDaysAgo) {
                        console.log(`Warning ID ${warning.id} is older than 7 days, marking as expired`);
                        return {
                            ...warning,
                            status: 'expired',
                            original_status: warning.status // Store original status for reference
                        };
                    }
                } catch (e) {
                    console.warn(`Error checking date for warning ID ${warning.id}:`, e);
                }
                
                return warning;
            });
            
            console.log("First warning after type normalization:", allWarnings[0]);
        } else {
            console.warn("API returned non-success status code:", response.status);
            // Use test data
            allWarnings = generateTestWarnings();
            
            // Apply expiration logic to test data too
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            allWarnings = allWarnings.map(warning => {
                // Skip already resolved warnings
                if (warning.status === 'resolved') {
                    return warning;
                }
                
                try {
                    const warningDate = new Date(warning.sighting_time);
                    // Check if warning is older than 7 days
                    if (warningDate < sevenDaysAgo) {
                        console.log(`Test warning ID ${warning.id} is older than 7 days, marking as expired`);
                        return {
                            ...warning,
                            status: 'expired',
                            original_status: warning.status // Store original status for reference
                        };
                    }
                } catch (e) {
                    console.warn(`Error checking date for test warning ID ${warning.id}:`, e);
                }
                
                return warning;
            });
            
            // Add an info message
            addInfoAlert("Using test data for display. Actual API data will be shown when backend is fully implemented.");
        }
        
        updateStatistics(allWarnings);
        renderChart(allWarnings);
        renderWarnings(allWarnings);
    } catch (error) {
        console.error('Failed to load shark warnings:', error);
        
        // Use test data
        allWarnings = generateTestWarnings();
        updateStatistics(allWarnings);
        renderChart(allWarnings);
        renderWarnings(allWarnings);
        
        // Add an info message
        addInfoAlert("Error loading warning data. Using test data instead.");
    }
}

function addInfoAlert(message) {
    const container = document.getElementById('warnings-container');
    const alert = document.createElement('div');
    alert.className = 'alert alert-info';
    alert.style.gridColumn = "1/-1";
    alert.style.marginBottom = "20px";
    alert.innerHTML = message;
    container.insertAdjacentElement('beforebegin', alert);
}

async function loadDiveSites() {
    try {
        console.log("Attempting to load dive sites from API");
        const response = await fetch('/api/sites/', {
            method: 'GET',
            headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            allSites = await response.json();
            console.log("Successfully loaded site data:", allSites.length, "sites");
            
            // Ensure consistency in data types by converting IDs to strings
            allSites = allSites.map(site => ({
                ...site,
                id: String(site.id)
            }));
            
            console.log("First site after type normalization:", allSites[0]);
        } else {
            console.warn("Site API returned status code:", response.status);
            // Use test data
            allSites = generateTestSites();
            console.log("Using test site data");
        }
    } catch (error) {
        console.error('Failed to load site data:', error);
        
        // Use test data
        allSites = generateTestSites();
    }
}

function updateStatistics(warnings) {
    // Count active alerts (not expired or resolved)
    const activeCount = warnings.filter(w => w.status === 'active').length;
    animateCounter('active-count', activeCount);
    
    // Count high-risk alerts (only active ones)
    const highCount = warnings.filter(w => w.severity === 'high' && w.status === 'active').length;
    animateCounter('high-count', highCount);
    
    // Count recent alerts (last 7 days) - by definition, these are all the non-expired active alerts
    const recentCount = warnings.filter(w => w.status === 'active').length;
    animateCounter('recent-count', recentCount);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000; // Animation duration (milliseconds)
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            const currentValue = Math.round(startValue + progress * (targetValue - startValue));
            element.textContent = currentValue;
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue;
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function renderChart(warnings) {
    // Group alerts by date (last 30 days)
    const dates = {};
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Initialize counts for all dates to 0
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates[dateStr] = { low: 0, medium: 0, high: 0 };
    }
    
    // Count alerts by date and risk level
    warnings.forEach(warning => {
        const warningDate = new Date(warning.sighting_time);
        if (warningDate >= thirtyDaysAgo) {
            const dateStr = warningDate.toISOString().split('T')[0];
            if (dates[dateStr]) {
                dates[dateStr][warning.severity]++;
            }
        }
    });
    
    // Prepare Chart.js data
    const dateLabels = Object.keys(dates).sort();
    const lowData = dateLabels.map(date => dates[date].low);
    const mediumData = dateLabels.map(date => dates[date].medium);
    const highData = dateLabels.map(date => dates[date].high);
    
    // If chart already exists, destroy it
    if (warningsChart) {
        warningsChart.destroy();
    }
    
    // Create chart
    const ctx = document.getElementById('warningsChart').getContext('2d');
    warningsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dateLabels.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Low Risk',
                    data: lowData,
                    backgroundColor: '#32d74b',
                    borderColor: '#32d74b',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Medium Risk',
                    data: mediumData,
                    backgroundColor: '#ff9f0a',
                    borderColor: '#ff9f0a',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: 'High Risk',
                    data: highData,
                    backgroundColor: '#ff3b30',
                    borderColor: '#ff3b30',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1d1d1f',
                    bodyColor: '#1d1d1f',
                    borderColor: '#d2d2d7',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12,
                    boxPadding: 6,
                    titleFont: {
                        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        size: 14,
                        weight: 600
                    },
                    bodyFont: {
                        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        size: 14
                    },
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' alerts';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            size: 12
                        },
                        color: '#86868b'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: '#f5f5f7'
                    },
                    ticks: {
                        precision: 0,
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            size: 12
                        },
                        color: '#86868b'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function renderWarnings(warnings) {
    const container = document.getElementById('warnings-container');
    const noWarnings = document.getElementById('no-warnings');
    
    if (!warnings || warnings.length === 0) {
        console.log("No warnings to display");
        container.innerHTML = '';
        container.appendChild(noWarnings);
        noWarnings.style.display = 'block';
        return;
    }
    
    console.log(`Rendering ${warnings.length} warnings`);
    
    // Clear container and hide "no warnings" message
    container.innerHTML = '';
    noWarnings.style.display = 'none';
    
    // Find site name for each warning
    warnings.forEach((warning, index) => {
        // Skip if warning is invalid
        if (!warning) {
            console.warn("Encountered invalid warning object:", warning);
            return;
        }
        
        try {
            const site = allSites.find(s => String(s.id) === String(warning.site_id));
            const siteName = site ? site.name : `Unknown Site (ID: ${warning.site_id})`;
            
            // Format date
            let dateFormatted = "Unknown date";
            try {
                if (warning.sighting_time) {
                    const sightingDate = new Date(warning.sighting_time);
                    dateFormatted = sightingDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (e) {
                console.warn("Error formatting date:", e);
            }
            
            // Create warning card
            const card = document.createElement('div');
            card.className = 'warning-card';
            if (warning.status === 'expired') {
                card.classList.add('expired-warning');
            }
            card.style.animationDelay = `${index * 0.1}s`;
            
            // Ensure warning has all required properties
            const species = warning.species || 'Unknown Species';
            const severity = warning.severity || 'medium';
            const status = warning.status || 'active';
            const size = warning.size_estimate || 'Unknown';
            const description = warning.description || '';
            
            card.innerHTML = `
                <div class="warning-header severity-${severity} ${getStatusStyle(status)}">
                    ${getSpeciesName(species)}
                    <span class="status-badge">${getStatusText(status)}</span>
                </div>
                <div class="warning-body">
                    <div class="warning-site">${siteName}</div>
                    
                    <div class="warning-info">
                        <div class="warning-info-label">Size:</div>
                        <div>${size}</div>
                    </div>
                    
                    <div class="warning-info">
                        <div class="warning-info-label">Risk Level:</div>
                        <div>${getSeverityText(severity)}</div>
                    </div>
                    
                    ${description ? `<p>${description}</p>` : ''}
                    
                    ${warning.photo ? 
                        `<img src="${warning.photo}" alt="Shark sighting photo" class="warning-photo">` : ''}
                    
                    <div class="warning-time">Sighting time: ${dateFormatted}</div>
                    
                    ${status === 'expired' ? 
                        `<div class="warning-expired-notice">
                            <p><strong>Notice:</strong> This alert has expired automatically after 7 days</p>
                        </div>` : ''}
                    
                    ${status === 'active' && isCurrentUser(warning.user_id) ?
                        `<div class="warning-actions">
                            <button class="resolve-btn" data-id="${warning.id}">Mark as Resolved</button>
                        </div>` : ''}
                </div>
            `;
            
            container.appendChild(card);
            
            // Add event listener for resolve button (if exists)
            const resolveBtn = card.querySelector('.resolve-btn');
            if (resolveBtn) {
                resolveBtn.addEventListener('click', function() {
                    resolveWarning(warning.id);
                });
            }
        } catch (error) {
            console.error("Error rendering warning card:", error, warning);
        }
    });
}

function getSpeciesName(species) {
    return species ? capitalizeFirst(species) : 'Unidentified Shark Species';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSeverityText(severity) {
    const severityMap = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High'
    };
    return severityMap[severity] || severity;
}

function getStatusText(status) {
    const statusMap = {
        'active': 'ACTIVE',
        'resolved': 'RESOLVED',
        'expired': 'EXPIRED'
    };
    return statusMap[status] || status;
}

function getStatusStyle(status) {
    // Return CSS classes for different statuses
    if (status === 'expired') {
        return 'status-expired';
    }
    return '';
}

function isCurrentUser(userId) {
    // Get current user ID from container's data attribute
    const container = document.querySelector('.container');
    const currentUserId = parseInt(container.getAttribute('data-user-id')) || null;
    return currentUserId === userId;
}

async function resolveWarning(warningId) {
    try {
        // Store the current warning state before making the API call
        const warningToResolve = allWarnings.find(w => w.id === warningId);
        if (!warningToResolve) {
            console.error("Could not find warning with ID:", warningId);
            showErrorMessage("Could not find shark warning to resolve. Please refresh the page and try again.");
            return;
        }
        
        // Create a deep copy of the warning for rollback if needed
        const warningBackup = JSON.parse(JSON.stringify(warningToResolve));
        
        // Update local data optimistically first
        warningToResolve.status = 'resolved';
        
        // Update UI immediately
        updateStatistics(allWarnings);
        renderChart(allWarnings);
        
        // Only modify the DOM for this specific warning card
        const warningCard = document.querySelector(`.resolve-btn[data-id="${warningId}"]`)?.closest('.warning-card');
        
        if (warningCard) {
            // Update status badge
            const statusBadge = warningCard.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = getStatusText('resolved');
            }
            
            // Remove resolve button
            const resolveBtn = warningCard.querySelector('.resolve-btn');
            if (resolveBtn) {
                resolveBtn.closest('.warning-actions').remove();
            }
            
            // Hide the card with animation
            warningCard.style.opacity = '0';
            warningCard.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                // Remove from DOM
                warningCard.remove();
                
                // Check if there are no more warnings after removal
                const remainingCards = document.querySelectorAll('.warning-card');
                if (remainingCards.length === 0) {
                    const noWarnings = document.getElementById('no-warnings');
                    const container = document.getElementById('warnings-container');
                    container.appendChild(noWarnings);
                    noWarnings.style.display = 'block';
                }
            }, 500);
        } else {
            console.warn("Warning card not found in DOM. This might happen if the card was already removed.");
        }
        
        // Show success message
        showSuccessMessage("Alert successfully marked as resolved.");
        
        // Now make the actual API call
        let response;
        try {
            response = await fetch(`/api/shark-warnings/${warningId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    status: 'resolved'
                })
            });
        } catch (firstError) {
            console.log("First attempt failed, trying alternative path");
            response = await fetch(`/shark/${warningId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    status: 'resolved'
                })
            });
        }
        
        if (!response.ok) {
            console.error("Failed to mark alert as resolved, status code:", response.status);
            
            // Rollback the change on failure
            Object.assign(warningToResolve, warningBackup);
            
            // Show error message
            showErrorMessage("Failed to mark alert as resolved. Please try again.");
        }
    } catch (error) {
        console.error('Error marking alert as resolved:', error);
        
        // Show error message
        showErrorMessage("Error: " + error.message);
    }
}

function showSuccessMessage(message) {
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success';
    successAlert.style.gridColumn = "1/-1";
    successAlert.style.marginBottom = "20px";
    successAlert.innerHTML = message;
    
    const container = document.getElementById('warnings-container');
    container.insertAdjacentElement('beforebegin', successAlert);
    
    // Fade out message after 2 seconds
    setTimeout(() => {
        successAlert.style.opacity = '0';
        successAlert.style.transition = 'opacity 0.5s';
        setTimeout(() => successAlert.remove(), 500);
    }, 2000);
}

function showErrorMessage(message) {
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger';
    errorAlert.style.gridColumn = "1/-1";
    errorAlert.style.marginBottom = "20px";
    errorAlert.innerHTML = message;
    
    const container = document.getElementById('warnings-container');
    container.insertAdjacentElement('beforebegin', errorAlert);
    
    setTimeout(() => {
        errorAlert.style.opacity = '0';
        errorAlert.style.transition = 'opacity 0.5s';
        setTimeout(() => errorAlert.remove(), 500);
    }, 3000);
}

// Generate test site data
function generateTestSites() {
    return [
        { id: "1", name: "Great Barrier Reef", region: "Queensland", country: "Australia" },
        { id: "2", name: "Blue Hole", region: "Belize City", country: "Belize" },
        { id: "3", name: "Sipadan Island", region: "Sabah", country: "Malaysia" },
        { id: "4", name: "Maldives", region: "Ari Atoll", country: "Maldives" },
        { id: "5", name: "Red Sea", region: "Sharm El Sheikh", country: "Egypt" }
    ];
}

// Generate test warning data
function generateTestWarnings() {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return [
        {
            id: "1",
            site_id: "1",
            user_id: "1",
            species: "Great White Shark",
            size_estimate: "4 meters",
            description: "Large Great White observed near the outer reef. Moving slowly but appeared curious.",
            sighting_time: new Date(now - 2 * oneDayMs).toISOString(),
            severity: "high",
            status: "active",
            photo: null
        },
        {
            id: "2",
            site_id: "3",
            user_id: "2",
            species: "Reef Shark",
            size_estimate: "1.5 meters",
            description: "Small reef shark seen during night dive. Non-aggressive.",
            sighting_time: new Date(now - 5 * oneDayMs).toISOString(),
            severity: "low",
            status: "active",
            photo: null
        },
        {
            id: "3",
            site_id: "2",
            user_id: "1",
            species: "Bull Shark",
            size_estimate: "2.5 meters",
            description: "Bull shark lingering near dive site entrance. Showing territorial behavior.",
            sighting_time: new Date(now - 1 * oneDayMs).toISOString(),
            severity: "medium",
            status: "active",
            photo: null
        },
        {
            id: "4",
            site_id: "4",
            user_id: "3",
            species: "Tiger Shark",
            size_estimate: "3 meters",
            description: "Tiger shark spotted at a distance. Did not approach divers.",
            sighting_time: new Date(now - 10 * oneDayMs).toISOString(),
            severity: "medium",
            status: "resolved",
            photo: null
        },
        {
            id: "5",
            site_id: "5",
            user_id: "2",
            species: "Hammerhead Shark",
            size_estimate: "2 meters",
            description: "Group of hammerhead sharks seen during drift dive.",
            sighting_time: new Date(now - 12 * oneDayMs).toISOString(),
            severity: "low",
            status: "active",
            photo: null
        },
        {
            id: "6",
            site_id: "1",
            user_id: "1",
            species: "Lemon Shark",
            size_estimate: "2.5 meters",
            description: "Lemon shark observed following small boats near the shore.",
            sighting_time: new Date(now - 8 * oneDayMs).toISOString(),
            severity: "medium",
            status: "active",
            photo: null
        }
    ];
} 