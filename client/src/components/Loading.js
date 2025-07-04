import React from 'react';
import './Loading.css';

const Loading = ({ 
  type = 'spinner', 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const renderSpinner = () => (
    <div className={`spinner ${size}`}>
      <div className="spinner-inner"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`dots ${size}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`pulse ${size}`}></div>
  );

  const renderSkeleton = () => (
    <div className={`skeleton ${size}`}>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          {renderContent()}
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      {renderContent()}
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading; 