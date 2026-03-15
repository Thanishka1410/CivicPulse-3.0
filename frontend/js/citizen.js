const API_URL = '/api';

// UI Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const authTitle = document.getElementById('authTitle');
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const navUsername = document.getElementById('navUsername');
const logoutBtn = document.getElementById('logoutBtn');
const complaintForm = document.getElementById('complaintForm');
const complaintsListContainer = document.getElementById('complaintsListContainer');
const detectLocationBtn = document.getElementById('detectLocationBtn');
const locationInput = document.getElementById('location');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const startCameraBtn = document.getElementById('startCameraBtn');
const cameraContainer = document.getElementById('cameraContainer');
const cameraFeed = document.getElementById('cameraFeed');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const photoCanvas = document.getElementById('photoCanvas');
const themeToggle = document.getElementById('themeToggle');

let currentUser = JSON.parse(localStorage.getItem('citizen_user')) || null;
let currentStream = null;
let capturedBlob = null;

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});

// Initialization
function init() {
    if (currentUser) {
        showDashboard();
    } else {
        showAuth();
    }
}

// UI Toggles
function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    navUsername.textContent = `Welcome, ${currentUser.username}`;
    navUsername.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    loadComplaints();
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    navUsername.classList.add('hidden');
    logoutBtn.classList.add('hidden');
}

showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.textContent = 'Register for Citizen Portal';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Login to Citizen Portal';
});

logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('citizen_user');
    currentUser = null;
    showAuth();
});

// Authentication handlers
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const phoneNumber = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, phoneNumber, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            alert('Registration successful! Please login.');
            showLogin.click();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
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
        
        if (res.ok && data.user.role === 'citizen') {
            currentUser = data.user;
            localStorage.setItem('citizen_user', JSON.stringify(currentUser));
            showDashboard();
        } else {
            alert(data.error || 'Login failed or invalid role');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
});

// Geolocation Handler
detectLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    detectLocationBtn.textContent = 'Detecting...';
    detectLocationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        latitudeInput.value = lat;
        longitudeInput.value = lon;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data && data.display_name) {
                locationInput.value = data.display_name;
            } else {
                locationInput.value = `${lat}, ${lon}`;
            }
        } catch (err) {
            console.error('Reverse geocoding failed', err);
            locationInput.value = `${lat}, ${lon}`;
            alert('Failed to get address name. Coordinates mapped instead.');
        } finally {
            detectLocationBtn.textContent = 'Detect 📍';
            detectLocationBtn.disabled = false;
        }
    }, (error) => {
        console.error(error);
        alert('Unable to retrieve your location. Please grant permission.');
        detectLocationBtn.textContent = 'Detect 📍';
        detectLocationBtn.disabled = false;
    });
});

// Image Preview & Camera Handlers
imageUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        capturedBlob = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            stopCamera();
        }
        reader.readAsDataURL(file);
    }
});

startCameraBtn.addEventListener('click', async () => {
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        cameraFeed.srcObject = currentStream;
        cameraContainer.classList.remove('hidden');
        imagePreview.style.display = 'none'; // hide old preview
    } catch (err) {
        alert('Camera access denied or unavailable on this device.');
        console.error(err);
    }
});

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    cameraContainer.classList.add('hidden');
}

closeCameraBtn.addEventListener('click', stopCamera);

takePhotoBtn.addEventListener('click', () => {
    if (!currentStream) return;
    
    photoCanvas.width = cameraFeed.videoWidth;
    photoCanvas.height = cameraFeed.videoHeight;
    const ctx = photoCanvas.getContext('2d');
    ctx.drawImage(cameraFeed, 0, 0, photoCanvas.width, photoCanvas.height);
    
    photoCanvas.toBlob((blob) => {
        capturedBlob = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
        imagePreview.src = URL.createObjectURL(blob);
        imagePreview.style.display = 'block';
        stopCamera();
    }, 'image/jpeg', 0.9);
});

