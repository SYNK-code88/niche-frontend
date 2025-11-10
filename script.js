// --- CONFIGURATION ---
const API_URL = "https://niche-api1.onrender.com"; 
// ---------------------

const monitorForm = document.getElementById('monitor-form');
const submitButton = document.getElementById('submit-button');
const monitorsList = document.getElementById('monitors-list');
const loadingMessage = document.getElementById('loading-message');

// --- Generate or retrieve a persistent user key ---
function getOrCreateUserKey() {
    let key = localStorage.getItem('user_key');
    if (!key) {
        key = crypto.randomUUID();
        localStorage.setItem('user_key', key);
        console.log("Generated new user_key:", key);
    } else {
        console.log("Loaded existing user_key:", key);
    }
    return key;
}
const USER_KEY = getOrCreateUserKey();

// --- Load monitors only for this user's key ---
async function loadMonitors() {
    try {
        const response = await fetch(`${API_URL}/monitors?user_key=${USER_KEY}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        loadingMessage.style.display = 'none';
        monitorsList.innerHTML = '';

        if (result.data && result.data.length > 0) {
            result.data.forEach(monitor => renderMonitor(monitor));
        } else {
            monitorsList.innerHTML = '<p>No monitors added yet. Add one using the form!</p>';
        }
    } catch (error) {
        console.error('Failed to load monitors:', error);
        loadingMessage.style.display = 'none';
        monitorsList.innerHTML = '<p style="color: red;">Error: Could not load monitors.</p>';
    }
}

// --- Render monitor card ---
function renderMonitor(monitor) {
    const card = document.createElement('div');
    card.className = 'monitor-card';
    card.id = `monitor-${monitor.id}`;
    card.innerHTML = `
        <button class="delete-btn" data-id="${monitor.id}" title="Delete this monitor">×</button>
        <p class="monitor-url">${monitor.url}</p>
        <p class="monitor-selector">${monitor.css_selector}</p>
        <p class="monitor-email">${monitor.user_email}</p>
    `;
    card.querySelector('.delete-btn').addEventListener('click', () => handleDelete(monitor.id));
    monitorsList.appendChild(card);
}

// --- Handle add form ---
async function handleFormSubmit(event) {
    event.preventDefault(); 
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';

    const formData = new FormData(monitorForm);
    const monitorData = {
        url: formData.get('url'),
        css_selector: formData.get('css_selector'),
        user_email: formData.get('user_email'),
        user_key: USER_KEY
    };

    try {
        const response = await fetch(`${API_URL}/monitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(monitorData),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `HTTP ${response.status}`);
        }
        const newMonitor = await response.json();
        if (monitorsList.querySelector('p')) monitorsList.innerHTML = '';
        renderMonitor({
            id: newMonitor.id,
            url: monitorData.url,
            css_selector: monitorData.css_selector,
            user_email: monitorData.user_email
        });
        monitorForm.reset();
    } catch (error) {
        console.error('Failed to add monitor:', error);
        alert(`Error: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Start Monitoring';
    }
}

// --- Handle delete ---
async function handleDelete(monitorId) {
    if (!confirm('Are you sure you want to delete this monitor?')) return;
    try {
        const response = await fetch(`${API_URL}/monitors/${monitorId}?user_key=${USER_KEY}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        document.getElementById(`monitor-${monitorId}`)?.remove();
        if (monitorsList.children.length === 0)
            monitorsList.innerHTML = '<p>No monitors added yet. Add one using the form!</p>';
    } catch (error) {
        console.error('Failed to delete monitor:', error);
        alert('Error: Could not delete monitor.');
    }
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    loadMonitors();
    monitorForm.addEventListener('submit', handleFormSubmit);
});
