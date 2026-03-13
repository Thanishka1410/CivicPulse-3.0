const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

// Prioritize reading from Environment Variable (for Render deployment)
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    // Fallback to local file for development
    serviceAccount = require('./serviceAccountKey.json');
}

try {
  admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Firebase Admin initialization error", error.stack);
}

const db = admin.firestore();

module.exports = { admin, db };
