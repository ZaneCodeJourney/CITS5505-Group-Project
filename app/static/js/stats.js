document.addEventListener('DOMContentLoaded', function() {
    console.log('Stats.js executing...');
    
    // Safely get dive data from element
    try {
        const diveDataElement = document.getElementById('dive-data');
        if (!diveDataElement) {
            console.error('Dive data element not found');
            return;
        }
        
        const diveDataJson = diveDataElement.getAttribute('data-dive-json');
        if (!diveDataJson) {
            console.error('No dive data found in data-dive-json attribute');
            return;
        }
        
        // Try to parse the JSON
        const diveData = JSON.parse(diveDataJson);
        
        // Initialize charts only if we have valid data
        initializeCharts(diveData);
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
});

function initializeCharts(diveData) {
    // Initialize the map
    const mapContainer = document.getElementById('diveMapContainer');
    if (!mapContainer) {
        console.error('Map container element not found');
        return;
    }
    
    const map = L.map('diveMapContainer').setView([20, 0], 2);
    
    // Add the tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add heat map layer if we have coordinates
    if (diveData.coordinates && diveData.coordinates.length > 0) {
        // Format data for heatmap: [lat, lng, intensity]
        const heatPoints = diveData.coordinates.map((coord, index) => {
            // Increase base intensity and use dive count as a multiplier
            const intensity = diveData.dives_count && diveData.dives_count[index] ? diveData.dives_count[index] * 3 : 3;
            return [coord[0], coord[1], intensity];
        });
        
        // Create and add the heatmap layer with much larger spots for demo
        L.heatLayer(heatPoints, {
            radius: 30,  // Much larger radius
            blur: 30,    // More blur for softer edges
            maxZoom: 10,
            minOpacity: 0.6,  // Ensure spots are visible even with few points
            max: 10,  // Lower max value to make spots appear more intense
            gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1: 'red'}
        }).addTo(map);
        
        // If we have points, fit the map to show all points
        if (diveData.coordinates.length > 0) {
            const bounds = L.latLngBounds(diveData.coordinates);
            map.fitBounds(bounds, { padding: [100, 100] });  // More padding
        }
    } else {
        // Display a message if no coordinates are available
        const noDataDiv = document.createElement('div');
        noDataDiv.innerHTML = 'No dive locations with GPS coordinates available. Add latitude and longitude to your dive logs to see them on the map.';
        noDataDiv.style.textAlign = 'center';
        noDataDiv.style.padding = '20px';
        noDataDiv.style.color = '#666';
        mapContainer.appendChild(noDataDiv);
    }
    
    // Species Pie Chart
    if (diveData.species_names && diveData.species_names.length > 0) {
        const speciesCanvas = document.getElementById('speciesChart');
        if (!speciesCanvas) {
            console.error('Species chart canvas not found');
        } else {
            const speciesCtx = speciesCanvas.getContext('2d');
            new Chart(speciesCtx, {
                type: 'pie',
                data: {
                    labels: diveData.species_names,
                    datasets: [{
                        data: diveData.species_counts,
                        backgroundColor: [
                            '#4a89dc', '#50c878', '#ff6b6b', '#ffd166', 
                            '#8a2be2', '#20b2aa', '#ff7f50', '#6a5acd',
                            '#9370db', '#3cb371', '#f08080', '#ffa07a',
                            '#66cdaa', '#9932cc', '#e9967a', '#8fbc8f'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 15,
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } else {
        const speciesCanvas = document.getElementById('speciesChart');
        if (speciesCanvas) {
            const ctx = speciesCanvas.getContext('2d');
            ctx.font = '14px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No species data available', speciesCanvas.width / 2, speciesCanvas.height / 2);
        }
    }
    
    // Depth Chart
    const depthCanvas = document.getElementById('depthChart');
    if (depthCanvas) {
        const depthCtx = depthCanvas.getContext('2d');
        new Chart(depthCtx, {
            type: 'line',
            data: {
                labels: diveData.dates,
                datasets: [{
                    label: 'Depth (meters)',
                    data: diveData.depths,
                    borderColor: '#4a89dc',
                    backgroundColor: 'rgba(74, 137, 220, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        reverse: true,
                        title: {
                            display: true,
                            text: 'Depth (m)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }
    
    // Duration Chart
    const durationCanvas = document.getElementById('durationChart');
    if (durationCanvas) {
        const durationCtx = durationCanvas.getContext('2d');
        new Chart(durationCtx, {
            type: 'line',
            data: {
                labels: diveData.dates,
                datasets: [{
                    label: 'Duration (minutes)',
                    data: diveData.durations,
                    borderColor: '#50c878',
                    backgroundColor: 'rgba(80, 200, 120, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Duration (min)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }
    
    // Location Chart
    const locationCanvas = document.getElementById('locationChart');
    if (locationCanvas) {
        const locationCtx = locationCanvas.getContext('2d');
        new Chart(locationCtx, {
            type: 'doughnut',
            data: {
                labels: diveData.locations,
                datasets: [{
                    data: diveData.dives_per_location,
                    backgroundColor: [
                        '#4a89dc', '#50c878', '#ff6b6b', '#ffd166', 
                        '#8a2be2', '#20b2aa', '#ff7f50', '#6a5acd'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
    
    // Monthly Chart
    const monthlyCanvas = document.getElementById('monthlyChart');
    if (monthlyCanvas) {
        const monthlyCtx = monthlyCanvas.getContext('2d');
        new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: diveData.months,
                datasets: [{
                    label: 'Number of Dives',
                    data: diveData.dives_per_month,
                    backgroundColor: 'rgba(74, 137, 220, 0.7)',
                    borderColor: '#4a89dc',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Dives'
                        }
                    }
                }
            }
        });
    }
} 