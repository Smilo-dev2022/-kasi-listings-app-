import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdDashboard.css';

const AdDashboard = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/advertisements');
      setAds(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load advertisements');
      setLoading(false);
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (paymentStatus === 'unpaid') {
      return <span className="badge unpaid">Unpaid</span>;
    }
    switch (status) {
      case 'active':
        return <span className="badge active">Active</span>;
      case 'pending':
        return <span className="badge pending">Pending</span>;
      case 'rejected':
        return <span className="badge rejected">Rejected</span>;
      case 'expired':
        return <span className="badge expired">Expired</span>;
      default:
        return <span className="badge unknown">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your advertisements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Advertisement Dashboard</h1>
        <Link to="/ads/create" className="create-ad-btn">
          Create New Ad
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Ads</h3>
          <p>{ads.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Ads</h3>
          <p>{ads.filter(ad => ad.status === 'active').length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Views</h3>
          <p>{ads.reduce((sum, ad) => sum + ad.views, 0)}</p>
        </div>
        <div className="stat-card">
          <h3>Total Clicks</h3>
          <p>{ads.reduce((sum, ad) => sum + ad.clicks, 0)}</p>
        </div>
      </div>

      <div className="ads-section">
        <h2>Your Advertisements</h2>
        {ads.length === 0 ? (
          <div className="no-ads">
            <p>You haven't created any advertisements yet.</p>
            <Link to="/ads/create" className="create-first-ad-btn">
              Create Your First Ad
            </Link>
          </div>
        ) : (
          <div className="ads-grid">
            {ads.map((ad) => (
              <div key={ad._id} className="ad-card">
                <div className="ad-header">
                  <h3>{ad.title}</h3>
                  {getStatusBadge(ad.status, ad.paymentStatus)}
                </div>
                <p className="ad-content">{ad.content}</p>
                {ad.imageUrl && (
                  <img src={ad.imageUrl} alt={ad.title} className="ad-image" />
                )}
                <div className="ad-details">
                  <p><strong>Target:</strong> {ad.targetAudience}</p>
                  <p><strong>Duration:</strong> {ad.durationDays} days</p>
                  <p><strong>Views:</strong> {ad.views}</p>
                  <p><strong>Clicks:</strong> {ad.clicks}</p>
                  <p><strong>Created:</strong> {new Date(ad.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="ad-actions">
                  <button className="btn-edit">Edit</button>
                  <button className="btn-delete">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdDashboard; 