import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CommunicationModal from '../../CommunicationModal/CommunicationModal'; 
import styles from './Navbar.module.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    setShowProfileMenu(false); 
  }, [location.pathname]);

  // Fetch the unread chat count with background POLLING
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return; 

      try {
        // Ensure this points to /users/chat/unread/
        const response = await axios.get(`${API_URL}/users/chat/unread/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error("Could not fetch unread messages", error);
      }
    };

    if (isLoggedIn) {
      // 1. Fetch immediately upon load/login
      fetchUnreadCount();
      
      // 2. Start checking every 15 seconds silently in the background
      const intervalId = setInterval(fetchUnreadCount, 15000);
      
      // 3. Cleanup the timer if the component unmounts or user logs out
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn, location.pathname]); 

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    navigate('/'); 
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0); 
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => navigate('/')}>
        LEARN&PLAY
      </div>
      
      {isLoggedIn ? (
        <div className={styles.userNav}>
          
          <button className={styles.iconBtn} title="Notifications">
            🔔<span className={styles.notificationBadge}></span>
          </button>
          
          <button className={styles.iconBtn} title="Messages" onClick={handleOpenChat}>
            💬
            {unreadCount > 0 && (
              <span className={styles.numberBadge}>{unreadCount}</span>
            )}
          </button>
          
          <div className={styles.profileMenuContainer}>
            <button 
              className={styles.iconBtn} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              👤
            </button>

            {showProfileMenu && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownItem} onClick={() => navigate('/profile')}>
                  <span>👤</span> My Profile
                </div>
                <div className={styles.dropdownItem} onClick={() => navigate('/leaderboard')}>
                  <span>🏆</span> Leaderboard
                </div>
                <div className={styles.dropdownItem} onClick={() => navigate('/hall-of-fame')}>
                  <span>👑</span> Hall of Fame
                </div>
                <div className={styles.dropdownDivider}></div>
                <div className={styles.dropdownItem} onClick={handleLogout} style={{ color: '#ff4b2b' }}>
                  <span>🚪</span> Log Out
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.headerButtons}>
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>Log In</button>
          <button className={styles.requestBtn} onClick={() => navigate('/login')}>Request Access</button>
        </div>
      )}

      <CommunicationModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </header>
  );
};

export default Navbar;