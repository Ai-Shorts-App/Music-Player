import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Search as SearchIcon,
  Music,
  Heart,
  Layout,
  Settings,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_KEY = 'AIzaSyCH4LEjOIMab_5nPzd_2i3JrUUhHxZBO5s';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Initialize YouTube Player
  useEffect(() => {
    // 1. Define global callback
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API Ready');
      createPlayer();
    };

    const createPlayer = () => {
      if (playerRef.current) return; // Already created

      console.log('Creating YouTube Player...');
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          'autoplay': 0,
          'controls': 0,
          'disablekb': 1,
          'fs': 0,
          'rel': 0,
          'showinfo': 0,
          'origin': window.location.origin
        },
        events: {
          'onReady': (event) => {
            console.log('Player fully ready');
            setIsPlayerReady(true);
          },
          'onStateChange': (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
          },
          'onError': (error) => {
            console.error('YouTube Player Error:', error);
          }
        }
      });
    };

    // 2. Initial check if script already loaded
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // 3. Load script manually if not in index.html or if it failed
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleSearch = async (e) => {
    if (e.key !== 'Enter' || !searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery + ' song')}&type=video&videoCategoryId=10&key=${API_KEY}`
      );
      const data = await response.json();

      if (data.items) {
        setSearchResults(data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high.url
        })));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playSong = (song) => {
    setCurrentSong(song);

    if (playerRef.current && isPlayerReady) {
      console.log('Playing song:', song.title);
      playerRef.current.loadVideoById(song.id);
      playerRef.current.playVideo();
    } else {
      console.warn('Player not ready yet. Retrying in 1s...');
      // Fallback: try to find it on window if the ref failed
      if (window.YT && window.YT.get) {
        const p = window.YT.get('youtube-player');
        if (p && p.loadVideoById) {
          p.loadVideoById(song.id);
          p.playVideo();
          playerRef.current = p;
          setIsPlayerReady(true);
          return;
        }
      }
      setTimeout(() => playSong(song), 1000);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current || !currentSong) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (e) {
      console.error('Toggle play error:', e);
    }
  };

  return (
    <div className="app-container">
      {/* Hidden YouTube Player - using a small visible but hidden-ish element can be more reliable */}
      <div
        id="youtube-player"
        style={{
          position: 'absolute',
          top: '-1000px',
          left: '-1000px',
          width: '1px',
          height: '1px'
        }}
      ></div>

      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div className="music-icon-container" style={{ background: 'var(--accent-color)', padding: '8px', borderRadius: '12px', boxShadow: '0 0 15px var(--accent-glow)' }}>
            <Music size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Aura</h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className={`glass-button ${searchResults.length === 0 ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', gap: '12px' }}
            onClick={() => setSearchResults([])}
          >
            <Layout size={20} />
            <span>Discover</span>
          </button>
          <button
            className={`glass-button ${searchResults.length > 0 ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', gap: '12px' }}
          >
            <SearchIcon size={20} />
            <span>Search</span>
          </button>
          <button className="glass-button" style={{ justifyContent: 'flex-start', gap: '12px' }}>
            <Heart size={20} />
            <span>Favorites</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div className="glass-panel" style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isPlayerReady ? '#4ade80' : '#f87171' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></div>
              <span>Playback Engine: {isPlayerReady ? 'Online' : 'Initializing...'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon
              size={18}
              style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
            />
            <input
              type="text"
              className="glass-input"
              placeholder="Search for songs or artists..."
              style={{ paddingLeft: '54px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </header>

        <section style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', marginTop: '100px' }}
              >
                <div className="accent-glow-bg" style={{ width: '100px', height: '100px', background: 'var(--accent-color)', filter: 'blur(50px)', margin: 'auto' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Gathering melodies...</p>
              </motion.div>
            ) : searchResults.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}
              >
                {searchResults.map((song, index) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass-panel"
                    style={{ padding: '16px', cursor: 'pointer' }}
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent-color)' }}
                    onClick={() => playSong(song)}
                  >
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                      <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="hover-play" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                        <Play fill="white" size={32} />
                      </div>
                    </div>
                    <div
                      style={{ fontWeight: '600', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      dangerouslySetInnerHTML={{ __html: song.title }}
                    ></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{song.artist}</div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', marginTop: '100px' }}
              >
                <Music size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Your Stage is Ready</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Search for music to start your session</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Player Controls */}
        <div className="glass-panel" style={{
          height: '100px',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '20px',
          borderTop: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '30%' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {currentSong ? (
                <img src={currentSong.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Music size={24} style={{ opacity: 0.2 }} />
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{ fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                dangerouslySetInnerHTML={{ __html: currentSong ? currentSong.title : 'No track selected' }}
              ></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentSong ? currentSong.artist : 'Pick a song to play'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button className="glass-button" style={{ border: 'none', background: 'transparent' }}><SkipBack size={20} /></button>
              <button
                className="glass-button"
                onClick={togglePlay}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--accent-color)',
                  borderColor: 'var(--accent-color)',
                  boxShadow: '0 0 15px var(--accent-glow)'
                }}
              >
                {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
              </button>
              <button className="glass-button" style={{ border: 'none', background: 'transparent' }}><SkipForward size={20} /></button>
            </div>
            <div style={{ width: '100%', maxWidth: '400px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
              <motion.div
                animate={{ width: isPlaying ? '100%' : '0%' }}
                transition={{ duration: 180, ease: "linear" }} /* Roughly 3 min progress bar animation */
                style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '0%', background: 'white', borderRadius: '2px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '30%', justifyContent: 'flex-end' }}>
            <Volume2 size={20} style={{ opacity: 0.5 }} />
            <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: '70%', background: 'white', opacity: 0.5, borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
