import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Landing = ({ setactive, setid, selectedMedia, setSelectedMedia, setresults }) => {
  const [data, setData] = useState({ trending: [], topRated: [], loading: true });
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const fetchMedia = async () => {
      setData(prev => ({ ...prev, loading: true }));
      try {
        const response = await axios.get(`http://localhost:3000/landing`);
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    try {
      const res = await axios.get("http://localhost:3000/search", {
        params: { search_query: searchInput, selectedMedia: selectedMedia }
      });
      setresults(res.data); // Store results in parent state
      setactive('search');  // Switch view to search results
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
      <nav className="nav-container">
        {/* 1. Logo pushes perfectly to the left on Desktop */}
        <div className="nav-logo" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', color: '#E50914', fontWeight: '900', fontSize: '24px' }}>
          MOONWATCH
        </div>

        {/* 2. Toggle Pill stays dead center */}
        <div className="nav-pill" style={{ flex: '0 1 auto' }}>
          <div className="nav-slider" style={{ left: selectedMedia === 'movie' ? '4px' : 'calc(50% + 1px)' }} />
          <button className={`nav-item ${selectedMedia === 'movie' ? 'active' : ''}`} onClick={() => setSelectedMedia('movie')}>Movies</button>
          <button className={`nav-item ${selectedMedia === 'tv' ? 'active' : ''}`} onClick={() => setSelectedMedia('tv')}>TV Shows</button>
        </div>

        {/* 3. Search Bar & Login push perfectly to the right on Desktop */}
        <div className="nav-actions">
          <form onSubmit={handleSearch} style={{ width: '100%' }}>
            <input 
              type="text" 
              placeholder="Search..." 
              className="search-input-premium"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <button className="login-btn" onClick={() => setactive('login')}>
            Sign In
          </button>
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
                  <MediaCard key={item.id} item={item} onClick={() => handleMediaClick(item.id)} />
                ))}
              </div>
            </section>

            <section className="shelf">
              <h2 className="shelf-title">Top Rated</h2>
              <div className="horizontal-scroll">
                {data.topRated.map(item => (
                  <MediaCard key={item.id} item={item} onClick={() => handleMediaClick(item.id)} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const MediaCard = ({ item, onClick }) => (
  <div className="media-card" onClick={onClick}>
    <div className="poster-container">
      <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt="" />
      <div className="poster-overlay"><div className="play-btn">▶</div></div>
    </div>
    <div className="meta">
      <p className="title">{item.title || item.name}</p>
      <span className="rating">★ {item.vote_average?.toFixed(1)}</span>
    </div>
  </div>
);

export default Landing;