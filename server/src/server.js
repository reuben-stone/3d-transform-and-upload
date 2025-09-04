require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");

const { processOBJ } = require("./optimizeModel");
const { uploadToFirebase } = require("./storage");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Removes comments/metadata from an OBJ file buffer.
 */
function sanitizeOBJFile(buffer) {
  return Buffer.from(
    buffer
      .toString("utf-8")
      .split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n"),
    "utf-8"
  );
}

app.post("/upload", upload.single("model"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const sanitizedOBJ = sanitizeOBJFile(req.file.buffer);
    const optimizedGLB = await processOBJ(sanitizedOBJ);
    const fileUrl = await uploadToFirebase(optimizedGLB);

    res.json({
      message: "File processed successfully",
      fileUrl,
    });
  } catch (err) {
    console.error("Processing error:", err.message);
    res.status(500).json({ error: "File processing failed" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});