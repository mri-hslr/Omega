// FILE: src/components/Profile.jsx
import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';

const Profile = ({ setactive, setid }) => {
    const { user, logout } = useContext(AuthContext);
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndHydrate = async () => {
            try {
                const response = await api.get('/watchlist'); 
                const rawWatchlist = response.data;
                await hydrateWatchlist(rawWatchlist);
            } catch (err) {
                console.error("Failed to load profile data:", err);
                setLoading(false);
            }
        };

        if (user) fetchAndHydrate();
    }, [user]);

    const hydrateWatchlist = async (rawList) => {
        if (rawList.length === 0) {
            setWatchlist([]);
            setLoading(false);
            return;
        }

        try {
            const hydrationPromises = rawList.map(async (item) => {
                const response = await api.get('/details', {
                    params: { id: item.media_id, selectedMedia: item.media_type.toLowerCase() }
                });
                
                return {
                    ...response.data,
                    watchStatus: item.status
                };
            });

            const hydratedData = await Promise.all(hydrationPromises);
            setWatchlist(hydratedData);
            setLoading(false);

        } catch (error) {
            console.error("Hydration failed:", error);
            setLoading(false);
        }
    };

    const updateWatchStatus = async (mediaId, newStatus) => {
        try {
            await api.put('/watchlist', { mediaId, status: newStatus });
            setWatchlist(prev => prev.map(item => 
                item.id === mediaId ? { ...item, watchStatus: newStatus } : item
            ));
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Could not update status. Please try again.");
        }
    };

    if (!user) {
        return (
            <div style={{ padding: '100px', color: 'white', textAlign: 'center' }}>
                <h2>You must be logged in to view this page.</h2>
                <button onClick={() => setactive('login')} style={{ marginTop: '20px', padding: '10px 20px', background: '#E50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        /* FIXED: Replaced inline styles with CSS classes */
        <div className="profile-container" style={{ minHeight: '100vh', background: '#050505', color: 'white' }}>
            
            {/* Header */}
            <div className="profile-header">
                <div className="profile-info">
                    <div className="profile-avatar-large">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-details">
                        <h1>{user.username}'s Profile</h1>
                        <p>Member since 2026</p>
                    </div>
                </div>
                
                <div className="profile-actions">
                    <button onClick={() => setactive('landing')} style={{ background: 'none', border: '1px solid #444', color: 'white', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Back to Browse
                    </button>
                    <button onClick={() => { logout(); setactive('landing'); }} style={{ background: '#E50914', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Log Out
                    </button>
                </div>
            </div>

            {/* Watchlist Section */}
            <h2 style={{ fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '30px' }}>My Watchlist</h2>
            
            {loading ? (
                <div className="loader">Hydrating Watchlist...</div>
            ) : watchlist.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '18px' }}>Your watchlist is empty. Go add some movies!</p>
            ) : (
                /* FIXED: Grid layout is now controlled by index.css */
                <div className="watchlist-grid">
                    {watchlist.map(item => (
                        <div key={item.id} className="media-card" onClick={() => { setid(item.id); setactive('player'); }}>
                            <div className="poster-container" style={{ aspectRatio: '2/3' }}>
                                <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="poster-overlay">
                                    <select 
                                        value={item.watchStatus}
                                        onClick={(e) => e.stopPropagation()} 
                                        onChange={(e) => updateWatchStatus(item.id, e.target.value)}
                                        style={{ 
                                            background: '#E50914', color: 'white', border: '1px solid #ff4c4c', 
                                            padding: '8px 12px', borderRadius: '4px', fontSize: '12px', 
                                            fontWeight: 'bold', cursor: 'pointer', outline: 'none' 
                                        }}
                                    >
                                        <option value="PLAN_TO_WATCH">Plan to Watch</option>
                                        <option value="ONGOING">Ongoing</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="DROPPED">Dropped</option>
                                    </select>
                                </div>
                            </div>
                            <div className="meta">
                                <p className="title">{item.title || item.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profile;