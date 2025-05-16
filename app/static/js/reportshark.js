document.addEventListener('DOMContentLoaded', function() {
    // Load dive sites
    loadDiveSites();
    
    // Set up severity options
    setupSeverityOptions();
    
    // Form submission
    document.getElementById('shark-report-form').addEventListener('submit', submitReport);
    
    // Form field change detection for progress steps
    document.getElementById('dive-site').addEventListener('change', updateProgressSteps);
    document.getElementById('species').addEventListener('input', updateProgressSteps);
    document.getElementById('size-estimate').addEventListener('input', updateProgressSteps);
    document.getElementById('description').addEventListener('input', updateProgressSteps);
    
    // Custom dive site input listeners
    document.getElementById('custom-site-name').addEventListener('input', updateProgressSteps);
    document.getElementById('custom-site-region').addEventListener('input', updateProgressSteps);
});

function updateProgressSteps() {
    const steps = document.querySelectorAll('.step');
    
    // Step 1: Select Site
    const siteSelectValue = document.getElementById('dive-site').value;
    let hasSiteSelection = siteSelectValue !== '';
    
    // If "other" is selected, check if custom site name is filled in
    if (siteSelectValue === 'other') {
        const customSiteName = document.getElementById('custom-site-name').value.trim();
        hasSiteSelection = customSiteName !== '';
    }
    
    if (hasSiteSelection) {
        steps[0].classList.add('completed');
        steps[1].classList.add('active');
    } else {
        steps[0].classList.remove('completed');
        steps[1].classList.remove('active');
    }
    
    // Step 2: Shark Details
    const hasSpecies = document.getElementById('species').value.trim() !== '';
    const hasSize = document.getElementById('size-estimate').value.trim() !== '';
    const hasDescription = document.getElementById('description').value.trim() !== '';
    
    if (hasSpecies && hasSize && hasDescription) {
        steps[1].classList.add('completed');
        steps[2].classList.add('active');
    } else {
        steps[1].classList.remove('completed');
        steps[2].classList.remove('active');
    }
}

