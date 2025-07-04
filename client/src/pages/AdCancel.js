import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './AdCancel.css';

const AdCancel = () => {
  const [searchParams] = useSearchParams();
  const adId = searchParams.get('id');

  return (
    <div className="cancel-container">
      <div className="cancel-card">
        <div className="cancel-icon">❌</div>
        <h1>Payment Cancelled</h1>
        <p className="cancel-message">
          Your payment was cancelled and no charges were made to your account.
        </p>

        <div className="info-box">
          <h3>What happened?</h3>
          <p>
            You cancelled the payment process before it was completed. Your advertisement 
            has been saved as a draft and you can complete the payment at any time.
          </p>
        </div>

        <div className="next-steps">
          <h3>What you can do:</h3>
          <ul>
            <li>Complete the payment to activate your advertisement</li>
            <li>Edit your advertisement before paying</li>
            <li>Delete the draft and create a new one</li>
            <li>Contact support if you need assistance</li>
          </ul>
        </div>

        <div className="action-buttons">
          {adId && (
            <Link to={`/ads/edit/${adId}`} className="btn-primary">
              Complete Payment
            </Link>
          )}
          <Link to="/ads" className="btn-secondary">
            View Dashboard
          </Link>
          <Link to="/" className="btn-outline">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdCancel; 