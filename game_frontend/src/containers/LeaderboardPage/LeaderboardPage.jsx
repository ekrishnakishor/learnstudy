import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './LeaderboardPage.module.css';

const LeaderboardPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // NEW: State to track the active filter (defaulting to 'week')
  const [timeframe, setTimeframe] = useState('week');

  const API_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true); // Ensure loading shows when switching tabs
      try {
        // UPDATED: Pass the timeframe as a query parameter
        const response = await axios.get(`${API_URL}/games/leaderboard/?timeframe=${timeframe}`);
        
        // UPDATED: Look inside the 'leaderboard' key from our Django response
        setPlayers(response.data.leaderboard);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setError("Could not load the leaderboard. The server might be down.");
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]); // NEW: Re-run this effect whenever the timeframe changes!

  const getRankClass = (index) => {
    if (index === 0) return styles.rank1;
    if (index === 1) return styles.rank2;
    if (index === 2) return styles.rank3;
    return '';
  };

  // Helper to dynamically change the subtitle based on the filter
  const getSubtitle = () => {
    if (timeframe === 'all') return 'Top 10 All-Time Highest XP';
    if (timeframe === 'month') return 'Top 10 Highest XP This Month';
    return 'Top 10 Highest XP This Week';
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Hall of Fame</h1>
      <p className={styles.subtitle}>{getSubtitle()}</p>

   {/* The Filter Buttons */}
      <div className={styles.filterControls}>
        <button 
          className={`${styles.filterBtn} ${timeframe === 'all' ? styles.activeFilterBtn : ''}`}
          onClick={() => setTimeframe('all')}
        >
          All Time
        </button>
        <button 
          className={`${styles.filterBtn} ${timeframe === 'month' ? styles.activeFilterBtn : ''}`}
          onClick={() => setTimeframe('month')}
        >
          This Month
        </button>
        <button 
          className={`${styles.filterBtn} ${timeframe === 'week' ? styles.activeFilterBtn : ''}`}
          onClick={() => setTimeframe('week')}
        >
          This Week
        </button>
      </div>

      <div className={styles.boardContainer}>
        {loading && <div className={styles.loading}>Fetching the top players...</div>}
        {error && <div className={styles.error}>{error}</div>}
        
        {!loading && !error && players.length === 0 && (
          <div className={styles.empty}>No scores yet for this timeframe. Be the first!</div>
        )}

        {!loading && !error && players.map((player, index) => (
          <div key={index} className={`${styles.row} ${getRankClass(index)}`}>
            <div className={styles.rankAndName}>
              <span className={styles.rank}>#{index + 1}</span>
              <span className={styles.name}>{player.username || `User ${index}`}</span>
            </div>
            {/* UPDATED: We now use player.xp instead of player.weekly_xp */}
            <span className={styles.score}>{player.xp || 0} XP</span>
          </div>
        ))}
      </div>

      <Link to="/" className={styles.backBtn}>
        &larr; Back to Games
      </Link>
    </div>
  );
};

export default LeaderboardPage;