# CivicPulse - Civic Complaint Management System

## ⚠️ Problem Statement
In many fast-growing cities and municipalities, citizens face a significant communication gap when trying to report local issues such as broken roads, water leaks, uncollected garbage, or electrical faults. Traditional methods of complaining are often tedious, lack transparency, and leave the citizen with no tracking mechanism. Conversely, local authorities struggle to efficiently collect, visualize, and assign these geographically distributed complaints.

## 💡 Idea
**CivicPulse** is a centralized, digital bridge between citizens and their local government. It empowers everyday citizens to quickly report neighborhood issues from their devices—attaching live photographic evidence and precise GPS coordinates—while simultaneously providing the government with a comprehensive dashboard to verify, track, and resolve these issues on a live map.

## 📖 Overview
CivicPulse is a full-stack, responsive web application divided into two primary wings:
1. **The Citizen Portal:** A user-friendly interface where residents can securely log in, automatically detect their location, snap a photo using their device's camera, and submit a complaint. They can then track the status of their complaint through an intuitive, Amazon-style progress stepper.
2. **The Admin Dashboard:** A secure control center for municipal workers. Admins can view high-level statistics, browse all submitted complaints in a live data table, assign them to specific departments (e.g., Sanitation, Public Works), update their resolution status, and visually map out problem areas using an interactive Topographic/Satellite map.

## ✨ Key Features
- **User Authentication:** Dedicated, secure login/registration flows with strict password and phone number validation for Citizens, and a secret-key verification system for Admins.
- **Smart Location Detection:** Integrated Geolocation API and Reverse Geocoding to automatically pinpoint the user’s exact coordinates and translate them into a readable street address.
- **Live Camera Capture:** A custom WebRTC integration (`navigator.mediaDevices.getUserMedia()`) allowing citizens to directly open their device's camera inside the web browser to snap and attach evidence photos without downloading extra apps.
- **Live Admin Mapping:** An interactive Leaflet map that plots every single complaint in real-time, color-coded by its current resolution status, on realistic satellite imagery.
- **Dynamic Progress Tracking:** A visual "stepper" UI (Submitted -> Assigned -> In Progress -> Resolved) for citizens to easily understand the status of their complaints.
- **Dark/Light Mode:** A persistent, premium theme engine that smoothly toggles the entire website's user interface between a sleek dark mode and a clean light mode.
- **Anti-Spam Validation:** Backend logic that intelligently prevents duplicate submissions for the same issue category at the exact same geographic location.

## 🛠️ Technologies Used

### Frontend (Client-Side)
- **HTML5 & CSS3:** Semantic markup and a completely custom, flexible CSS variable-based styling system (Vanilla CSS, no external UI frameworks used).
- **Vanilla JavaScript:** DOM manipulation, form validation, and asynchronous API communication.
- **WebRTC Camera API:** Native HTML5/JS APIs to handle continuous live video streams and canvas capture directly in the browser.
- **Geolocation API:** To request high-accuracy GPS coordinates from the user's browser.
- **Leaflet.js Mapping:** An open-source JavaScript library for interactive, mobile-friendly maps, powered by OpenStreetMap and Esri Topographic Tiles.

### Backend (Server-Side)
- **Node.js & Express.js:** A robust REST API serving endpoints for authentication, data ingestion, and file routing.
- **Firebase Firestore:** A scalable, real-time NoSQL cloud database used to store users, geographical coordinates, and complaint data.
- **Multer:** Middleware for handling `multipart/form-data`, primarily used for processing user image uploads.
- **Reverse Geocoding (Nominatim API):** An external service called to convert raw latitude/longitude figures into human-readable locations.

## 📁 Structure of the Project
```text
CivicsPulse/
│
├── frontend/                 # Client-side files
│   ├── css/
│   │   └── style.css         # Global stylesheets & Theme Variables
│   ├── js/
│   │   ├── citizen.js        # Logic for Citizen portal, camera, map targeting
│   │   └── admin.js          # Logic for Admin portal, Leaflet mapping
│   ├── index.html            # Landing / Marketing Page
│   ├── citizen.html          # Citizen Dashboard
│   └── admin.html            # Municipal Control Dashboard
│
├── backend/                  # Server-side APIs
│   ├── config/
│   │   ├── firebase-config.js      # Firebase Admin SDK initialization
│   │   └── serviceAccountKey.json  # Cloud credentials (ignored in git)
│   ├── routes/
│   │   ├── auth.js           # Login, Registration & Security
│   │   └── complaints.js     # Data ingestion, Anti-Spam checks, Image uploads
│   ├── .env                  # Environment Variables
│   ├── package.json          # Node dependencies
│   └── server.js             # Express core, routing, and static file serving
│
├── uploads/                  # Local directory for user image saves
└── README.md                 # Project Documentation
```

## 🚀 Future Ideas
- **Push Notifications:** Implementing Service Workers to send phone alerts or emails to citizens the moment their complaint status moves to "Resolved".
- **AI Triage Validation:** Utilizing an AI Vision model to scan uploaded images and verify if the image actually contains a pothole, garbage, etc., before accepting the complaint.
- **Data Analytics Export:** Allowing admins to export monthly CSV reports or view deeper bar-chart analytics indicating which municipal zone has the highest density of unresolved issues.
- **Department Logins:** Segmenting the Admin portal so that the "Water Department" only sees water-related complaints on their map.
- **Cloud Storage:** Migrating local `uploads/` directory image saves to AWS S3 or Firebase Cloud Storage for infinite scalability.
