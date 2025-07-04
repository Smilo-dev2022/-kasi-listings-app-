import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [featuredAds, setFeaturedAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedAds();
  }, []);

  const fetchFeaturedAds = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/advertisements?status=active');
      setFeaturedAds(response.data.slice(0, 3)); // Show only 3 featured ads
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch featured ads:', err);
      setLoading(false);
    }
  };

  const handleAdClick = async (adId) => {
    try {
      await axios.post(`http://localhost:5000/api/advertisements/${adId}/track`, {
        type: 'click'
      });
    } catch (err) {
      console.error('Failed to track ad click:', err);
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Kasi Listings</h1>
          <p>Your comprehensive marketplace for rentals, jobs, skills, and business services in the township</p>
          <div className="hero-buttons">
            <Link to="/listings" className="btn-primary">Browse Rentals</Link>
            <Link to="/jobs" className="btn-secondary">Find Jobs</Link>
          </div>
        </div>
      </section>

      {/* Featured Advertisements */}
      {!loading && featuredAds.length > 0 && (
        <section className="featured-ads-section">
          <div className="section-header">
            <h2>Featured Advertisements</h2>
            <p>Discover great deals and opportunities from local businesses</p>
          </div>
          <div className="featured-ads-grid">
            {featuredAds.map((ad) => (
              <div 
                key={ad._id} 
                className="featured-ad-card"
                onClick={() => handleAdClick(ad._id)}
              >
                {ad.imageUrl && (
                  <img src={ad.imageUrl} alt={ad.title} className="ad-image" />
                )}
                <div className="ad-content">
                  <h3>{ad.title}</h3>
                  <p>{ad.content}</p>
                  <span className="ad-target">Target: {ad.targetAudience}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>What We Offer</h2>
          <p>Everything you need in one place</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>Rental Listings</h3>
            <p>Find your perfect home with our comprehensive rental listings from trusted landlords</p>
            <Link to="/listings" className="feature-link">Browse Rentals</Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>Job Opportunities</h3>
            <p>Discover career opportunities from local businesses and employers in your area</p>
            <Link to="/jobs" className="feature-link">Find Jobs</Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Skills & Services</h3>
            <p>Connect with skilled professionals offering various services in the community</p>
            <Link to="/skills" className="feature-link">Browse Skills</Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Business Directory</h3>
            <p>Explore local businesses and discover products and services in your township</p>
            <Link to="/businesses" className="feature-link">View Businesses</Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Advertise Your Business?</h2>
          <p>Reach thousands of potential customers in your local community</p>
          <Link to="/ads" className="btn-primary">Start Advertising</Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 