const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS module
const app = express();

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Initialize face_found variable (simulating a condition)
let face_found = true;

// GET endpoint to return different messages based on face_found value
app.get('/api/face-status', (req, res) => {
    if (face_found) {
        res.json(face_found);
    } else { 
        face_found = true
        res.json(false);
    }
});

// POST endpoint to update face_found based on Flask server's request
app.post('/update-face-status', (req, res) => {  
    console.log(`post req`)
    const { face_found: newFaceFound } = req.body;
    
    face_found = newFaceFound;
    console.log(`Updated face_found to: ${face_found}`);
    res.json({ message: `Face status updated to ${face_found}` });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
