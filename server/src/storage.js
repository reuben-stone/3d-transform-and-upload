require("dotenv").config({ path: "../.env" });
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");

const DEBUG = process.env.DEBUG === "true";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Validate required env vars
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${key}`);
  }
}

// --- Firebase Init ---
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Uploads a GLB buffer to Firebase Storage and returns its public URL.
 * @param {Buffer} glbBuffer - The binary GLB file buffer
 * @returns {Promise<string>} - Public download URL
 */
async function uploadToFirebase(glbBuffer) {
  const fileName = `optimized-${Date.now()}.glb`;
  const storageRef = ref(storage, fileName);

  try {
    if (DEBUG) console.log("Uploading:", fileName);

    await uploadBytes(storageRef, glbBuffer, {
      contentType: "model/gltf-binary",
    });

    const downloadURL = await getDownloadURL(storageRef);

    if (DEBUG) console.log("Download URL:", downloadURL);

    return downloadURL;
  } catch (err) {
    console.error("Firebase upload failed:", err.message);
    throw new Error("Upload to Firebase failed");
  }
}

module.exports = { uploadToFirebase };