import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AdSuccess.css';

const AdSuccess = () => {
  const [searchParams] = useSearchParams();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adId = searchParams.get('id');
    if (adId) {
      fetchAd(adId);
    }
  }, [searchParams]);

  const fetchAd = async (adId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/advertisements/${adId}`);
      setAd(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch ad:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="success-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h1>Payment Successful!</h1>
        <p className="success-message">
          Your advertisement has been created and payment has been processed successfully.
        </p>

        {ad && (
          <div className="ad-summary">
            <h3>Advertisement Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Title:</span>
                <span>{ad.title}</span>
              </div>
              <div className="summary-row">
                <span>Duration:</span>
                <span>{ad.durationDays} days</span>
              </div>
              <div className="summary-row">
                <span>Status:</span>
                <span className={`status ${ad.status}`}>{ad.status}</span>
              </div>
              <div className="summary-row">
                <span>Target Audience:</span>
                <span>{ad.targetAudience}</span>
              </div>
            </div>
          </div>
        )}

        <div className="next-steps">
          <h3>What happens next?</h3>
          <ul>
            <li>Your advertisement will be reviewed by our team</li>
            <li>Once approved, it will be displayed on our platform</li>
            <li>You can track performance in your dashboard</li>
            <li>We'll notify you when your ad goes live</li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to="/ads" className="btn-primary">
            View Dashboard
          </Link>
          <Link to="/" className="btn-secondary">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdSuccess; 