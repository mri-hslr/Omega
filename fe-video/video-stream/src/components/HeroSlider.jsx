// FILE: src/components/HeroSlider.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import '../index.css';

const HeroSlider = ({ movies, setid, setactive, selectedMedia }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState({});

  const topFive = movies.slice(0, 5);
  const movieIdsString = topFive.map(m => m.id).join(',');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (topFive.length === 0) return;

    const fetchTrailers = async () => {
      const keys = {};
      
      await Promise.all(topFive.map(async (movie) => {
        try {
          const res = await api.get('/details', { 
            params: { id: movie.id, selectedMedia: selectedMedia || 'movie' } 
          });
          
          const videos = res.data.videos?.results || [];
          const officialTrailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                               || videos.find(v => v.site === 'YouTube');
          
          if (officialTrailer) {
            keys[movie.id] = officialTrailer.key;
          }
        } catch (err) {
          console.error(`API Call Failed for ${movie.id}`, err);
        }
      }));

      setTrailerKeys(keys);
    };

    fetchTrailers();
  }, [movieIdsString, selectedMedia]); 

  // THE FIX 1: Changed from 8000 (8s) to 18000 (18s)
useEffect(() => {
    if (topFive.length === 0) return;
    
    // DEBUGGING: This proves exactly when the timer starts
    console.log("🎬 Slider timer started! Waiting 18 seconds...");

    const timer = setInterval(() => {
      console.log("⏱️ 18 seconds passed! Changing slide...");
      setCurrentIndex((prevIndex) => (prevIndex + 1) % topFive.length);
    }, 18000); // 18000ms = 18 seconds
    
    return () => clearInterval(timer);
  }, [topFive.length]);

  if (topFive.length === 0) return null;

  return (
    <div className="hero-slider-container">
      {topFive.map((movie, index) => {
        const isActive = index === currentIndex;
        const youtubeKey = trailerKeys[movie.id];

        return (
          <div key={movie.id} className={`hero-slide ${isActive ? 'active' : ''}`}>
            
            <img 
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
              alt={movie.title}
              className="hero-backdrop"
            />
            
            {!isMobile && youtubeKey && isActive && (
              <div className="hero-video-wrapper">
                {/* THE FIX 2: Added playsinline=1 & disablekb=1 to aggressively block UI */}
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeKey}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&start=10&playsinline=1&disablekb=1`}
                  title="Trailer Background"
                  allow="autoplay; encrypted-media; fullscreen"
                  frameBorder="0"
                  className="hero-video-iframe"
                />
              </div>
            )}
            
            <div className="hero-overlay"></div>

            <div className="hero-content">
              <h1 className="hero-title">{movie.title || movie.name}</h1>
              <p className="hero-overview">
                {movie.overview?.length > 150 ? movie.overview.substring(0, 150) + "..." : movie.overview}
              </p>
              {/* THE FIX 3: Completely removed the "Play Now" button block from here */}
            </div>
          </div>
        );
      })}

      <div className="hero-indicators">
        {topFive.map((_, index) => (
          <div 
            key={index} 
            className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;