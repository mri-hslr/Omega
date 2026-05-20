// FILE: src/App.jsx
import { useState, useContext } from 'react';
import './App.css';
import Landing from './components/Landing';
import Videoplayer from './components/videoPlayer';
import Searchresults from './components/searchResultsearchresults';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import { AuthContext } from './context/AuthContext';

function App() {
  const [id, setid] = useState(null);
  const [results, setresults] = useState([]);
  const [active, setactive] = useState('landing');
  const [selectedMedia, setSelectedMedia] = useState('movie'); 

  // Tune into the AuthContext to get the current user state
  const { user } = useContext(AuthContext);

  return (
    <div className="App">
      
      {/* GLOBAL AUTH STATUS BAR */}
      <div style={{ position: 'absolute', top: '30px', right: '50px', zIndex: 1000, display: 'flex', gap: '15px', alignItems: 'center' }}>
        
        {/* BULLETPROOF CHECK: Safely check if user exists */}
        {user ? (
          <div 
            onClick={() => setactive('profile')}
            style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                background: '#E50914', color: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(229, 9, 20, 0.4)'
            }}
            title="Go to Profile"
          >
            {/* THE FIX: Optional Chaining safely grabs the first letter, or falls back to 'U' */}
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        ) : (
          /* Show Sign In button if there is no valid user */
          active !== 'login' && active !== 'register' && (
            <button onClick={() => setactive('login')} style={{ padding: '8px 16px', background: '#E50914', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Sign In
            </button>
          )
        )}
      </div>

      {/* ROUTING LOGIC */}
      {active === 'landing' && (
        <Landing 
          setactive={setactive} 
          setid={setid} 
          setresults={setresults}
          selectedMedia={selectedMedia}
          setSelectedMedia={setSelectedMedia} 
        />
      )}

      {active === "player" && (
        <Videoplayer 
          tmdbid={id} 
          setid={setid} 
          setactive={setactive}
          selectedMedia={selectedMedia} 
        />
      )}

      {active === "search" && (
        <Searchresults 
          setid={setid} 
          setactive={setactive} 
          results={results} 
          selectedMedia={selectedMedia}
        />
      )}

      {active === 'login' && (
        <Login setactive={setactive} />
      )}

      {active === 'register' && (
        <Register setactive={setactive} />
      )}

      {/* NEW PROFILE ROUTE */}
      {active === 'profile' && (
        <Profile setactive={setactive} setid={setid} />
      )}
    </div>
  );
}

export default App;