require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { processOBJ } = require("./optimizeModel");
const { uploadToFirebase } = require("./storage");

const app = express();
const port = 3000;
app.use(cors());

// File upload setup
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("model"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    // Sanitize the OBJ file by removing metadata and comments
    const sanitizedOBJBuffer = sanitizeOBJFile(req.file.buffer);

    // Now process the sanitized OBJ file
    const optimizedGLB = await processOBJ(sanitizedOBJBuffer);

    console.log('Optimized GLB File:', optimizedGLB)

    const fileUrl = await uploadToFirebase(optimizedGLB);

    res.json({ message: "File processed successfully", fileUrl });
  } catch (error) {
    res.status(500).json({ error: "Processing failed" });
  }
});

// Helper function to sanitize OBJ file (remove comments and metadata)
const sanitizeOBJFile = (buffer) => {
  const objContent = buffer.toString('utf-8'); // Convert buffer to string
  
  // Remove comments (lines starting with #) and metadata
  const sanitizedContent = objContent
    .split('\n')
    .filter(line => !line.startsWith('#'))  // Remove lines that start with '#'
    .join('\n');
  
  return Buffer.from(sanitizedContent, 'utf-8'); // Convert back to Buffer
};

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