// Complaints Handlers
complaintForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('citizenId', currentUser.uid);
    formData.append('issueType', document.getElementById('issueType').value);
    formData.append('location', locationInput.value);
    formData.append('lat', latitudeInput.value);
    formData.append('lng', longitudeInput.value);
    formData.append('description', document.getElementById('description').value);
    
    if (!capturedBlob) {
        alert("Please provide an evidence image by uploading or using the camera.");
        return;
    }
    formData.append('image', capturedBlob);

    try {
        const res = await fetch(`${API_URL}/complaints`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (res.ok) {
            alert(`Complaint submitted successfully!\nComplaint ID: ${data.complaintId}`);
            complaintForm.reset();
            capturedBlob = null;
            imagePreview.style.display = 'none';
            imagePreview.src = '';
            detectLocationBtn.textContent = 'Detect 📍';
            loadComplaints();
        } else {
            alert(data.error || 'Submission failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while submitting');
    }
});

function getStatusBadgeClass(status) {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'In Progress') return 'badge-progress';
    if (status === 'Completed') return 'badge-completed';
    return '';
}

async function loadComplaints() {
    try {
        const res = await fetch(`${API_URL}/complaints/citizen/${currentUser.uid}`);
        const complaints = await res.json();
        
        complaintsListContainer.innerHTML = '';
        
        if (complaints.length === 0) {
            complaintsListContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 2rem 0;">No complaints found.</p>';
            return;
        }

        // Sort by newest
        complaints.sort((a,b) => new Date(b.createdAt._seconds * 1000 || b.createdAt) - new Date(a.createdAt._seconds * 1000 || a.createdAt));

        complaints.forEach(c => {
            const dateStr = new Date(c.createdAt._seconds * 1000 || c.createdAt).toLocaleDateString();
            
            // Logic for stepper active states
            const isAssigned = c.department !== 'Unassigned';
            const isInProgress = c.status === 'In Progress' || c.status === 'Completed';
            const isCompleted = c.status === 'Completed';
            const isCancelled = c.status === 'Cancelled';
            
            // Calculate progress bar width
            let progressWidth = '0%';
            let progressClass = 'stepper-progress';
            
            if (isCancelled) {
                progressWidth = '100%';
                progressClass += ' progress-cancelled';
            } else if (isCompleted) {
                progressWidth = '100%';
            } else if (isInProgress) {
                progressWidth = '66%';
            } else if (isAssigned) {
                progressWidth = '33%';
            }

            const card = document.createElement('div');
            card.className = 'tracker-card fade-in';
            card.innerHTML = `
                <div class="tracker-header">
                    <div>
                        <h4 style="margin-bottom: 0.25rem;">${c.issueType} Issues</h4>
                        <p style="font-size: 0.875rem; color: var(--text-muted);">${c.location}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.875rem; color: var(--text-muted);">ID: ${c.complaintId}</span>
                        <p style="font-size: 0.75rem; margin-top: 0.25rem;">Submitted: ${dateStr}</p>
                    </div>
                </div>
                
                <div class="stepper">
                    <div class="${progressClass}" style="width: ${progressWidth};"></div>
                    
                    <div class="step active">
                        <div class="step-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span class="step-label">Submitted</span>
                    </div>
                    
                    ${isCancelled ? `
                    <div class="step cancelled" style="width: 75%;">
                        <div class="step-icon" style="margin-left: auto; margin-right: 0;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        </div>
                        <span class="step-label" style="text-align: right; width: 100%;">Cancelled</span>
                    </div>
                    ` : `
                    <div class="step ${isAssigned ? 'active' : ''}">
                        <div class="step-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                        </div>
                        <span class="step-label">Assigned<br><small style="font-weight:normal;">${c.department === 'Unassigned' ? 'Pending' : c.department}</small></span>
                    </div>
                    
                    <div class="step ${isInProgress ? 'active' : ''}">
                        <div class="step-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <span class="step-label">In Progress</span>
                    </div>
                    
                    <div class="step ${isCompleted ? 'active' : ''}">
                        <div class="step-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <span class="step-label">Resolved</span>
                    </div>
                    `}
                </div>
            `;
            complaintsListContainer.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to load complaints', err);
    }
}

// Run basic layout initialization
init();
