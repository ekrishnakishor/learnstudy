import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import LoginPage from "./containers/LoginPage/LoginPage";
import LandingPage from "./containers/LandingPage/LandingPage";
import SudokuGame from "./containers/SudokuGame/SudokuGame";
import LeaderboardPage from "./containers/LeaderboardPage/LeaderboardPage";
import ProfilePage from "./containers/ProfilePage/ProfilePage";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import DevConsole from "./components/DevConsole/DevConsole";
import ChessGame from "./containers/ChessGame/ChessGame";
import TriviaGame from "./containers/TriviaGame/TriviaGame";

function App() {
  return (
    <Router>
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* GLOBAL NAVBAR */}
        <Navbar />

        <DevConsole />
        {/* PAGE CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sudoku" element={<SudokuGame />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin-panel" element={<AdminDashboard />} />
            <Route path="/chess" element={<ChessGame />} />
            <Route path="/trivia" element={<TriviaGame />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
