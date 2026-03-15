const API_URL = '/api';

// UI Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authSection = document.getElementById('authSection');
const authTitle = document.getElementById('authTitle');
const dashboardSection = document.getElementById('dashboardSection');
const navAdminName = document.getElementById('navAdminName');
const logoutBtn = document.getElementById('logoutBtn');

// Navigation
const navDashboard = document.getElementById('navDashboard');
const navComplaints = document.getElementById('navComplaints');
const navMap = document.getElementById('navMap');
const statsView = document.getElementById('statsView');
const complaintsView = document.getElementById('complaintsView');
const mapView = document.getElementById('mapView');
const pageTitle = document.getElementById('pageTitle');
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('click', () => {
    const isLightNow = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLightNow ? 'light' : 'dark');
    
    // Invalidate map to fix sizes, and ideally we would swap the tile layer here
    // We will do a robust tile swap in the Map Logic section next.
    if (map) {
        updateMapTheme(isLightNow);
    }
});

// Stats Elements
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statProgress = document.getElementById('statProgress');
const statCompleted = document.getElementById('statCompleted');
const statEscalated = document.getElementById('statEscalated');

// Table & Modal Elements
const allComplaintsTable = document.getElementById('allComplaintsTable');
const editModal = document.getElementById('editModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelModalBtn = document.getElementById('cancelModal');
const editForm = document.getElementById('editForm');
const editComplaintId = document.getElementById('editComplaintId');
const editDepartment = document.getElementById('editDepartment');
const editStatus = document.getElementById('editStatus');
const editImage = document.getElementById('editImage');

let currentAdmin = JSON.parse(localStorage.getItem('admin_user')) || null;
let allComplaints = [];

// Initialization
function init() {
    if (currentAdmin) {
        showDashboard();
    } else {
        showAuth();
    }
}

// UI Toggles
function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    navAdminName.textContent = `Admin Panel`;
    navAdminName.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    loadStats();
    loadAllComplaints();
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    navAdminName.classList.add('hidden');
    logoutBtn.classList.add('hidden');
}

logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('admin_user');
    currentAdmin = null;
    showAuth();
});

// Auth Toggles
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.textContent = 'Register Admin';
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Admin Login';
});

// Authentication
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const secretCode = document.getElementById('regSecretCode').value;

    try {
        const res = await fetch(`${API_URL}/auth/admin/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, secretCode })
        });
        const data = await res.json();

        if (res.ok) {
            alert('Admin registered successfully! You can now login.');
            document.getElementById('showLogin').click();
            registerForm.reset();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred during registration');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok && data.user && data.user.role === 'admin') {
            currentAdmin = data.user;
            localStorage.setItem('admin_user', JSON.stringify(currentAdmin));
            showDashboard();
        } else {
            alert(data.error || 'Login failed or invalid credentials');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
});

// Sidebar Navigation
navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    navDashboard.classList.add('active');
    navComplaints.classList.remove('active');
    navMap.classList.remove('active');
    statsView.classList.remove('hidden');
    complaintsView.classList.add('hidden');
    mapView.classList.add('hidden');
    pageTitle.textContent = 'Dashboard Overview';
    loadStats();
});

navComplaints.addEventListener('click', (e) => {
    e.preventDefault();
    navComplaints.classList.add('active');
    navDashboard.classList.remove('active');
    navMap.classList.remove('active');
    complaintsView.classList.remove('hidden');
    statsView.classList.add('hidden');
    mapView.classList.add('hidden');
    pageTitle.textContent = 'Manage Complaints';
    loadAllComplaints();
});

navMap.addEventListener('click', (e) => {
    e.preventDefault();
    navMap.classList.add('active');
    navDashboard.classList.remove('active');
    navComplaints.classList.remove('active');
    mapView.classList.remove('hidden');
    statsView.classList.add('hidden');
    complaintsView.classList.add('hidden');
    pageTitle.textContent = 'Live Map View';
    
    // Ensure map resizes correctly when container becomes visible
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);
});

// Data Loading
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/complaints/stats`);
        const stats = await res.json();
        
        statTotal.textContent = stats.total || 0;
        statPending.textContent = stats.pending || 0;
        statProgress.textContent = stats.inProgress || 0;
        statCompleted.textContent = stats.completed || 0;
        statEscalated.textContent = stats.escalated || 0;
    } catch (err) {
        console.error('Failed to load stats', err);
    }
}

