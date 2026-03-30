import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';
import styles from './ChessGame.module.css';

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState(null); 
  const [hasStarted, setHasStarted] = useState(false);
  
  // Timers
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Status & Tutorial
  const [status, setStatus] = useState("White's turn");
  const [tutorialText, setTutorialText] = useState("Welcome to Learn & Play! Make a move to get started.");
  const [isGameOver, setIsGameOver] = useState(false);

  // Tap-to-move state
  const [moveFrom, setMoveFrom] = useState("");

  const navigate = useNavigate();

  // --- ⏱️ TIMER LOGIC ---
  useEffect(() => {
    if (!hasStarted || !isTimerActive || isGameOver) return;

    const timer = setInterval(() => {
      if (game.turn() === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) { handleTimeout('w'); return 0; }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) { handleTimeout('b'); return 0; }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, isTimerActive, isGameOver, game]);

  // --- 🤖 BOT LOGIC ---
  useEffect(() => {
    if (hasStarted && !isGameOver && (gameMode === 'blitz_bot' || gameMode === 'rapid_bot') && game.turn() === 'b') {
      const makeBotMove = () => {
        const possibleMoves = game.moves({ verbose: true });
        if (possibleMoves.length === 0) return;

        const captures = possibleMoves.filter(m => m.flags.includes('c') || m.flags.includes('e'));
        const moveToPlay = captures.length > 0 
          ? captures[Math.floor(Math.random() * captures.length)] 
          : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        const gameCopy = new Chess(game.fen());
        gameCopy.move(moveToPlay);
        setGame(gameCopy);
        checkGameOver(gameCopy);
      };

      const botTimer = setTimeout(makeBotMove, 600);
      return () => clearTimeout(botTimer);
    }
  }, [game, hasStarted, isGameOver, gameMode]);

  // --- 🏁 GAME OVER CHECKS ---
  const handleTimeout = (colorWhoRanOut) => {
    setIsGameOver(true);
    setIsTimerActive(false);
    const winner = colorWhoRanOut === 'w' ? 'Black' : 'White';
    setStatus(`⏱️ Time's up! ${winner} wins.`);
    submitScore(colorWhoRanOut === 'w' ? 'loss' : 'win');
  };

  const checkGameOver = (currentGame) => {
    if (currentGame.isCheckmate()) {
      setIsGameOver(true);
      setIsTimerActive(false);
      const winner = currentGame.turn() === 'w' ? 'Black' : 'White';
      setStatus(`🏆 Checkmate! ${winner} wins.`);
      if (gameMode.includes('bot')) submitScore(winner === 'White' ? 'win' : 'loss');
    } else if (currentGame.isDraw() || currentGame.isStalemate()) {
      setIsGameOver(true);
      setIsTimerActive(false);
      setStatus("🤝 Game ended in a draw.");
      if (gameMode.includes('bot')) submitScore('draw');
    } else if (currentGame.isCheck()) {
      setStatus(`⚠️ Check! ${currentGame.turn() === 'w' ? 'White' : 'Black'} is under attack.`);
    } else {
      setStatus(`${currentGame.turn() === 'w' ? 'White' : 'Black'}'s turn`);
    }
  };

  const generateTutorialTip = (move) => {
    if (move.flags.includes('c')) return "💥 Great capture! Taking your opponent's pieces gives you a material advantage.";
    if (move.flags.includes('k') || move.flags.includes('q')) return "🏰 Excellent! Castling gets your King to safety and connects your Rooks.";
    if (move.piece === 'n' || move.piece === 'b') return "🛡️ Good development. Knights and Bishops belong in the action early on.";
    if (move.piece === 'p' && (move.to[1] === '4' || move.to[1] === '5')) return "⚔️ Controlling the center of the board with your pawns is a strong strategy.";
    return "👍 Solid move. Keep watching your opponent's threats.";
  };

  // --- ♟️ CORE MOVE EXECUTION ---
  const executeMove = (sourceSquare, targetSquare, pieceString) => {
    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: pieceString ? pieceString[1].toLowerCase() : 'q'
      });

      if (move === null) throw new Error("Illegal");

      setGame(gameCopy);
      checkGameOver(gameCopy);

      if (gameMode === 'classic_learn') {
        setTutorialText(generateTutorialTip(move));
      }
      return true;
    } catch (e) {
      if (gameMode === 'classic_learn') {
        setTutorialText("❌ Illegal Move! Remember: pieces can't jump over others (except Knights), and you cannot leave your King in check.");
      }
      return false;
    }
  };

  // --- 🖱️ INTERACTION HANDLERS (TAP TO MOVE ONLY) ---
  const onSquareClick = (square) => {
    if (isGameOver || (gameMode.includes('bot') && game.turn() === 'b')) return;

    if (!moveFrom) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
      }
      return;
    }

    if (square === moveFrom) {
      setMoveFrom("");
      return;
    }

    executeMove(moveFrom, square);
    setMoveFrom(""); 
  };

  const onPieceClick = (piece, square) => {
    onSquareClick(square);
  };

  const customSquareStyles = {
    ...(moveFrom && { [moveFrom]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' } })
  };

  // --- 🚀 START & SUBMIT ---
  const startGame = (mode, timeInSeconds) => {
    setGameMode(mode);
    setWhiteTime(timeInSeconds);
    setBlackTime(timeInSeconds);
    setIsTimerActive(timeInSeconds > 0);
    setHasStarted(true);
    setGame(new Chess());
    setIsGameOver(false);
    setStatus("White's turn");
    setMoveFrom("");
    setTutorialText("Welcome to Learn & Play! Control the center to start.");
  };

  const submitScore = async (result) => {
    console.log(`Sending game result to Django: ${result}`);
  };

  const handleEndGame = () => {
    if (window.confirm("Quit Game? Progress will be lost.")) navigate('/');
  };

  if (!hasStarted) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.startScreen}>
          <h1 className={styles.title}>Grandmaster</h1>
          <p className={styles.subtitle}>Select your game mode</p>
          
          <div className={styles.modeGrid}>
            <button className={styles.modeBtn} onClick={() => startGame('blitz_bot', 300)}>
              <h3>⚡ Blitz (5 Min)</h3>
              <p>Play against the Computer</p>
            </button>
            <button className={styles.modeBtn} onClick={() => startGame('rapid_bot', 600)}>
              <h3>⏱️ Rapid (10 Min)</h3>
              <p>Play against the Computer</p>
            </button>
            <button className={`${styles.modeBtn} ${styles.learnBtn}`} onClick={() => startGame('classic_learn', 0)}>
              <h3>🎓 Learn & Play</h3>
              <p>Untimed + Interactive Coach</p>
            </button>
            <button className={`${styles.modeBtn} ${styles.friendBtn}`} onClick={() => startGame('classic_friend', 0)}>
              <h3>🤝 Pass & Play</h3>
              <p>Local 2-Player Match</p>
            </button>
          </div>
          <button className={styles.quitLink} onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.gameContent}>
        
        <div className={styles.header}>
          <h1 className={styles.title} style={{ fontSize: '2.2rem' }}>Grandmaster</h1>
          <button className={styles.quitBtn} onClick={handleEndGame}>Quit</button>
        </div>

        {/* Top Player (Black) */}
        <div className={styles.playerBar}>
          <span className={styles.playerName}>{gameMode.includes('bot') ? '🤖 Computer' : 'Black'}</span>
          {isTimerActive && (
            <span className={`${styles.timer} ${blackTime < 60 ? styles.lowTime : ''}`}>
              {formatTime(blackTime)}
            </span>
          )}
        </div>

        {/* The Chessboard */}
        <div className={styles.boardWrapper}>
          <Chessboard 
            position={game.fen()} 
            onSquareClick={onSquareClick} 
            onPieceClick={onPieceClick} 
            arePiecesDraggable={false} /* <--- Completely disabled dragging */
            customSquareStyles={customSquareStyles} 
            boardOrientation="white"
            customDarkSquareStyle={{ backgroundColor: '#4facfe' }}
            customLightSquareStyle={{ backgroundColor: '#e0f7fa' }}
            animationDuration={200}
          />
        </div>

        {/* Bottom Player (White) */}
        <div className={styles.playerBar}>
          <span className={styles.playerName}>You (White)</span>
          {isTimerActive && (
            <span className={`${styles.timer} ${whiteTime < 60 ? styles.lowTime : ''}`}>
              {formatTime(whiteTime)}
            </span>
          )}
        </div>

        {/* Game Status & Coach Area */}
        <div className={styles.statusPanel}>
          <h3 className={styles.statusText}>{status}</h3>
          
          {gameMode === 'classic_learn' && (
            <div className={styles.coachBox}>
              <strong>🎓 Coach says:</strong>
              <p>{tutorialText}</p>
            </div>
          )}

          {isGameOver && (
            <button className={styles.restartBtn} onClick={() => setHasStarted(false)}>
              Play Again
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChessGame;