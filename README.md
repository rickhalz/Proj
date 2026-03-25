## Project Structure
* **`/frontend`**: ReactTS application powered by Vite.
* **`/backend`**: Node.js Express server handling `multer` uploads and executing a Python AI inference script.

## Installation & Setup

```bash
# 1. Clone and enter the repository
git clone https://github.com/rickhalz/Proj
cd Proj

# 2. Setup the backend (Node + Python)
cd backend
npm install
pip install opencv-python numpy tensorflow

# 3. Setup the frontend (ReactTS + Vite)
cd ../frontend
npm install
```
