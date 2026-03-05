import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [activeSidebarTab, setActiveSidebarTab] = useState('chats'); // 'chats' or 'requests'
  const [accessRequests, setAccessRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const API_URL = 'http://127.0.0.1:8000/api';

  // 1. Fetch the list of users who have active chats
  useEffect(() => {
    fetchChatList();
  }, []);

  // 2. Auto-scroll to bottom when new messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatList = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/users/admin/chats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatUsers(response.data);
    } catch (error) {
      console.error("Error fetching chat list:", error);
      // If they get a 403 Forbidden, they aren't an admin! Kick them back home.
      if (error.response && error.response.status === 403) {
        navigate('/'); 
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch pending access requests
  const fetchAccessRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/users/admin/access-requests/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccessRequests(response.data);
    } catch (error) {
      console.error("Error fetching access requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Load requests when the tab switches
  useEffect(() => {
    if (activeSidebarTab === 'requests') {
      fetchAccessRequests();
    }
  }, [activeSidebarTab]);

  // Handle Approve or Reject
  const handleRequestAction = async (id, action) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`${API_URL}/users/admin/access-requests/${id}/`, 
        { status: action }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove the processed request from the screen
      setAccessRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      console.error(`Error marking request as ${action}:`, error);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/users/admin/chats/${user.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      
      // Update the unread count in the sidebar list to 0 since we just read them
      setChatUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, unread_count: 0 } : u
      ));
    } catch (error) {
      console.error("Error fetching user messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/users/admin/chats/${selectedUser.id}/`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h2>Admin Command Center</h2>
        <button className={styles.backBtn} onClick={() => navigate('/')}>Back to Site</button>
      </div>

      <div className={styles.splitLayout}>
        
        {/* LEFT SIDEBAR: User List & Approvals */}
        <div className={styles.sidebar}>
          
          {/* TAB TOGGLES */}
          <div className={styles.sidebarTabs}>
            <button 
              className={`${styles.sidebarTabBtn} ${activeSidebarTab === 'chats' ? styles.activeTab : ''}`}
              onClick={() => setActiveSidebarTab('chats')}
            >
              Chats
            </button>
            <button 
              className={`${styles.sidebarTabBtn} ${activeSidebarTab === 'requests' ? styles.activeTab : ''}`}
              onClick={() => setActiveSidebarTab('requests')}
            >
              Approvals
            </button>
          </div>

          {activeSidebarTab === 'chats' ? (
            /* --- EXISTING CHAT LIST --- */
            <>
              {loadingUsers ? (
                <p className={styles.loadingText}>Loading chats...</p>
              ) : chatUsers.length === 0 ? (
                <p className={styles.emptyText}>No active chats right now.</p>
              ) : (
                <div className={styles.userList}>
                  {chatUsers.map(user => (
                    <div 
                      key={user.id} 
                      className={`${styles.userCard} ${selectedUser?.id === user.id ? styles.activeCard : ''}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.first_name || user.username}</span>
                        {user.unread_count > 0 && (
                          <span className={styles.unreadBadge}>{user.unread_count}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* --- NEW APPROVALS LIST --- */
            <>
              {loadingRequests ? (
                <p className={styles.loadingText}>Loading requests...</p>
              ) : accessRequests.length === 0 ? (
                <p className={styles.emptyText}>No pending requests.</p>
              ) : (
                <div className={styles.userList}>
                  {accessRequests.map(req => (
                    <div key={req.id} className={styles.requestCard}>
                      <span className={styles.reqName}>{req.name}</span>
                      <span className={styles.reqEmail}>{req.email}</span>
                      {req.reason && <p className={styles.reqReason}>"{req.reason}"</p>}
                      
                      <div className={styles.reqActions}>
                        <button 
                          className={styles.approveBtn} 
                          onClick={() => handleRequestAction(req.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className={styles.rejectBtn} 
                          onClick={() => handleRequestAction(req.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT AREA: Chat Window */}
        <div className={styles.chatArea}>
          {!selectedUser ? (
            <div className={styles.placeholderState}>
              <p>Select a student from the left to start chatting.</p>
            </div>
          ) : (
            <div className={styles.activeChat}>
              <div className={styles.chatHeader}>
                <h3>Chatting with {selectedUser.first_name || selectedUser.username}</h3>
              </div>
              
              <div className={styles.messagesWindow}>
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.messageWrapper} ${msg.is_from_admin ? styles.adminMsg : styles.userMsg}`}
                  >
                    <div className={styles.messageBubble}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className={styles.inputArea}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Reply to ${selectedUser.username}...`}
                  className={styles.chatInput}
                />
                <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim()}>
                  Send Reply
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;