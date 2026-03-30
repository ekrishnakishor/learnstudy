import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGameClick = (route) => {
    // Check local storage directly for the VIP pass
    if (localStorage.getItem('access_token')) {
      navigate(route);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* HERO SECTION */}
      {/* <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Master Subjects Through Play</h1>
        <p className={styles.heroSubtitle}>
          Join the ultimate platform where learning meets competitive gaming. 
          Challenge your friends, climb the leaderboard, and enter the Hall of Fame.
        </p>
      </section> */}

      {/* GAMES SECTION */}
      <section className={styles.gameSection}>
        <h2 className={styles.sectionTitle}>Available Games</h2>
        <div className={styles.grid}>
          
          {/* SUDOKU */}
          <div className={styles.gameCard} onClick={() => handleGameClick('/sudoku')}>
            <div className={styles.gameIcon}>🧩</div>
            <h3>Sudoku Sprint</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
              Single Player • Logic • Timed
            </p>
          </div>

          {/* CHESS */}
          <div className={styles.gameCard} onClick={() => handleGameClick('/chess')}>
            <div className={styles.gameIcon}>♟️</div>
            <h3>Grandmaster</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
              Bot & Local Multiplayer • Strategy • Multi-mode
            </p>
          </div>

          {/* --- NEW TRIVIA GAME --- */}
          <div className={styles.gameCard} onClick={() => handleGameClick('/trivia')}>
            <div className={styles.gameIcon}>🧠</div>
            <h3>Knowledge Rush</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
              Single Player • Fast-Paced • Quiz
            </p>
          </div>

          {/* TUG OF WAR - COMING SOON */}
          <div className={`${styles.gameCard} ${styles.comingSoon}`} onClick={() => handleGameClick('/tug-of-war')}>
            <div className={styles.gameIcon}>🪢</div>
            <h3>Tug of War</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
              Multiplayer • Real-Time • Knowledge
            </p>
            <div style={{ marginTop: '15px', color: '#ff4b2b', fontWeight: 'bold' }}>
              Coming Soon
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default LandingPage;