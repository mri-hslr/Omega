const Searchresults = ({ results, setid, setactive }) => {
  return (
    <div className="search-results-root" style={{ background: '#000', minHeight: '100vh', padding: '120px 5%' }}>
        <button 
          onClick={() => setactive('landing')} 
          style={{ marginBottom: '50px', background: 'transparent', border: '1px solid #444', color: '#fff', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px' }}
        >
          ← BROWSE HOME
        </button>
        
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '40px', color: '#fff' }}>Search Results</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' }}>
            {results.map(item => (
                <div key={item.id} onClick={() => { setid(item.id); setactive('player'); }} style={{ cursor: 'pointer' }}>
                    <div className="poster-container" style={{ borderRadius: '8px', overflow: 'hidden', aspectRation: '2/3' }}>
                        <img 
                            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'} 
                            style={{ width: '100%', display: 'block' }} 
                        />
                    </div>
                    <h4 style={{ marginTop: '15px', fontSize: '14px', color: '#fff', textAlign: 'center' }}>{item.title || item.name}</h4>
                </div>
            ))}
        </div>
        {results.length === 0 && <div style={{ textAlign: 'center', color: '#666', padding: '100px' }}>No titles found matching your search.</div>}
    </div>
  );
};

export default Searchresults;