async function loadDiveSites() {
    try {
        const response = await fetch('/api/sites/', {
            method: 'GET',
            headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Server returned status code: ${response.status}`);
        }
        
        const sites = await response.json();
        console.log("Successfully loaded site data:", sites.length, "sites");
        
        populateDiveSites(sites);
    } catch (error) {
        console.error('Failed to load site data:', error);
        showAlert('Using backup data for dive sites. You can also manually add a new dive site.', 'info');
        
        // Use backup data
        const fallbackSites = [
            { id: 'fb-1', name: 'Great Barrier Reef', region: 'Queensland', country: 'Australia' },
            { id: 'fb-2', name: 'Similan Islands', region: 'Phang Nga', country: 'Thailand' },
            { id: 'fb-3', name: 'Komodo National Park', region: 'East Nusa Tenggara', country: 'Indonesia' },
            { id: 'fb-4', name: 'Blue Hole', region: 'Koror', country: 'Palau' },
            { id: 'fb-5', name: 'North Male Atoll', region: 'Male', country: 'Maldives' },
            { id: 'fb-6', name: 'Saipan Tinian', region: 'Northern Mariana Islands', country: 'USA' },
            { id: 'fb-7', name: 'Paracel Islands', region: 'Hainan', country: 'China' },
            { id: 'fb-8', name: 'Weizhou Island', region: 'Guangxi', country: 'China' },
            { id: 'fb-9', name: 'Mabul Island', region: 'Sabah', country: 'Malaysia' },
            { id: 'fb-10', name: 'Dumaguete', region: 'Negros Oriental', country: 'Philippines' }
        ];
        
        populateDiveSites(fallbackSites);
        
        // Enable custom dive site input
        document.getElementById('custom-site-container').style.display = 'block';
    }
}

function populateDiveSites(sites) {
    const siteSelect = document.getElementById('dive-site');
    siteSelect.innerHTML = '<option value="">-- Select Dive Site --</option>';
    
    sites.forEach(site => {
        const option = document.createElement('option');
        option.value = site.id;
        option.textContent = site.name + (site.region && site.country ? ` (${site.region}, ${site.country})` : '');
        siteSelect.appendChild(option);
    });
    
    // Add "other" option
    const otherOption = document.createElement('option');
    otherOption.value = "other";
    otherOption.textContent = "-- Other/Custom Dive Site --";
    siteSelect.appendChild(otherOption);
    
    // Listen for selection changes to show/hide custom input
    siteSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            document.getElementById('custom-site-container').style.display = 'block';
        } else {
            document.getElementById('custom-site-container').style.display = 'none';
        }
        updateProgressSteps();
    });
}

function setupSeverityOptions() {
    const options = document.querySelectorAll('.severity-option');
    const hiddenInput = document.getElementById('severity');
    
    options.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input value
            hiddenInput.value = this.getAttribute('data-value');
        });
    });
}

async function submitReport(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('submit-button');
    
    // Get form data
    let siteId = document.getElementById('dive-site').value;
    const species = document.getElementById('species').value.trim();
    const sizeEstimate = document.getElementById('size-estimate').value.trim();
    const description = document.getElementById('description').value.trim();
    const severity = document.getElementById('severity').value;
    const sightingTime = document.getElementById('sighting-time').value;
    
    // Set user ID, default to 0 if not present
    const userId = document.getElementById('user-id').value || '0';
    
    // Check required fields
    if (!species) {
        showAlert('Please enter shark species', 'danger');
        return;
    }
    
    if (!sizeEstimate) {
        showAlert('Please enter estimated size', 'danger');
        return;
    }
    
    if (!description) {
        showAlert('Please enter a description', 'danger');
        return;
    }
    
    // Process site ID
    // According to backend API, custom site ID must be an integer
    // We'll use a default site ID (1) for custom sites and include custom site info in description
    let customSiteInfo = null;
    if (siteId === 'other') {
        const customSiteName = document.getElementById('custom-site-name').value.trim();
        const customSiteRegion = document.getElementById('custom-site-region').value.trim();
        
        if (!customSiteName) {
            showAlert('Please enter custom dive site name', 'danger');
            return;
        }
        
        // Add custom site info to description
        customSiteInfo = `[Custom site: ${customSiteName}${customSiteRegion ? ', ' + customSiteRegion : ''}] `;
        // Use default site ID 1
        siteId = 1;
    } else if (!siteId) {
        showAlert('Please select a dive site', 'danger');
        return;
    } else {
        // Ensure site ID is an integer
        siteId = parseInt(siteId);
        if (isNaN(siteId)) {
            showAlert('Invalid site ID', 'danger');
            return;
        }
    }
    
    // Set button to submitting state
    submitButton.classList.add('submitting');
    submitButton.disabled = true;
    
    // Show submitting message
    showAlert('Submitting report, please wait...', 'info');
    
    // Get CSRF token for including in JSON data
    const csrfToken = document.getElementById('csrf-token').value || 
                      document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    // Prepare JSON data
    const jsonData = {
        user_id: parseInt(userId) || 0,  // Ensure user_id is always an integer, use 0 if parsing fails
        species: species,
        size_estimate: sizeEstimate,
        description: customSiteInfo ? customSiteInfo + description : description,
        severity: severity,
        status: 'active',
        csrf_token: csrfToken // Include CSRF token in JSON data as well
    };
    
    // Add optional fields
    if (sightingTime) {
        jsonData.sighting_time = sightingTime;
    }
    
    try {
        // Try different submission paths
        let response;
        
        try {
            // Get CSRF token - try multiple methods to ensure we have a valid token
            const metaToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const formToken = document.getElementById('csrf-token').value;
            const csrfToken = formToken || metaToken;
            
            console.log("Using CSRF token:", csrfToken ? "Found token" : "No token found");
            
            response = await fetch(`/api/shark-warnings/site/${siteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(jsonData),
                credentials: 'same-origin'
            });
        } catch (error) {
            console.log("First attempt failed, trying alternative path", error);
            
            // Get CSRF token again in case there was an issue
            const metaToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const formToken = document.getElementById('csrf-token').value;
            const csrfToken = formToken || metaToken;
            
            response = await fetch(`/shark/site/${siteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', 
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(jsonData),
                credentials: 'same-origin'
            });
        }
        
        // Restore button state
        submitButton.classList.remove('submitting');
        submitButton.disabled = false;
        
        // Check response status
        if (response.ok) {
            console.log("Submission successful, status code:", response.status);
            const result = await response.json();
            console.log("Server response:", result);
            
            // Success - show success message and reset form
            showAlert('Shark sighting report submitted successfully! Thank you for helping keep divers safe.', 'success');
            document.getElementById('shark-report-form').reset();
            document.getElementById('custom-site-container').style.display = 'none';
            
            // Set all steps to completed
            const steps = document.querySelectorAll('.step');
            steps.forEach(step => {
                step.classList.add('completed');
                step.classList.remove('active');
            });
            
            // Redirect to shark warning page after 2 seconds
            setTimeout(() => {
                window.location.href = '/auth/sharkwarning';
            }, 2000);
        } else {
            const errorData = await response.text();
            console.error("Submission failed, status code:", response.status, "error:", errorData);
            
            try {
                // Try to parse as JSON
                const jsonError = JSON.parse(errorData);
                showAlert(`Submission failed: ${jsonError.error || 'Server error'}`, 'danger');
            } catch (e) {
                // If not JSON, show generic error
                showAlert(`Submission failed: Server returned error (${response.status})`, 'danger');
            }
        }
    } catch (error) {
        // Restore button state
        submitButton.classList.remove('submitting');
        submitButton.disabled = false;
        
        console.error("Error submitting report:", error);
        showAlert('Error submitting report: ' + error.message, 'danger');
    }
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    // Scroll to top to show alert
    window.scrollTo(0, 0);
    
    // If success message, automatically remove after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            const alertElement = alertContainer.firstChild;
            if (alertElement) {
                alertElement.style.opacity = '0';
                alertElement.style.transition = 'opacity 0.5s';
                setTimeout(() => alertContainer.innerHTML = '', 500);
            }
        }, 5000);
    }
} 