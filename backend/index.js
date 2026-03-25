const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// 1. Force the paths to stay inside test/backend/
const BACKEND_DIR = __dirname;
const UPLOADS_DIR = path.join(BACKEND_DIR, 'uploads');

// Ensure the uploads directory exists before multer tries to use it
if (!fs.existsSync(UPLOADS_DIR)) {
   fs.mkdirSync(UPLOADS_DIR);
}

// Serve the static folder securely
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer with the absolute path
const upload = multer({ dest: UPLOADS_DIR });

let latestESP32Data = null;
let lastProcessedImage = null;

app.post('/api/upload', upload.single('imageFile'), (req, res) => {
   const originalPath = req.file.path; // Multer will use the absolute UPLOADS_DIR path

   // 2. Force the execution to look for inference.py exactly where index.js is
   const pythonScript = path.join(BACKEND_DIR, 'inference.py');

   exec(`python "${pythonScript}" "${originalPath}"`, (error, stdout, stderr) => {
      if (error) {
         console.error("AI Error:", stderr);
         if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
         return res.status(500).send("AI Failed");
      }

      try {
         const jsonString = stdout.substring(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1);
         const aiResults = JSON.parse(jsonString || stdout.trim());
         const payload = req.body.jsonData ? JSON.parse(req.body.jsonData) : {};

         if (aiResults.processed_image && fs.existsSync(aiResults.processed_image)) {
            // 3. Extract just the filename to attach to our localhost URL
            const fileName = path.basename(aiResults.processed_image);
            payload.imageUrl = `http://localhost:3001/uploads/${fileName}`;

            // Clean up old images
            if (lastProcessedImage && fs.existsSync(lastProcessedImage) && lastProcessedImage !== aiResults.processed_image) {
               fs.unlinkSync(lastProcessedImage);
            }
            lastProcessedImage = aiResults.processed_image;
         }

         if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);

         payload.growthStage = aiResults.stage;
         payload.confidence = aiResults.confidence;
         latestESP32Data = payload;
         res.status(200).send("Processed image sent to dashboard");

      } catch (e) {
         console.error("JSON Parse Error:", e);
         res.status(500).send("Internal Error");
      }
   });
});

app.get('/api/data', (req, res) => {
   if (latestESP32Data) {
      res.json(latestESP32Data);
      console.log(latestESP32Data);
   } else {
      res.status(404).send("No data yet");
   }
});

app.listen(3001, () => {
   console.log("Express + AI Node server running on port 3001");
});
