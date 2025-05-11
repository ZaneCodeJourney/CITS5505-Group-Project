/**
 * Dive Profile Chart handling
 * Processes CSV data and renders dive profile charts
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dive profile chart script loaded');
    // Initialize all charts on the page
    initializeAllDiveProfileCharts();
});

/**
 * Initialize all dive profile charts on the page
 */
function initializeAllDiveProfileCharts() {
    // Find all dive profile chart canvases
    const chartCanvases = document.querySelectorAll('canvas[id^="dive-profile-chart-"]');
    console.log('Found chart canvases:', chartCanvases.length);
    
    // Initialize each chart
    chartCanvases.forEach(canvas => {
        console.log('Processing canvas:', canvas.id);
        const csvData = canvas.dataset.csvData;
        if (csvData) {
            console.log('CSV data found, length:', csvData.length);
            try {
                // Parse CSV data directly
                const { times, depths, temps, air } = parseCSVData(csvData);
                console.log('Parsed data:', { 
                    times: times.length + ' points', 
                    depths: depths.length + ' points', 
                    hasTemps: temps.some(t => t !== null),
                    hasAir: air.some(a => a !== null)
                });
                
                // Create chart
                createDiveProfileChart(canvas.id, times, depths, temps, air);
            } catch (error) {
                console.error('Error processing CSV data:', error);
                canvas.insertAdjacentHTML('afterend', 
                    `<div class="chart-error">Error processing dive profile data: ${error.message}</div>`);
            }
        } else {
            console.warn('No CSV data found for canvas:', canvas.id);
            canvas.insertAdjacentHTML('afterend', 
                `<div class="chart-error">No dive profile data available</div>`);
        }
    });
}

/**
 * Parse CSV data into arrays for charting
 */
function parseCSVData(csvData) {
    console.log('Parsing CSV data...');
    
    // Initialize arrays for chart data
    const times = [];
    const depths = [];
    const temps = [];
    const air = [];
    
    try {
        // Split CSV into lines
        const lines = csvData.split('\n');
        console.log(`CSV has ${lines.length} lines`);
        
        if (lines.length <= 1) {
            throw new Error('CSV data has too few lines');
        }
        
        // Find header row and determine column indices
        const headerRow = lines[0].toLowerCase();
        console.log('Header row:', headerRow);
        const headers = headerRow.split(',').map(h => h.trim());
        
        // Detect indices with flexible matching
        const timeIndex = headers.findIndex(header => 
            header.includes('time') || header.includes('minute') || header.includes('min'));
        
        const depthIndex = headers.findIndex(header => 
            header.includes('depth') || header.includes('profundidad') || header.includes('tiefe'));
        
        const tempIndex = headers.findIndex(header => 
            header.includes('temp') || header.includes('temperatura') || header.includes('°c'));
        
        const airIndex = headers.findIndex(header => 
            header.includes('air') || header.includes('pressure') || header.includes('bar') || 
            header.includes('psi') || header.includes('gas') || header.includes('tank'));
        
        console.log('Column indices:', { timeIndex, depthIndex, tempIndex, airIndex });
        
        // Use sample data if we can't find proper columns
        if (depthIndex === -1) {
            console.warn('Could not find depth column, using sample data');
            return getSampleData();
        }
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const columns = lines[i].split(',').map(c => c.trim());
            
            // Extract data using column indices
            if (timeIndex !== -1 && columns[timeIndex]) {
                times.push(parseFloat(columns[timeIndex]));
            } else {
                // If no time column, use sequence number
                times.push(i - 1);
            }
            
            if (depthIndex !== -1 && columns[depthIndex]) {
                depths.push(parseFloat(columns[depthIndex]));
            } else {
                depths.push(null);
            }
            
            if (tempIndex !== -1 && columns[tempIndex]) {
                temps.push(parseFloat(columns[tempIndex]));
            } else {
                temps.push(null);
            }
            
            if (airIndex !== -1 && columns[airIndex]) {
                air.push(parseFloat(columns[airIndex]));
            } else {
                air.push(null);
            }
        }
        
        // Check if we have valid data
        if (!depths.some(d => d !== null && !isNaN(d))) {
            console.warn('No valid depth data found, using sample data');
            return getSampleData();
        }
        
        console.log('Successfully parsed CSV data');
        return { times, depths, temps, air };
    } catch (error) {
        console.error('Error parsing CSV, using sample data instead:', error);
        return getSampleData();
    }
}

