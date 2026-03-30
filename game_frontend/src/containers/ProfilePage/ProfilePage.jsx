import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          setError("Please log in to view your profile.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/games/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProfileData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setError("Your session expired. Redirecting to login...");
          setTimeout(() => navigate('/login'), 2000); 
        } else {
          setError("Could not load profile data. The server might be down.");
        }
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div className={styles.pageContainer}><div className={styles.loading}>Loading your stats...</div></div>;
  if (error) return <div className={styles.pageContainer}><div className={styles.error}>{error}</div></div>;
  if (!profileData) return null;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.dashboard}>
        
        <div className={styles.header}>
          <h1 className={styles.username}>{profileData.username}</h1>
          <p className={styles.email}>{profileData.email}</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{profileData.total_xp || 0}</div>
            <div className={styles.statLabel}>Total XP</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{profileData.games_played || 0}</div>
            <div className={styles.statLabel}>Games Played</div>
          </div>
        </div>

        <div className={styles.historySection}>
          <h2 className={styles.sectionTitle}>Recent Matches</h2>
          
          {profileData.recent_games && profileData.recent_games.length > 0 ? (
            <div className={styles.historyList}>
              {profileData.recent_games.map((game, index) => (
                <div key={index} className={styles.historyItem}>
                  <div className={styles.gameInfo}>
                    <span className={styles.gameTitle}>{game.game_title}</span>
                    <span className={styles.gameDate}>{game.date}</span>
                  </div>
                  <div className={styles.gameMetrics}>
                    <div className={styles.gameScore}>+{game.score} XP</div>
                    <div className={styles.gameTime}>{Math.floor(game.time_taken_seconds)} seconds</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>You haven't completed any games yet. Go play Sudoku!</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;