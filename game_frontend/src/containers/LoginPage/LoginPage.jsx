import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // Toggle between 'login' and 'request' forms
  const [isLoginView, setIsLoginView] = useState(true);
  
  // State for forms
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '', reason: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Django API base URL (Update this if you deploy!)
// const API_URL = 'http://127.0.0.1:8000/api';https://learnstudy.vercel.app/api
  const API_URL = 'https://learnstudy-gzii.onrender.com/api'; //https://learnstudy.vercel.app/api

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(''); // Clear errors when typing
  };

  // --- 🔐 HANDLE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/token/`, {
        username: formData.username,
        password: formData.password
      });
      
      // Save the VIP pass to the browser!
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      console.log("Logged in! Token saved.");
      setStatusMessage("Login successful! Redirecting...");
      
      // NEW: Redirect to the Landing Page after 1 second
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error) {
      setErrorMessage("Invalid username or password.");
    }
  };

  // --- 📩 HANDLE REQUEST ACCESS (Updated for Pre-Registration) ---
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/users/register/`, {
        first_name: formData.name, 
        email: formData.email,
        username: formData.username, 
        password: formData.password  
      });
      
      setStatusMessage("Account created! An admin will approve your access shortly.");
      setFormData({ username: '', password: '', name: '', email: '', reason: '' }); 
      setTimeout(() => setIsLoginView(true), 4000); 
      
    } catch (error) {
      console.error("API Error:", error.response || error);
      if (error.response && error.response.status === 400) {
        setErrorMessage("Username or Email might already be in use.");
      } else {
        setErrorMessage("Network error. Check your server connection.");
      }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.glassCard}>
        <h1 className={styles.title}>{isLoginView ? 'Welcome Back' : 'Request Access'}</h1>
        
        {errorMessage && <div className={styles.error}>{errorMessage}</div>}
        {statusMessage && <div className={styles.message}>{statusMessage}</div>}

        {/* --- LOGIN FORM --- */}
        {isLoginView ? (
          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={styles.input} required />
            </div>
            <button type="submit" className={styles.buttonPrimary}>Initialize Link</button>
            <button type="button" onClick={() => setIsLoginView(false)} className={styles.buttonSecondary}>
              Don't have an account? Request Access
            </button>
          </form>
        ) : (
          /* --- REQUEST ACCESS FORM --- */
          <form onSubmit={handleRequestAccess}>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Desired Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={styles.input} required />
            </div>
            
            <button type="submit" className={styles.buttonPrimary}>Submit Request</button>
            <button type="button" onClick={() => setIsLoginView(true)} className={styles.buttonSecondary}>
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;