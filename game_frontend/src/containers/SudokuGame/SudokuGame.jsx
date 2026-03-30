import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './SudokuGame.module.css';
import { generateSudoku } from '../../utils/sudokuGenerator';

// Helper to format seconds into MM:SS
const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const SudokuGame = () => {
  const [user, setUser] = useState(null); 
  const [hasStarted, setHasStarted] = useState(false); // NEW: Tracks if they clicked Start
  const [initialBoard, setInitialBoard] = useState([]);
  const [board, setBoard] = useState([]);
  const [solutionBoard, setSolutionBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("Ready to play?");
  const [isChecking, setIsChecking] = useState(false);
  const [errorCells, setErrorCells] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const navigate = useNavigate();
 // const API_URL = 'http://127.0.0.1:8000/api';https://learnstudy.vercel.app/api
  const API_URL = 'https://learnstudy-gzii.onrender.com/api'; //https://learnstudy.vercel.app/api

  // --- 🕵️ FETCH USER PROFILE ---
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/users/me/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error("Could not fetch user profile", error);
        }
      }
    };
    fetchUser();
  }, []);

  // --- 💾 LOAD SAVED GAME (IF EXISTS) ---
  useEffect(() => {
    const savedBoard = localStorage.getItem('sudoku_current_board');
    const savedInitial = localStorage.getItem('sudoku_initial_board');
    const savedSolution = localStorage.getItem('sudoku_solution');
    const localStartTime = localStorage.getItem('sudoku_local_start');

    // Only resume automatically if there is an active game in progress
    if (savedBoard && savedInitial && savedSolution && localStartTime) {
      setInitialBoard(JSON.parse(savedInitial));
      setBoard(JSON.parse(savedBoard));
      setSolutionBoard(JSON.parse(savedSolution));
      
      const savedSession = localStorage.getItem('sudoku_session_id');
      if (savedSession) setSessionId(savedSession);
      
      const passedSeconds = Math.floor((Date.now() - parseInt(localStartTime)) / 1000);
      setElapsedTime(passedSeconds);
      
      setHasStarted(true); // Bypass the start screen
      setStatus("Game Resumed! The board is restored.");
    }
  }, []);

 // --- ⏱️ THE LIVE TICKING TIMER ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasStarted && !isCompleted) {
        const startTime = localStorage.getItem('sudoku_local_start');
        
        if (startTime) {
          const now = Date.now();
          const passedSeconds = Math.floor((now - parseInt(startTime)) / 1000);
          setElapsedTime(passedSeconds);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isCompleted]); 

  const startNewGame = async () => {
    setHasStarted(true); // Hide the start screen
    setStatus("Generating secure timer...");
    
    const { puzzle, solution } = generateSudoku(45);
    
    setInitialBoard([...puzzle]);
    setBoard([...puzzle]);
    setSolutionBoard([...solution]);
    setSelectedCell(null);
    setErrorCells([]);
    setIsCompleted(false);
    setElapsedTime(0);

    localStorage.setItem('sudoku_initial_board', JSON.stringify(puzzle));
    localStorage.setItem('sudoku_current_board', JSON.stringify(puzzle));
    localStorage.setItem('sudoku_solution', JSON.stringify(solution));
    localStorage.setItem('sudoku_local_start', Date.now().toString()); 
    localStorage.removeItem('sudoku_session_id'); 

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_URL}/games/start/`, 
        { game_title: 'Sudoku' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newSessionId = response.data.session_id;
      setSessionId(newSessionId);
      localStorage.setItem('sudoku_session_id', newSessionId);
      
      setStatus("Game Active! Beat the clock.");
    } catch (error) {
      console.error("Timer API Error:", error);
      setStatus("Offline Mode (Timer not connected, but board is saved!).");
    }
  };

  // --- 🚪 END GAME / QUIT FUNCTION ---
  const handleEndGame = () => {
    const confirmQuit = window.confirm("Are you sure you want to quit? Your progress will be lost, but no XP will be affected.");
    
    if (confirmQuit) {
      localStorage.removeItem('sudoku_initial_board');
      localStorage.removeItem('sudoku_current_board');
      localStorage.removeItem('sudoku_solution');
      localStorage.removeItem('sudoku_session_id');
      localStorage.removeItem('sudoku_local_start');
      navigate('/');
    }
  };

  // --- 🎮 HANDLE INPUTS ---
  const handleCellClick = (index) => {
    if (isCompleted) return; 
    if (initialBoard[index] === 0) {
      setSelectedCell(index);
      if (errorCells.includes(index)) {
        setErrorCells(errorCells.filter(cellIdx => cellIdx !== index));
      }
    }
  };

  const handleNumberInput = (number) => {
    if (isCompleted || selectedCell === null) return;
    
    const newBoard = [...board];
    newBoard[selectedCell] = number === 'C' ? 0 : number;
    
    setBoard(newBoard);
    localStorage.setItem('sudoku_current_board', JSON.stringify(newBoard));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedCell !== null && !isCompleted) {
        if (e.key >= 1 && e.key <= 9) {
          handleNumberInput(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          handleNumberInput('C');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board, isCompleted]);

  // --- 💻 ADMIN AUTOFILL FUNCTION ---
  const handleAdminAutofill = () => {
    const timeInput = window.prompt("💻 ADMIN AUTOFILL\nEnter simulated completion time in seconds (or leave blank to just fill the board):", "45");
    
    if (timeInput === null) return; 

    setBoard([...solutionBoard]);
    localStorage.setItem('sudoku_current_board', JSON.stringify(solutionBoard));
    setErrorCells([]);

    const simulatedTime = parseInt(timeInput, 10);
    if (!isNaN(simulatedTime)) {
      setElapsedTime(simulatedTime);
      setIsCompleted(true);
      setStatus("🎉 ADMIN CHEAT: Submitting simulated time...");
      submitGameToBackend(simulatedTime);
    } else {
      setStatus("Board filled via Admin Cheat! Click Submit when ready.");
    }
  };

  // --- 🎯 THE CHECKER & SUBMIT FUNCTION ---
  const handleCheckNow = () => {
    if (isChecking || isCompleted) return; 
    
    setIsChecking(true);
    const newErrors = [];
    let filledCount = 0;

    board.forEach((val, idx) => {
      if (val !== 0) {
        filledCount++;
        if (val !== solutionBoard[idx]) {
          newErrors.push(idx);
        }
      }
    });

    setErrorCells(newErrors);

    if (newErrors.length > 0) {
      setStatus(`⚠️ Found ${newErrors.length} mistake(s). 3-second penalty active.`);
      setTimeout(() => {
        setIsChecking(false);
        setStatus("Game Active! Beat the clock.");
      }, 3000); 
    } else if (filledCount === 81) {
      setStatus("🎉 PERFECT! Submitting your time to the Leaderboard...");
      setIsCompleted(true);
      submitGameToBackend();
    } else {
      setStatus("Looking good so far! Keep going. 3-second cooldown active.");
      setTimeout(() => {
        setIsChecking(false);
        setStatus("Game Active! Beat the clock.");
      }, 3000); 
    }
  };

  // --- 🚀 SUBMIT TO DJANGO ---
  const submitGameToBackend = async (cheatTime = null) => {
    try {
      const token = localStorage.getItem('access_token');
      const payload = cheatTime ? { cheat_time: cheatTime } : {};

      const response = await axios.post(`${API_URL}/games/submit/${sessionId}/`, 
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const finalTime = response.data.time_taken_seconds;
      
      setTimeout(() => {
        setStatus(`Official Time: ${finalTime.toFixed(1)}s! Score: ${response.data.score}`);
        localStorage.removeItem('sudoku_initial_board');
        localStorage.removeItem('sudoku_current_board');
        localStorage.removeItem('sudoku_solution');
        localStorage.removeItem('sudoku_session_id');
        localStorage.removeItem('sudoku_local_start');
      }, 1500);
      
    } catch (error) {
      console.error("Failed to submit score:", error);
      setStatus("Error submitting time to the server.");
    }
  };

  // --- THE PRE-GAME START SCREEN ---
  if (!hasStarted) {
    return (
      <div className={styles.pageContainer} style={{ justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h1 className={styles.title} style={{ fontSize: '3rem', marginBottom: '10px' }}>Sudoku Sprint</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.2rem', marginBottom: '30px' }}>
          Ready to test your logic?
        </p>
        <button 
          onClick={startNewGame}
          style={{
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            color: '#0f0c29', padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold',
            border: 'none', borderRadius: '30px', cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(0, 242, 254, 0.3)', transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Start Game
        </button>
      </div>
    );
  }

  // --- LOADING SCREEN (Briefly shows while generating board) ---
  if (board.length === 0) return <div className={styles.pageContainer}><h1>Loading Puzzle...</h1></div>;

  // Dynamically check if all boxes have a number in them
  const isBoardFull = board.every(val => val !== 0);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title} style={{ margin: '0 auto 10px auto', textAlign: 'center' }}>Sudoku Sprint</h1>
        <p className={styles.status} style={{ textAlign: 'center' }}>{status}</p>
        <div className={styles.timer} style={{ margin: '0 auto' }}>{formatTime(elapsedTime)}</div>
      </div>

      {/* --- SECRET ADMIN BUTTON --- */}
      {user?.is_staff && !isCompleted && (
        <button 
          onClick={handleAdminAutofill} 
          style={{
            background: 'rgba(255, 75, 43, 0.9)', color: 'white', padding: '10px 20px', 
            borderRadius: '8px', border: 'none', cursor: 'pointer',
            margin: '0 auto 15px auto', display: 'block', fontWeight: 'bold', fontSize: '14px',
            boxShadow: '0 4px 15px rgba(255, 75, 43, 0.4)'
          }}
        >
          ⚡ Admin Autofill
        </button>
      )}

      <div className={styles.boardContainer}>
        <div className={styles.grid}>
          {board.map((cellValue, index) => {
            const isFixed = initialBoard[index] !== 0;
            const isSelected = selectedCell === index;
            const isError = errorCells.includes(index); 
            
            return (
              <div
                key={index}
                className={`
                  ${styles.cell} 
                  ${isFixed ? styles.cellFixed : ''} 
                  ${isSelected ? styles.cellSelected : ''}
                  ${isError ? styles.cellError : ''} 
                `}
                onClick={() => handleCellClick(index)}
              >
                {cellValue !== 0 ? cellValue : ''}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.numpad}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} className={styles.numBtn} onClick={() => handleNumberInput(num)}>
              {num}
            </button>
          ))}
          <button className={styles.numBtn} style={{ background: 'rgba(255, 75, 43, 0.2)', width: 'auto', padding: '0 15px' }} onClick={() => handleNumberInput('C')}>
            Clear
          </button>
        </div>

        {isCompleted ? (
          <button className={styles.actionBtn} onClick={startNewGame} style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', marginTop: '15px' }}>
            Play Again (New Board)
          </button>
        ) : (
          <button 
            className={`${styles.checkBtn} ${isChecking ? styles.checkBtnCooldown : ''}`} 
            onClick={handleCheckNow}
            style={{ marginTop: '15px' }}
          >
            {isChecking ? 'Penalty Active...' : (isBoardFull ? 'Submit' : 'Check')}
          </button>
        )}

        {/* --- RELOCATED QUIT BUTTON --- */}
        <button 
          onClick={handleEndGame}
          style={{
            background: 'transparent', color: 'rgba(255, 255, 255, 0.4)', border: 'none',
            padding: '10px', marginTop: '15px', cursor: 'pointer', transition: 'all 0.2s ease',
            textDecoration: 'underline', fontSize: '0.9rem', width: '100%'
          }}
          onMouseOver={(e) => { e.target.style.color = '#ff4b2b'; }}
          onMouseOut={(e) => { e.target.style.color = 'rgba(255, 255, 255, 0.4)'; }}
        >
          Quit Game
        </button>

      </div>
    </div>
  );
};

export default SudokuGame;