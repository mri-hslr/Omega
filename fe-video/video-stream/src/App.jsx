// FILE: src/App.jsx
import { useState } from 'react';
import './App.css';
import Landing from './components/Landing';
import Videoplayer from './components/videoPlayer';
import SearchResults from './components/searchResults';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';

function App() {
  const [id, setid] = useState(null);
  const [results, setresults] = useState([]);
  const [active, setactive] = useState('landing');
  const [selectedMedia, setSelectedMedia] = useState('movie'); 

  return (
    <div className="App">
      
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
        <SearchResults 
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

      {active === 'profile' && (
        <Profile setactive={setactive} setid={setid} />
      )}
    </div>
  );
}

export default App;