require("dotenv").config({ path: "../.env" });
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");

// Firebase config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Storage
const storage = getStorage(app);

// Function to upload file to Firebase Storage
async function uploadToFirebase(glbBuffer) {
  const fileName = `optimized-${Date.now()}.glb`;
  const storageRef = ref(storage, fileName);
  
  console.log('fileName', fileName);
  console.log('storageRef', storageRef);
  
  // Upload the file to Firebase Storage
  await uploadBytes(storageRef, glbBuffer, { contentType: "model/gltf-binary" });

  // Get the public URL of the uploaded file
  const downloadURL = await getDownloadURL(storageRef);

  console.log('downloadURL', downloadURL);

  return downloadURL;
}

module.exports = { uploadToFirebase };
