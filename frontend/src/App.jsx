import { useState, useEffect } from 'react';
import axios from 'axios';
import ThemeToggle from './components/ThemeToggle';
import './App.css';
import Auth from './Auth'; // <-- NEW: Import the Auth component

function App() {
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summarizedNoteId, setSummarizedNoteId] = useState(null);

  // --- NEW: Authentication State Management ---
  const [user, setUser] = useState(null); // Stores the logged-in user object
  const [token, setToken] = useState(null); // Stores the user's JWT
  const [loading, setLoading] = useState(true); // Manages initial load state

  // Check for token in localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // If a token exists, set the token state
      setToken(storedToken);
      // You would typically decode the token or call a backend endpoint here
      // to get the user's details. For this simple app, we'll just
      // assume the presence of a token means the user is authenticated.
      // We will set a dummy user object to render the notes UI.
      setUser({ email: 'authenticated_user' }); 
    }
    setLoading(false);
  }, []);

  // Sync token to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);


  // Fetch notes only if a user is logged in
  useEffect(() => {
    const fetchNotes = async () => {
      // Check for a token before making the API call
      if (!token) return;

      try {
        // --- NEW: Add authorization header to the request ---
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notes`, config);
        setNotes(response.data);
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };
    if (user) {
      fetchNotes();
    }
  }, [user, token]); // Re-run when user or token changes


  // --- NEW: Handle Login and Registration ---
  const handleAuthSuccess = (res) => {
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setNotes([]); // Clear notes on logout
  };

  // --- All notes-related functions are now protected ---
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      // Add a check to prevent adding a note without a user
      if (!user) return; 

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/notes`, {
        title: newNoteTitle,
        content: newNoteContent,
      }, config);
      setNotes([response.data, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleSummarize = async (noteId) => {
    // Add a check to prevent summarizing without a user
    if (!user) return;

    setSummarizedNoteId(noteId);
    setIsLoadingSummary(true);
    setSummary('');

    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/notes/${noteId}/summarize`, {}, config);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error summarizing note:", error);
      setSummary("Sorry, we couldn't summarize this note.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <ThemeToggle />
      <header>
        <h1>My Notes</h1>
        {user && ( // <-- NEW: Show logout button if user is logged in
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>
      
      {/* --- NEW: Conditional Rendering based on login state --- */}
      {!user ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <>
          <form className="note-form" onSubmit={handleAddNote}>
            <input 
              type="text"
              placeholder="Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Content"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              required
            ></textarea>
            <button type="submit">Add Note</button>
          </form>

          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <h2>{note.title}</h2>
                <p>{note.content}</p>
                <div className="note-actions">
                  <button onClick={() => handleSummarize(note.id)}>
                    Summarize ✨
                  </button>
                </div>
                {summarizedNoteId === note.id && (
                  <div className="summary-container">
                    {isLoadingSummary ? <p>🧠 Thinking...</p> : <p>{summary}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;