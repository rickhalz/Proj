const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// 1. Tell Multer to physically save incoming files to the "uploads" folder
const upload = multer({ dest: 'uploads/' });

let latestESP32Data = null;

app.post('/api/upload', upload.single('imageFile'), (req, res) => {
   const originalPath = req.file.path;

   // 1. Run Python
   exec(`python inference.py "${originalPath}"`, (error, stdout, stderr) => {
      if (error) {
         console.error("AI Error:", stderr);
         if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
         return res.status(500).send("AI Failed");
      }

      try {
         const aiResults = JSON.parse(stdout.trim());
         const payload = JSON.parse(req.body.jsonData);

         // 2. IMPORTANT: Read the PROCESSED image, not the original
         if (aiResults.processed_image && fs.existsSync(aiResults.processed_image)) {
            const processedBuffer = fs.readFileSync(aiResults.processed_image);

            // Convert the marked-up image to Base64 for React
            payload.imageb64 = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

            // Clean up the processed file
            fs.unlinkSync(aiResults.processed_image);
         }

         // 3. Clean up the original upload
         if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);

         // Update data for React
         payload.growthStage = aiResults.stage;
         payload.confidence = aiResults.confidence;
         latestESP32Data = payload;

         console.log(`Success: Displaying processed image for ${payload.growthStage}`);
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
   } else {
      res.status(404).send("No data yet");
   }
});

app.listen(3001, () => {
   console.log("Express + AI Node server running on port 3001");
});
