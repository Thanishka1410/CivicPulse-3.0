const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase-config');
const multer = require('multer');

// Configure multer for memory storage (for simplicity without cloud storage config)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Generate a random complaint ID
const generateComplaintId = () => {
    return 'CP-' + Math.floor(100000 + Math.random() * 900000);
};

// POST Submitting a complaint (Citizen)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { citizenId, issueType, location, description, lat, lng } = req.body;
        
        // Prevent duplicate submissions for the same user, location, and issue type
        const duplicateCheck = await db.collection('complaints')
            .where('citizenId', '==', citizenId)
            .where('location', '==', location)
            .where('issueType', '==', issueType)
            .get();
            
        let hasActiveDuplicate = false;
        duplicateCheck.forEach(doc => {
            const status = doc.data().status;
            if (status !== 'Completed' && status !== 'Cancelled') {
                hasActiveDuplicate = true;
            }
        });
        
        if (hasActiveDuplicate) {
            return res.status(400).json({ error: "You already have an active complaint of this type submitted for this exact location. You can submit complaints of different categories here." });
        }

        let imageUrl = '';
        if (req.file) {
            // For a demo app, we'll store the base64 string directly in Firestore
            // IN PRODUCTION: Upload to Firebase Storage and save the URL
            const base64Image = req.file.buffer.toString('base64');
            imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
        }

        const complaintId = generateComplaintId();
        
        const complaintData = {
            complaintId,
            citizenId,
            issueType,
            location,
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            description,
            imageUrl,
            status: 'Pending',
            department: 'Unassigned',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = db.collection('complaints').doc(complaintId);
        await docRef.set(complaintData);

        res.status(201).json({ message: 'Complaint submitted successfully', complaintId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET complaints for a specific citizen
router.get('/citizen/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const complaintsRef = db.collection('complaints');
        const snapshot = await complaintsRef.where('citizenId', '==', uid).get();
        
        const complaints = [];
        snapshot.forEach(doc => {
            complaints.push(doc.data());
        });
        
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all complaints (Admin)
router.get('/all', async (req, res) => {
    try {
        const complaintsRef = db.collection('complaints');
        const snapshot = await complaintsRef.get();
        
        const complaints = [];
        snapshot.forEach(doc => {
            complaints.push(doc.data());
        });
        
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET stats summary (Admin)
router.get('/stats', async (req, res) => {
    try {
        const complaintsRef = db.collection('complaints');
        const snapshot = await complaintsRef.get();
        
        let stats = {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            escalated: 0 // We'll randomly define escalated as > 7 days old or just unassigned
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            stats.total++;
            if (data.status === 'Pending') stats.pending++;
            if (data.status === 'In Progress') stats.inProgress++;
            if (data.status === 'Completed') stats.completed++;
            if (data.department === 'Unassigned' && data.status !== 'Completed') stats.escalated++;
        });
        
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update complaint (Admin)
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, department } = req.body;
        
        const updateData = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (department) updateData.department = department;

        const docRef = db.collection('complaints').doc(id);
        await docRef.update(updateData);
        
        res.status(200).json({ message: 'Complaint updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
