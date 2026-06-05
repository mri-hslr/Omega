// FILE: src/components/HeroSlider.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import '../index.css';

const HeroSlider = ({ movies, setid, setactive, selectedMedia }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState({});

  // 1. Slice the movies, then create a STABLE string of IDs. 
  // This prevents React from getting stuck in an infinite fetch loop!
  const topFive = movies.slice(0, 5);
  const movieIdsString = topFive.map(m => m.id).join(',');

  // 2. Detect Screen Size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3. Fetch Real Trailers (Fixed Dependency Loop)
  useEffect(() => {
    if (topFive.length === 0) return;

    const fetchTrailers = async () => {
      const keys = {};
      
      await Promise.all(topFive.map(async (movie) => {
        try {
          const res = await api.get('/details', { 
            params: { id: movie.id, selectedMedia: selectedMedia || 'movie' } 
          });
          
          // DEBUGGING LOGS: Let's see what the backend is actually sending!
          console.log(`Checking backend data for: ${movie.title || movie.name}`);
          console.log(`Did we get videos?`, res.data.videos);

          const videos = res.data.videos?.results || [];
          const officialTrailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                               || videos.find(v => v.site === 'YouTube');
          
          if (officialTrailer) {
            console.log(`SUCCESS! Found key for ${movie.title}: ${officialTrailer.key}`);
            keys[movie.id] = officialTrailer.key;
          } else {
            console.warn(`No YouTube trailer found in the data for ${movie.title}`);
          }
        } catch (err) {
          console.error(`API Call Failed for ${movie.id}`, err);
        }
      }));

      setTrailerKeys(keys);
    };

    fetchTrailers();
    // THE FIX: We now depend on the stable string of IDs, not the shifting array!
  }, [movieIdsString, selectedMedia]); 

  // 4. The Slideshow Timer
  useEffect(() => {
    if (topFive.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % topFive.length);
    }, 8000);
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
            
            {/* THE FIX: ALWAYS render the high-res image as the bottom layer. 
                This acts as a beautiful placeholder while YouTube is buffering! */}
            <img 
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
              alt={movie.title}
              className="hero-backdrop"
            />
            
            {/* THE FIX: Render video ON TOP of the image. 
                Using youtube-nocookie.com to bypass Brave Browser shields! */}
            {!isMobile && youtubeKey && isActive && (
              <div className="hero-video-wrapper">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeKey}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&start=10`}
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
              
              <div className="hero-buttons">
                <button className="hero-play-btn" onClick={() => { setid(movie.id); setactive('player'); }}>
                  ▶ Play Now
                </button>
              </div>
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