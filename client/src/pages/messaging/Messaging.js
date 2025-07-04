import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Messaging.css';

const Messaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messaging/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messaging/conversations/${selectedConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        // Update conversation list to show latest message
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== user._id);
  };

  const getConversationTitle = (conversation) => {
    if (conversation.subject) {
      return conversation.subject;
    }
    const other = getOtherParticipant(conversation);
    return other ? other.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="messaging-container">
        <div className="loading-spinner">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="messaging-container">
      <div className="messaging-header">
        <h1>Messages</h1>
        <p>Stay connected with your community</p>
      </div>

      <div className="messaging-content">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h3>Conversations</h3>
            <span className="conversation-count">{conversations.length}</span>
          </div>

          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map(conversation => {
                const other = getOtherParticipant(conversation);
                const isSelected = selectedConversation?._id === conversation._id;
                
                return (
                  <div
                    key={conversation._id}
                    className={`conversation-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="conversation-avatar">
                      {other ? other.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="conversation-content">
                      <div className="conversation-header">
                        <h4>{getConversationTitle(conversation)}</h4>
                        <span className="conversation-time">
                          {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <p>
                          {conversation.lastMessage 
                            ? conversation.lastMessage.content.substring(0, 50) + '...'
                            : 'No messages yet'
                          }
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="unread-badge">{conversation.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-conversations">
                <p>No conversations yet</p>
                <span>Start a conversation to connect with others</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-participant">
                  <div className="participant-avatar">
                    {getOtherParticipant(selectedConversation)?.name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="participant-info">
                    <h3>{getConversationTitle(selectedConversation)}</h3>
                    <span className="participant-status">Online</span>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="action-btn">📞</button>
                  <button className="action-btn">📹</button>
                  <button className="action-btn">⋯</button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                <div className="messages-list">
                  {messages.length > 0 ? (
                    messages.map(message => {
                      const isOwnMessage = message.sender._id === user._id;
                      
                      return (
                        <div
                          key={message._id}
                          className={`message ${isOwnMessage ? 'own' : 'other'}`}
                        >
                          {!isOwnMessage && (
                            <div className="message-avatar">
                              {message.sender.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="message-content">
                            <div className="message-bubble">
                              <p>{message.content}</p>
                              <span className="message-time">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-messages">
                      <p>No messages yet</p>
                      <span>Start the conversation!</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="message-input-container">
                <div className="message-input-wrapper">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="send-button"
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging; 