const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

// Require the service key JSON file
const serviceAccount = require('./serviceAccountKey.json');

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
