import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './TriviaGame.module.css';

// Sample Pool of questions (Move this to Django later!)
const QUESTION_POOL = [
  { question: "What is the primary function of a ribosome in a cell?", options: ["Energy production", "Protein synthesis", "Waste disposal", "DNA replication"], answer: "Protein synthesis" },
  { question: "In React, what hook is used to handle side effects?", options: ["useState", "useEffect", "useContext", "useReducer"], answer: "useEffect" },
  { question: "How many valence electrons does a Carbon atom have?", options: ["2", "4", "6", "8"], answer: "4" },
  { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: "Canberra" },
  { question: "Which HTTP method is typically used to update an existing resource?", options: ["GET", "POST", "PUT", "DELETE"], answer: "PUT" },
  { question: "What type of bond involves the sharing of electron pairs between atoms?", options: ["Ionic", "Hydrogen", "Covalent", "Metallic"], answer: "Covalent" },
  { question: "Who wrote the play 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], answer: "William Shakespeare" },
  { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Endoplasmic Reticulum", "Golgi Apparatus"], answer: "Mitochondria" },
  { question: "What does CSS stand for?", options: ["Computer Style Sheets", "Creative Style System", "Cascading Style Sheets", "Colorful Style Sheets"], answer: "Cascading Style Sheets" },
  { question: "Which functional group is characteristic of alcohols?", options: ["-COOH", "-OH", "-NH2", "-CHO"], answer: "-OH" },
  { question: "What is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], answer: "Jupiter" },
  { question: "Which HTML tag is used for the largest heading?", options: ["<heading>", "<h6>", "<head>", "<h1>"], answer: "<h1>" },
];

const TriviaGame = () => {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'finished'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Timers and Scoring
  const [questionTimer, setQuestionTimer] = useState(20);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  // UI States
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const navigate = useNavigate();
// const API_URL = 'http://127.0.0.1:8000/api';https://learnstudy.vercel.app/api
  const API_URL = 'https://learnstudy-gzii.onrender.com/api'; //https://learnstudy.vercel.app/api

  // --- ⏱️ 20-SECOND QUESTION TIMER ---
  useEffect(() => {
    if (gameState !== 'playing' || isChecking) return;

    const timer = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, isChecking, currentIndex]);

  const handleTimeOut = () => {
    setIsChecking(true);
    // 20 second penalty for letting the clock run out
    setTotalTimeElapsed(prev => prev + 20);
    setTimeout(() => goToNextQuestion(), 2000);
  };

  const startGame = () => {
    // Randomly select 10 questions from the pool
    const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 10));
    
    setCurrentIndex(0);
    setTotalTimeElapsed(0);
    setCorrectCount(0);
    setQuestionTimer(20);
    setGameState('playing');
  };

  const handleOptionClick = (option) => {
    if (isChecking) return;
    setIsChecking(true);
    setSelectedOption(option);

    const currentQ = questions[currentIndex];
    const isCorrect = option === currentQ.answer;

    // Calculate time taken for this specific question
    const timeTaken = 20 - questionTimer;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setTotalTimeElapsed(prev => prev + timeTaken);
    } else {
      // 10 second penalty for a wrong answer to prevent random guessing
      setTotalTimeElapsed(prev => prev + timeTaken + 10);
    }

    // Wait 1.5 seconds so they can see if they got it right/wrong, then move on
    setTimeout(() => {
      goToNextQuestion();
    }, 1500);
  };

  const goToNextQuestion = () => {
    setSelectedOption(null);
    setIsChecking(false);
    
    if (currentIndex + 1 < 10) {
      setCurrentIndex(prev => prev + 1);
      setQuestionTimer(20);
    } else {
      setGameState('finished');
      submitScoreToBackend();
    }
  };

  const submitScoreToBackend = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Sending the total time (lower is better) to the backend
      await axios.post(`${API_URL}/games/submit/trivia/`, 
        { 
          time_taken_seconds: totalTimeElapsed,
          correct_answers: correctCount
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to submit trivia score:", error);
    }
  };

  // --- RENDER START SCREEN ---
  if (gameState === 'start') {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <h1 className={styles.title}>Knowledge Rush</h1>
          <p className={styles.subtitle}>10 Questions. 20 Seconds Each. Speed is everything.</p>
          <ul className={styles.rulesList}>
            <li>✅ Answer correctly to lock in your time.</li>
            <li>❌ Wrong answers add a 10-second penalty.</li>
            <li>⏱️ Running out of time adds a 20-second penalty.</li>
            <li>🏆 The lowest total time takes the #1 spot on the Leaderboard.</li>
          </ul>
          <button className={styles.startBtn} onClick={startGame}>Start Quiz</button>
          <button className={styles.quitLink} onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  // --- RENDER FINISHED SCREEN ---
  if (gameState === 'finished') {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <h1 className={styles.title}>Quiz Complete!</h1>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <h3>Score</h3>
              <p>{correctCount} / 10</p>
            </div>
            <div className={styles.statBox}>
              <h3>Total Time</h3>
              <p className={styles.highlightTime}>{totalTimeElapsed}s</p>
            </div>
          </div>
          <p className={styles.subtitle} style={{marginTop: '20px'}}>
            Your score has been submitted to the Leaderboard.
          </p>
          <button className={styles.startBtn} onClick={startGame}>Play Again</button>
          <button className={styles.quitLink} onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  // --- RENDER PLAYING SCREEN ---
  const currentQ = questions[currentIndex];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.gameHeader}>
        <span className={styles.qCount}>Question {currentIndex + 1} of 10</span>
        <div className={`${styles.timerBadge} ${questionTimer <= 5 ? styles.danger : ''}`}>
          ⏱️ 00:{questionTimer.toString().padStart(2, '0')}
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.questionText}>{currentQ.question}</h2>
        
        <div className={styles.optionsGrid}>
          {currentQ.options.map((option, idx) => {
            let btnClass = styles.optionBtn;
            
            if (isChecking) {
              if (option === currentQ.answer) {
                btnClass = `${styles.optionBtn} ${styles.correct}`;
              } else if (option === selectedOption) {
                btnClass = `${styles.optionBtn} ${styles.wrong}`;
              } else {
                btnClass = `${styles.optionBtn} ${styles.disabled}`;
              }
            }

            return (
              <button 
                key={idx} 
                className={btnClass}
                onClick={() => handleOptionClick(option)}
                disabled={isChecking}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
      
      <button className={styles.quitLink} style={{marginTop: '30px'}} onClick={() => navigate('/')}>Quit Game</button>
    </div>
  );
};

export default TriviaGame;