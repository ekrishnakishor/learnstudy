import React, { useState, useEffect, useRef } from 'react';
import styles from './DevConsole.module.css';

const DevConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('console'); // 'console' or 'updates'
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Hardcoded Dev Updates for now (You can move this to the database later!)
  const devUpdates = [
    { date: '2026-03-05', text: 'Added live polling for student chat notifications.' },
    { date: '2026-03-05', text: 'Admin Command Center implemented with split-pane UI.' },
    { date: '2026-02-26', text: 'Sudoku logic and Leaderboard backend complete.' },
  ];

  // The Magic Trick: Intercepting console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    const handleLog = (type, ...args) => {
      // Convert objects to strings so they don't break React
      const parsedArgs = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev, { id: Date.now() + Math.random(), type, text: parsedArgs }]);
    };

    // Override the default console functions
    console.log = (...args) => {
      handleLog('info', ...args);
      originalLog(...args); // Keep printing to the real browser console too!
    };

    console.error = (...args) => {
      handleLog('error', ...args);
      originalError(...args);
    };

    // Cleanup function to restore normal console behavior if component unmounts
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Auto-scroll the terminal to the bottom
  useEffect(() => {
    if (isOpen && activeTab === 'console') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen, activeTab]);

  return (
    <div className={styles.devConsoleWrapper}>
      {/* The Floating Icon */}
      <button 
        className={styles.toggleBtn} 
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Developer Mode"
      >
        💻
      </button>

      {/* The Console Window */}
      {isOpen && (
        <div className={styles.consoleWindow}>
          <div className={styles.header}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'console' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('console')}
              >
                Terminal
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'updates' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('updates')}
              >
                Dev Updates
              </button>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>&times;</button>
          </div>

          <div className={styles.contentArea}>
            {activeTab === 'console' ? (
              <div className={styles.terminal}>
                <div className={styles.terminalOutput}>
                  <p className={styles.logInfo}>&gt; System initialized. Awaiting logs...</p>
                  {logs.map((log) => (
                    <p key={log.id} className={log.type === 'error' ? styles.logError : styles.logInfo}>
                      <span className={styles.timestamp}>[{new Date().toLocaleTimeString()}]</span> {log.text}
                    </p>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            ) : (
              <div className={styles.updatesList}>
                {devUpdates.map((update, idx) => (
                  <div key={idx} className={styles.updateCard}>
                    <span className={styles.updateDate}>{update.date}</span>
                    <p className={styles.updateText}>{update.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevConsole;