const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase-config');

// CITIZEN REGISTER
router.post('/register', async (req, res) => {
    try {
        const { username, phoneNumber, password } = req.body;
        
        // Validation Checks
        const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ error: "Invalid Indian phone number" });
        }
        
        const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters" });
        }

        // In a real app, use Firebase Auth. Here we just save to Firestore for simplicity of testing
        const userRef = db.collection('users').doc();
        await userRef.set({
            uid: userRef.id,
            username,
            phoneNumber,
            password, // MUST hash in production (bcrypt)
            role: 'citizen',
            createdAt: new Date()
        });
        
        res.status(201).json({ message: 'User registered successfully', uid: userRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADMIN REGISTER
router.post('/admin/register', async (req, res) => {
    try {
        const { username, password, secretCode } = req.body;
        
        if (secretCode !== 'ResolveX') {
            return res.status(401).json({ error: "Invalid Administrative Secret Code" });
        }
        
        // Prevent duplicate usernames if doing robust validation
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).get();
        if (!snapshot.empty) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const adminRef = db.collection('users').doc();
        await adminRef.set({
            uid: adminRef.id,
            username,
            password, // MUST hash in production
            role: 'admin',
            createdAt: new Date()
        });
        
        res.status(201).json({ message: 'Admin registered successfully', uid: adminRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CITIZEN/ADMIN LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Admin hardcoded fallback wrapper
        if (username === 'admin' && password === 'admin123') {
            return res.status(200).json({ 
                message: 'Admin logged in', 
                user: { uid: 'admin-1', username: 'admin', role: 'admin' }
            });
        }

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).where('password', '==', password).get();
        
        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        let user;
        snapshot.forEach(doc => {
            user = doc.data();
        });
        
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
