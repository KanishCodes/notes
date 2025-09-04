// Import required packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import authentication router and NEW middleware
const authRouter = require('./routes/auth');
const authMiddleware = require('./middleware/auth'); // <-- NEW

// Create the Express app
const app = express();

// Initialize the Google AI client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use the authentication router for all /api/auth routes
app.use('/api/auth', authRouter);


// --- PROTECTED API ROUTES ---

// Get all notes for the authenticated user
app.get('/api/notes', authMiddleware, async (req, res) => { // <-- NEW: Apply authMiddleware
  try {
    const { rows } = await db.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]); // <-- NEW: Filter by user_id
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add a new note for the authenticated user
app.post('/api/notes', authMiddleware, async (req, res) => { // <-- NEW: Apply authMiddleware
  try {
    const { title, content } = req.body;
    const { rows } = await db.query(
      'INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, req.userId] // <-- NEW: Add user_id to the query
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Summarize a note using Gemini (for the authenticated user)
app.post('/api/notes/:id/summarize', authMiddleware, async (req, res) => { // <-- NEW: Apply authMiddleware
  try {
    const { id } = req.params;
    
    // 1. Get the note's content from the database and check ownership
    const noteResult = await db.query('SELECT content FROM notes WHERE id = $1 AND user_id = $2', [id, req.userId]); // <-- NEW: Check ownership
    if (noteResult.rows.length === 0) {
      // Return 404 if not found or 401 if it belongs to another user
      return res.status(404).json({ msg: 'Note not found or you do not have permission to view it' });
    }
    const noteContent = noteResult.rows[0].content;

    // 2. Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const prompt = `Please summarize the following note concisely in one or two sentences: "${noteContent}"`;
    
    // 3. Generate the summary
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    // 4. Send the summary back to the client
    res.json({ summary });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get the port from environment variables, with a default
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});