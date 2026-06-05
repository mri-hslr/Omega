import { useEffect, useState, useContext } from "react";
import api from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const Videoplayer = ({ tmdbid, setid, selectedMedia, setactive }) => {
  const { user } = useContext(AuthContext); // Need this to check if logged in
  const [showData, setShowData] = useState(null);
  const [seasonCount, setSeasonCount] = useState(1);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [reccs, setReccs] = useState([]);
  const [toast, setToast] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Prevents iframe from loading S1E1 before we check DB

  // 1. Initial Load: Fetch Details & Resume Progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        const recRes = await api.get("/recc", { params: { id: tmdbid, selectedMedia: selectedMedia } });
        setReccs(recRes.data);

        if (selectedMedia === 'tv') {
          const detRes = await api.get("/details", { params: { id: tmdbid, selectedMedia: 'tv' } });
          setShowData(detRes.data);
          
          // Check database for saved progress if user is logged in
          if (user) {
              try {
                  const progRes = await api.get(`/progress/${tmdbid}`);
                  if (progRes.data) {
                      setSeasonCount(progRes.data.current_season);
                      setEpisodeCount(progRes.data.current_episode);
                  }
              } catch (e) {
                  // 404 just means no progress saved yet, which is fine!
                  console.log("No previous progress found, starting at S1E1");
              }
          }
        }
      } catch (err) {
        console.error("Failed to fetch media data:", err);
      } finally {
        setIsInitializing(false); // Safe to render iframe now
      }
    };
    
    setIsInitializing(true);
    fetchData();
    window.scrollTo(0, 0);
  }, [tmdbid, selectedMedia, user]);

  // 2. Silent Saver: Update Database when Season/Episode changes
  useEffect(() => {
    // Only save if it's a TV show, user is logged in, and we've finished initializing
    if (selectedMedia === 'tv' && user && !isInitializing) {
        api.put('/progress', {
            mediaId: tmdbid,
            mediaType: 'TV',
            season: seasonCount,
            episode: episodeCount
        }).catch(err => console.error("Silent save failed:", err));
    }
  }, [seasonCount, episodeCount, tmdbid, selectedMedia, user, isInitializing]);

  const addToWatchlist = async (m) => {
    try {
      await api.post("/watchlist", { 
          mediaId: m.id || m.mediaId, 
          mediaType: selectedMedia, 
          status: 'PLAN_TO_WATCH' 
      });
      setToast(`Added to My List`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) { 
      if (err.response && err.response.status === 409) {
          setToast("Already in your watchlist!");
          setTimeout(() => setToast(null), 3000);
      } else if (err.response && err.response.status === 401) {
          alert("Please log in to add movies to your watchlist!");
      }
    }
  };

  const currentSeason = showData?.seasons?.find(s => s.season_number === seasonCount);
  const totalEpisodes = currentSeason?.episode_count || 0;

  return (
    <div style={{ background: '#050505', minHeight: '100vh', padding: '100px 5% 50px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#46d369', color: 'black', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', zIndex: 9999 }}>
          {toast}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setactive('landing')} style={{ background: 'none', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', opacity: 0.6 }}>
            ← BACK TO BROWSE
        </button>
        <button onClick={() => addToWatchlist({ id: tmdbid })} style={{ background: '#E50914', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(229, 9, 20, 0.4)' }}>
            + ADD CURRENT TO WATCHLIST
        </button>
      </div>

      <div className="player-glow" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '50px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        {/* Only render iframe after checking the database for progress */}
        {!isInitializing && (
            <iframe 
            src={selectedMedia === 'movie' ? `https://vidking.net/embed/movie/${tmdbid}` : `https://vidking.net/embed/tv/${tmdbid}/${seasonCount}/${episodeCount}`}
            style={{ width: '100%', aspectRatio: '21/9', border: 'none' }} 
            allowFullScreen 
            />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedMedia === 'tv' ? '1fr 350px' : '1fr', gap: '50px' }}>
        <div>
            {selectedMedia === 'tv' && showData && (
                <div style={{ marginBottom: '50px' }}>
                    <h3 style={{ fontSize: '24px', marginBottom: '25px', fontWeight: '800' }}>Seasons</h3>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '20px' }}>
                        {showData.seasons.filter(s => s.season_number > 0).map(s => (
                        <button key={s.id} onClick={() => { setSeasonCount(s.season_number); setEpisodeCount(1); }}
                            style={{ padding: '12px 24px', background: seasonCount === s.season_number ? 'white' : '#1a1a1a', color: seasonCount === s.season_number ? 'black' : 'white', border: 'none', borderRadius: '4px', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}>
                            SEASON {s.season_number}
                        </button>
                        ))}
                    </div>

                    <h3 style={{ fontSize: '24px', margin: '20px 0 25px', fontWeight: '800' }}>Episodes</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
                        {[...Array(totalEpisodes)].map((_, i) => (
                        <button key={i} onClick={() => setEpisodeCount(i + 1)}
                            style={{ height: '50px', background: episodeCount === (i + 1) ? '#E50914' : '#111', color: '#fff', border: '1px solid #222', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>
                            {i + 1}
                        </button>
                        ))}
                    </div>
                </div>
            )}

            <h3 style={{ fontSize: '24px', marginBottom: '30px', fontWeight: '800' }}>MORE LIKE THIS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {reccs.slice(0, 12).map(m => (
                <div key={m.id} className="media-card" onClick={() => setid(m.id)} style={{ flex: 'none', minWidth: 'auto', width: '100%' }}>
                    <div className="poster-container" style={{ aspectRatio: '16/9' }}>
                        <img src={`https://image.tmdb.org/t/p/w500${m.backdrop_path || m.poster_path}`} style={{ width: '100%' }} />
                        <div className="poster-overlay">
                            <button onClick={(e) => { e.stopPropagation(); addToWatchlist(m); }} style={{ background: '#E50914', border: 'none', color: '#fff', fontSize: '12px', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                + ADD TO LIST
                            </button>
                        </div>
                    </div>
                    <div className="meta">
                        <p className="title">{m.title || m.name}</p>
                    </div>
                </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
export default Videoplayer;