function getStatusBadgeClass(status) {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'In Progress') return 'badge-progress';
    if (status === 'Completed') return 'badge-completed';
    if (status === 'Cancelled') return 'badge-cancelled';
    return '';
}

async function loadAllComplaints() {
    try {
        const res = await fetch(`${API_URL}/complaints/all`);
        allComplaints = await res.json();
        
        allComplaintsTable.innerHTML = '';
        
        if (allComplaints.length === 0) {
            allComplaintsTable.innerHTML = '<tr><td colspan="6" style="text-align:center;">No complaints found.</td></tr>';
            return;
        }

        // Sort by newest
        allComplaints.sort((a,b) => new Date(b.createdAt._seconds * 1000 || b.createdAt) - new Date(a.createdAt._seconds * 1000 || a.createdAt));

        allComplaints.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${c.complaintId}</td>
                <td>${c.department || 'Unassigned'}</td>
                <td>${c.issueType}</td>
                <td>${c.location}</td>
                <td><span class="badge ${getStatusBadgeClass(c.status)}">${c.status}</span></td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('${c.complaintId}')">Update</button>
                </td>
            `;
            allComplaintsTable.appendChild(tr);
        });
        
        updateMapMarkers();
    } catch (err) {
        console.error('Failed to load complaints', err);
    }
}

// Map Logic
let map = null;
let markers = [];
let currentTileLayer = null;

function initMap() {
    if (map) return; // Prevent double init
    // Coordinates for India roughly
    map = L.map('complaintsMap').setView([20.5937, 78.9629], 5);

    const isLight = document.body.classList.contains('light-mode');
    setMapTiles(isLight);
}

function setMapTiles(isLight) {
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }
    
    // Using realistic Esri World Imagery if dark mode, or standard OSM if light mode as requested for realistic aesthetics
    const tileUrl = isLight 
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' 
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        
    const attribution = isLight
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    currentTileLayer = L.tileLayer(tileUrl, {
        attribution: attribution,
        maxZoom: 18
    }).addTo(map);
}

function updateMapTheme(isLight) {
    if(!map) return;
    setMapTiles(isLight);
}

function updateMapMarkers() {
    if (!map) initMap();
    
    // Clear old markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    allComplaints.forEach(c => {
        if (c.lat && c.lng) {
            let color = '#3B82F6'; // Info blue default
            if (c.status === 'Pending') color = '#F59E0B';
            if (c.status === 'Completed') color = '#10B981';
            if (c.status === 'Cancelled') color = '#EF4444'; // Red
            
            const marker = L.circleMarker([c.lat, c.lng], {
                radius: 8,
                fillColor: color,
                color: "#ffffff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);
            
            marker.bindPopup(`
                <strong>${c.issueType}</strong><br>
                ${c.location}<br>
                Status: ${c.status}
            `);
            markers.push(marker);
        }
    });
}

// Modal Logic
function openEditModal(complaintId) {
    const complaint = allComplaints.find(c => c.complaintId === complaintId);
    if (!complaint) return;
    
    editComplaintId.value = complaint.complaintId;
    editDepartment.value = complaint.department || 'Unassigned';
    editStatus.value = complaint.status || 'Pending';
    
    if (complaint.imageUrl) {
        editImage.src = complaint.imageUrl;
        editImage.style.display = 'block';
    } else {
        editImage.style.display = 'none';
        editImage.src = '';
    }
    
    editModal.classList.remove('hidden');
}

function closeModal() {
    editModal.classList.add('hidden');
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editComplaintId.value;
    const department = editDepartment.value;
    const status = editStatus.value;
    
    try {
        const res = await fetch(`${API_URL}/complaints/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department, status })
        });
        
        if (res.ok) {
            alert('Complaint updated successfully!');
            closeModal();
            loadAllComplaints();
            loadStats();
        } else {
            const data = await res.json();
            alert(data.error || 'Update failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while updating');
    }
});

// Expose openEditModal to global scope since it's used in inline onclick
window.openEditModal = openEditModal;

init();
