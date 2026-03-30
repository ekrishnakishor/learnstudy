import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './CommunicationModal.module.css';

const CommunicationModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // This reference allows us to auto-scroll to the bottom of the chat
  const messagesEndRef = useRef(null);
  // const API_URL = 'http://127.0.0.1:8000/api';https://learnstudy.vercel.app/api
  const API_URL = 'https://learnstudy-gzii.onrender.com/api'; //https://learnstudy.vercel.app/api

  // Fetch messages whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  // Auto-scroll to the newest message whenever the messages array updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Look for 'access_token' instead of 'token'
      const token = localStorage.getItem('access_token'); 
      
      // Point to /users/chat/
      const response = await axios.get(`${API_URL}/users/chat/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Look for 'access_token'
      const token = localStorage.getItem('access_token');
      
      // Point to /users/chat/
      const response = await axios.post(
        `${API_URL}/users/chat/`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add the new message to the screen immediately
      setMessages(prev => [...prev, response.data]);
      setNewMessage(''); // Clear the input box
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // If the modal isn't open, render nothing
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.chatContainer}>
        
        {/* Header */}
        <div className={styles.header}>
          <h3>Support & Chat</h3>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>

        {/* The Ticket System Placeholder */}
        <div className={styles.ticketSection}>
          <button disabled className={styles.ticketBtn}>
            Open a Ticket <span>(Coming Soon)</span>
          </button>
        </div>

        {/* The Chat Window */}
        <div className={styles.messagesArea}>
          {loading && messages.length === 0 ? (
            <p className={styles.systemText}>Loading conversation...</p>
          ) : messages.length === 0 ? (
            <p className={styles.systemText}>Send a message to start chatting with the Admin!</p>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`${styles.messageWrapper} ${msg.is_from_admin ? styles.adminMsg : styles.userMsg}`}
              >
                <div className={styles.messageBubble}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
          {/* This empty div acts as our scroll target */}
          <div ref={messagesEndRef} />
        </div>

        {/* The Input Box */}
        <form onSubmit={handleSendMessage} className={styles.inputArea}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className={styles.chatInput}
          />
          <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim()}>
            Send
          </button>
        </form>

      </div>
    </div>
  );
};

export default CommunicationModal;