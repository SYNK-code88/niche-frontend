// --- CONFIGURATION ---
// TODO: PASTE YOUR LIVE RENDER API URL (e.g., "https://niche-api1.onrender.com")
const API_URL = "https://niche-api1.onrender.com"; 
// ---------------------

// Get references to all the important HTML elements
const monitorForm = document.getElementById('monitor-form');
const submitButton = document.getElementById('submit-button');
const monitorsList = document.getElementById('monitors-list');
const loadingMessage = document.getElementById('loading-message');

/**
 * Fetches all monitors from the API and displays them.
 * This runs when the page first loads.
 */
async function loadMonitors() {
    try {
        const response = await fetch(`${API_URL}/monitors`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        // Clear loading message
        loadingMessage.style.display = 'none';
        
        // Clear list before adding new items
        monitorsList.innerHTML = ''; 
        
        if (result.data && result.data.length > 0) {
            result.data.forEach(monitor => {
                renderMonitor(monitor);
            });
        } else {
            monitorsList.innerHTML = '<p>No monitors added yet. Add one using the form!</p>';
        }
    } catch (error) {
        console.error('Failed to load monitors:', error);
        loadingMessage.style.display = 'none';
        monitorsList.innerHTML = '<p style="color: red;">Error: Could not load monitors.</p>';
    }
}

/**
 * Creates and adds a single monitor card to the list in the HTML.
 */
function renderMonitor(monitor) {
    const card = document.createElement('div');
    card.className = 'monitor-card';
    card.id = `monitor-${monitor.id}`; // Give it a unique ID
    
    card.innerHTML = `
        <button class="delete-btn" data-id="${monitor.id}" title="Delete this monitor">×</button>
        <p class="monitor-url">${monitor.url}</p>
        <p class="monitor-selector">${monitor.css_selector}</p>
        <p class="monitor-email">${monitor.user_email}</p>
    `;
    
    // Add an event listener to the new delete button
    card.querySelector('.delete-btn').addEventListener('click', () => {
        handleDelete(monitor.id);
    });
    
    monitorsList.appendChild(card);
}

/**
 * Handles the form submission to add a new monitor.
 */
async function handleFormSubmit(event) {
    // Prevent the form from doing a normal page reload
    event.preventDefault(); 
    
    // Disable the button to prevent double-clicks
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';

    // Get the data from the form fields
    const formData = new FormData(monitorForm);
    const monitorData = {
        url: formData.get('url'),
        css_selector: formData.get('css_selector'),
        user_email: formData.get('user_email')
    };

    try {
        const response = await fetch(`${API_URL}/monitors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(monitorData), // Convert data to JSON string
        });

        if (!response.ok) {
            // Try to get more error details from the API's response
            const errData = await response.json();
            throw new Error(errData.detail || `HTTP error! status: ${response.status}`);
        }

        const newMonitor = await response.json();
        
        // If this is the first monitor, remove the "No monitors" message
        if (monitorsList.querySelector('p')) {
            monitorsList.innerHTML = '';
        }

        // Manually add the new monitor to the list so we don't have to reload
        renderMonitor({
            id: newMonitor.id,
            url: monitorData.url,
            css_selector: monitorData.css_selector,
            user_email: monitorData.user_email
        });
        
        // Clear the form fields
        monitorForm.reset();

    } catch (error) {
        console.error('Failed to add monitor:', error);
        alert(`Error: Could not add monitor. ${error.message}`);
    } finally {
        // Re-enable the button
        submitButton.disabled = false;
        submitButton.textContent = 'Start Monitoring';
    }
}

/**
 * Handles the delete button click for a monitor.
 */
async function handleDelete(monitorId) {
    if (!confirm('Are you sure you want to delete this monitor?')) {
        return; // User clicked "Cancel"
    }

    try {
        const response = await fetch(`${API_URL}/monitors/${monitorId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove the monitor's card from the HTML
        const cardToRemove = document.getElementById(`monitor-${monitorId}`);
        if (cardToRemove) {
            cardToRemove.remove();
        }

        // Check if the list is now empty
        if (monitorsList.children.length === 0) {
             monitorsList.innerHTML = '<p>No monitors added yet. Add one using the form!</p>';
        }
        
    } catch (error) {
        console.error('Failed to delete monitor:', error);
        alert('Error: Could not delete monitor.');
    }
}


// --- Main Execution ---
// When the page loads, add our event listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load all existing monitors from the API
    loadMonitors();
    
    // 2. Listen for the form to be submitted
    monitorForm.addEventListener('submit', handleFormSubmit);
});