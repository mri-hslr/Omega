import axios from "axios";
import { useEffect, useState } from "react";

const Videoplayer = ({ tmdbid, setid, selectedMedia, setactive }) => {
  const [showData, setShowData] = useState(null);
  const [seasonCount, setSeasonCount] = useState(1);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [reccs, setReccs] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const recRes = await axios.get("https://video-stream-site.onrender.com/recc", { params: { id: tmdbid, selectedMedia: selectedMedia } });
      setReccs(recRes.data);

      if (selectedMedia === 'tv') {
        const detRes = await axios.get("https://video-stream-site.onrender.com/details", { params: { id: tmdbid, selectedMedia: 'tv' } });
        setShowData(detRes.data);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [tmdbid, selectedMedia]);

  const addToWatchlist = async (m) => {
    try {
      await axios.post("https://video-stream-site.onrender.com/watchlist", { metadata: [m] });
      setToast(`Added to My List`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) { console.error(err); }
  };

  const currentSeason = showData?.seasons?.find(s => s.season_number === seasonCount);
  const totalEpisodes = currentSeason?.episode_count || 0;

  return (
    <div style={{ background: 'var(--bg-black)', minHeight: '100vh', padding: '100px 5% 50px' }}>
      {toast && <div className="toast-container"><div className="toast-card">✅ {toast}</div></div>}
      
      <button onClick={() => setactive('landing')} style={{ background: 'none', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '30px', fontSize: '14px', fontWeight: '700', opacity: 0.6 }}>← BACK TO BROWSE</button>

      <div className="player-glow" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '50px' }}>
        <iframe 
          src={selectedMedia === 'movie' ? `https://vidsrc-embed.ru/embed/movie/${tmdbid}` : `https://vidsrc-embed.ru/embed/tv/${tmdbid}/${seasonCount}/${episodeCount}`} 
          style={{ width: '100%', aspectRatio: '21/9', border: 'none' }} 
          allowFullScreen 
        />
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
                            style={{ height: '50px', background: episodeCount === (i + 1) ? 'var(--netflix-red)' : '#111', color: '#fff', border: '1px solid #222', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>
                            {i + 1}
                        </button>
                        ))}
                    </div>
                </div>
            )}

            <h3 style={{ fontSize: '24px', marginBottom: '30px', fontWeight: '800' }}>MORE LIKE THIS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {reccs.slice(0, 12).map(m => (
                <div key={m.id} className="movie-card" onClick={() => setid(m.id)} style={{ flex: 'none' }}>
                    <img src={`https://image.tmdb.org/t/p/w500${m.backdrop_path}`} style={{ width: '100%' }} />
                    <div style={{ padding: '12px' }}>
                        <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>{m.title || m.name}</h4>
                        <button onClick={(e) => { e.stopPropagation(); addToWatchlist(m); }} style={{ background: 'none', border: '1px solid #444', color: '#fff', fontSize: '10px', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>+ LIST</button>
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