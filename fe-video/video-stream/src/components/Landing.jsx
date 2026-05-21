// FILE: src/components/Landing.jsx
import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axiosInstance';
import '../index.css';
import { AuthContext } from '../context/AuthContext';

const Landing = ({ setactive, setid, selectedMedia, setSelectedMedia, setresults }) => {
  const { user } = useContext(AuthContext); 
  
  const [data, setData] = useState({ trending: [], topRated: [], loading: true });
  const [searchInput, setSearchInput] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchMedia = async () => {
      setData(prev => ({ ...prev, loading: true }));
      try {
        const response = await api.get(`/landing`);
        const rawData = response.data;
        if (selectedMedia === 'tv') {
          setData({ trending: rawData[0] || [], topRated: rawData[1] || [], loading: false });
        } else {
          setData({ trending: rawData[3] || [], topRated: rawData[4] || [], loading: false });
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchMedia();
  }, [selectedMedia]);

  const addToWatchlist = async (m) => {
    try {
      await api.post("/watchlist", { 
          mediaId: m.id, 
          mediaType: selectedMedia, 
          status: 'PLAN_TO_WATCH' 
      });
      setToast(`Added to My List`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) { 
      console.error(err); 
      if (err.response && err.response.status === 409) {
          setToast("Already in your watchlist!");
          setTimeout(() => setToast(null), 3000);
      } else if (err.response && err.response.status === 401) {
          alert("Please log in to add movies to your watchlist!");
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    try {
      const res = await api.get("/search", {
        params: { search_query: searchInput, selectedMedia: selectedMedia }
      });
      setresults(res.data);
      setactive('search');
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleMediaClick = (id) => {
    setid(id);
    setactive("player");
  };

  return (
    <div className="landing-root">
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#46d369', color: 'black', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <nav className="nav-container">
        {/* 1. Logo */}
        <div className="nav-logo" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', color: '#E50914', fontWeight: '900', fontSize: '24px' }}>
          MOONWATCH
        </div>

        {/* 2. Toggle Pill */}
        <div className="nav-pill" style={{ flex: '0 1 auto' }}>
          <div className="nav-slider" style={{ left: selectedMedia === 'movie' ? '4px' : 'calc(50% + 1px)' }} />
          <button className={`nav-item ${selectedMedia === 'movie' ? 'active' : ''}`} onClick={() => setSelectedMedia('movie')}>Movies</button>
          <button className={`nav-item ${selectedMedia === 'tv' ? 'active' : ''}`} onClick={() => setSelectedMedia('tv')}>TV Shows</button>
        </div>

        {/* 3. Search Bar & Auth (Side-by-side on mobile!) */}
        <div className="nav-actions">
          <form onSubmit={handleSearch} className="search-form">
            <input 
              type="text" 
              placeholder="Search..." 
              className="search-input-premium"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>

          {/* DYNAMIC AUTH BUTTON */}
          {user ? (
            <div 
              onClick={() => setactive('profile')}
              style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: '#E50914', color: 'white', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(229, 9, 20, 0.4)',
                  flexShrink: 0 
              }}
              title="Go to Profile"
            >
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          ) : (
            <button className="login-btn" onClick={() => setactive('login')}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main className="main-content">
        {data.loading ? (
          <div className="loader">Preparing Cinema...</div>
        ) : (
          <>
            <section className="shelf">
              <h2 className="shelf-title">Trending {selectedMedia === 'movie' ? 'Now' : 'Series'}</h2>
              <div className="horizontal-scroll">
                {data.trending.map(item => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    onClick={() => handleMediaClick(item.id)} 
                    onAdd={() => addToWatchlist(item)}
                  />
                ))}
              </div>
            </section>

            <section className="shelf">
              <h2 className="shelf-title">Top Rated</h2>
              <div className="horizontal-scroll">
                {data.topRated.map(item => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    onClick={() => handleMediaClick(item.id)} 
                    onAdd={() => addToWatchlist(item)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const MediaCard = ({ item, onClick, onAdd }) => (
  <div className="media-card" onClick={onClick}>
    <div className="poster-container">
      <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt="" />
      <div className="poster-overlay">
        <div className="play-btn">▶</div>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onAdd(); 
          }} 
          style={{ 
            position: 'absolute', bottom: '20px', 
            background: '#E50914', color: 'white', border: 'none', 
            padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', 
            cursor: 'pointer', fontSize: '12px' 
          }}
        >
          + ADD TO LIST
        </button>
      </div>
    </div>
    <div className="meta">
      <p className="title">{item.title || item.name}</p>
      <span className="rating">★ {item.vote_average?.toFixed(1)}</span>
    </div>
  </div>
);

export default Landing;