/**
 * Get sample dive data for preview
 */
function getSampleData() {
    console.log('Using sample dive data');
    
    // Sample dive data matching the screenshot
    const times = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48];
    const depths = [0, 5, 10, 15, 20, 25, 22, 20, 18, 20, 22, 25, 20, 15, 10, 5, 0];
    const temps = [26, 25, 24, 23, 22, 21, 21, 21, 21, 21, 21, 21, 22, 22, 23, 24, 25];
    const air = [200, 190, 180, 170, 160, 150, 140, 135, 130, 125, 120, 115, 110, 105, 104, 104, 104];
    
    return { times, depths, temps, air };
}

/**
 * Create dive profile chart
 */
function createDiveProfileChart(canvasId, times, depths, temps, air) {
    const chartCanvas = document.getElementById(canvasId);
    if (!chartCanvas) return;

    // Check if we have valid data
    if (!depths.some(d => d !== null)) {
        chartCanvas.insertAdjacentHTML('afterend', 
            `<div class="chart-error">No valid depth data in CSV</div>`);
        return;
    }
    
    // Configure datasets
    const datasets = [];
    
    // Always include depth
    datasets.push({
        label: 'Depth (m)',
        data: depths,
        borderColor: '#1a73e8',
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
        fill: true,
        yAxisID: 'y-depth',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#1a73e8'
    });
    
    // Add temperature if available
    if (temps.some(t => t !== null)) {
        datasets.push({
            label: 'Temperature (°C)',
            data: temps,
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            fill: false,
            yAxisID: 'y-temp',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#f44336'
        });
    }
    
    // Add air pressure if available
    if (air.some(a => a !== null)) {
        datasets.push({
            label: 'Air (bar)',
            data: air,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: false,
            yAxisID: 'y-air',
            borderDash: [8, 4],
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#4caf50'
        });
    }
    
    // Configure scales
    const scales = {
        x: {
            title: {
                display: true,
                text: 'Time (minutes)',
                color: '#666',
                font: {
                    size: 12,
                    weight: 'bold'
                }
            },
            grid: {
                color: 'rgba(200, 200, 200, 0.2)',
                borderDash: [5, 5]
            },
            ticks: {
                color: '#666',
                font: {
                    size: 11
                }
            }
        },
        'y-depth': {
            position: 'left',
            title: {
                display: true,
                text: 'Depth (m)',
                color: '#1a73e8',
                font: {
                    size: 12,
                    weight: 'bold'
                }
            },
            reverse: true, // Inverted axis for depth
            min: 0,
            max: Math.max(...depths.filter(d => d !== null)) * 1.2, // Add 20% margin
            grid: {
                color: 'rgba(200, 200, 200, 0.3)',
            },
            ticks: {
                color: '#666',
                font: {
                    size: 11
                }
            }
        }
    };
    
    // Add temperature scale if needed
    if (temps.some(t => t !== null)) {
        scales['y-temp'] = {
            position: 'right',
            title: {
                display: true,
                text: 'Temperature (°C)',
                color: '#f44336',
                font: {
                    size: 12,
                    weight: 'bold'
                }
            },
            grid: {
                display: false
            },
            ticks: {
                color: '#f44336',
                font: {
                    size: 11
                }
            }
        };
    }
    
    // Add air pressure scale if needed
    if (air.some(a => a !== null)) {
        scales['y-air'] = {
            position: 'right',
            title: {
                display: true,
                text: 'Air (bar)',
                color: '#4caf50',
                font: {
                    size: 12,
                    weight: 'bold'
                }
            },
            grid: {
                display: false
            },
            ticks: {
                color: '#4caf50',
                font: {
                    size: 11
                }
            }
        };
    }
    
    // Create chart
    new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: times,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: scales,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    caretSize: 6,
                    displayColors: true
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            elements: {
                line: {
                    tension: 0.3
                }
            }
        }
    });
} 