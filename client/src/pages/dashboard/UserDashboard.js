import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalViews: 0,
    totalInquiries: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user stats and recent activity
      const [statsResponse, activityResponse] = await Promise.all([
        fetch(`/api/users/${user._id}/stats`),
        fetch(`/api/users/${user._id}/activity`)
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickActions = () => {
    const actions = [
      {
        title: 'Post a Rental',
        description: 'List your property for rent',
        icon: '🏠',
        link: '/rentals/create',
        color: '#4299e1'
      },
      {
        title: 'Post a Job',
        description: 'Hire someone for your business',
        icon: '💼',
        link: '/jobs/create',
        color: '#48bb78'
      },
      {
        title: 'Offer a Service',
        description: 'Share your skills and expertise',
        icon: '🔧',
        link: '/skills/create',
        color: '#ed8936'
      },
      {
        title: 'List Your Business',
        description: 'Promote your business',
        icon: '🏢',
        link: '/businesses/create',
        color: '#9f7aea'
      }
    ];

    // Filter based on user type
    if (user.userType === 'landlord') {
      return actions.filter(action => action.title.includes('Rental'));
    } else if (user.userType === 'business') {
      return actions.filter(action => 
        action.title.includes('Job') || 
        action.title.includes('Business') ||
        action.title.includes('Service')
      );
    }

    return actions;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.name}! 👋</h1>
          <p>Here's what's happening with your listings today</p>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-type">{user.userType}</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalListings}</h3>
            <p>Total Listings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.activeListings}</h3>
            <p>Active Listings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>{stats.totalViews}</h3>
            <p>Total Views</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.unreadMessages}</h3>
            <p>Unread Messages</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            {getQuickActions().map((action, index) => (
              <Link key={index} to={action.link} className="action-card">
                <div className="action-icon" style={{ backgroundColor: action.color }}>
                  {action.icon}
                </div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link to="/activity" className="view-all-link">View All</Link>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'view' && '👁️'}
                    {activity.type === 'inquiry' && '💬'}
                    {activity.type === 'message' && '📧'}
                    {activity.type === 'listing' && '📝'}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{activity.description}</p>
                    <span className="activity-time">{formatDate(activity.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No recent activity</p>
                <span>Start by creating your first listing!</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Messages</h2>
            <Link to="/messages" className="view-all-link">View All</Link>
          </div>
          <div className="messages-preview">
            {stats.unreadMessages > 0 ? (
              <div className="message-alert">
                <span>You have {stats.unreadMessages} unread messages</span>
                <Link to="/messages" className="view-messages-btn">View Messages</Link>
              </div>
            ) : (
              <div className="empty-state">
                <p>No new messages</p>
                <span>Your inbox is up to date!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips and Suggestions */}
      <div className="dashboard-section">
        <h2>Tips & Suggestions</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>📸 Add Photos</h4>
            <p>High-quality photos can increase your listing views by up to 40%</p>
          </div>
          <div className="tip-card">
            <h4>📝 Detailed Descriptions</h4>
            <p>Be specific about what you're offering to attract the right audience</p>
          </div>
          <div className="tip-card">
            <h4>⏰ Respond Quickly</h4>
            <p>Quick responses to inquiries can help you close deals faster</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 