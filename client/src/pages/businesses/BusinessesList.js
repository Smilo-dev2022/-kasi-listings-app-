import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Businesses.css';

const BusinessesList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    rating: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: sortBy,
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.status) params.append('status', filters.status);
      // Note: Backend does not currently support filtering by rating.

      const response = await fetch(`/api/businesses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
        setTotalPages(data.pagination.total || 0);
        setTotalBusinesses(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, filters]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      rating: '',
      status: ''
    });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'retail': '🛍️',
      'restaurant': '🍽️',
      'healthcare': '🏥',
      'professional-services': '💼',
      'manufacturing': '🏭',
      'construction': '🏗️',
      'transportation': '🚚',
      'entertainment': '🎬',
      'education': '🎓',
      'technology': '💻',
      'finance': '💰',
      'real-estate': '🏠',
      'automotive': '🚗',
      'beauty-wellness': '💄',
      'fitness-sports': '💪',
      'home-garden': '🏡',
      'pet-services': '🐾',
      'childcare': '👶',
      'cleaning': '🧹',
      'repair-maintenance': '🔧',
      'consulting': '📊',
      'media-advertising': '📺',
      'legal': '⚖️',
      'other': '🏢'
    };
    return icons[category] || '🏢';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#48bb78',
      'inactive': '#e53e3e',
      'temporarily-closed': '#ed8936',
      'permanently-closed': '#e53e3e'
    };
    return colors[status] || '#718096';
  };

  if (loading) {
    return (
      <div className="businesses-container">
        <div className="loading-spinner">Loading businesses...</div>
      </div>
    );
  }

  return (
    <div className="businesses-container">
      <div className="businesses-header">
        <div className="header-content">
          <h1>Local Business Directory</h1>
          <p>Discover amazing businesses in your community</p>
        </div>
        <Link to="/businesses/create" className="post-business-btn">
          List Your Business
        </Link>
      </div>

      <div className="businesses-content">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>

          {/* Category */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Any</option>
              <option value="retail">Retail</option>
              <option value="restaurant">Restaurant</option>
              <option value="healthcare">Healthcare</option>
              <option value="professional-services">Professional Services</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="construction">Construction</option>
              <option value="transportation">Transportation</option>
              <option value="entertainment">Entertainment</option>
              <option value="education">Education</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="real-estate">Real Estate</option>
              <option value="automotive">Automotive</option>
              <option value="beauty-wellness">Beauty & Wellness</option>
              <option value="fitness-sports">Fitness & Sports</option>
              <option value="home-garden">Home & Garden</option>
              <option value="pet-services">Pet Services</option>
              <option value="childcare">Childcare</option>
              <option value="cleaning">Cleaning</option>
              <option value="repair-maintenance">Repair & Maintenance</option>
              <option value="consulting">Consulting</option>
              <option value="media-advertising">Media & Advertising</option>
              <option value="legal">Legal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Location */}
          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="City or State"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          {/* Rating */}
          <div className="filter-group">
            <label>Minimum Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
            >
              <option value="">Any</option>
              <option value="4.5">4.5+ stars</option>
              <option value="4.0">4.0+ stars</option>
              <option value="3.5">3.5+ stars</option>
              <option value="3.0">3.0+ stars</option>
            </select>
          </div>

          {/* Status */}
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="temporarily-closed">Temporarily Closed</option>
            </select>
          </div>
        </div>

        {/* Businesses List */}
        <div className="businesses-main">
          <div className="businesses-toolbar">
            <div className="results-info">
              <span>{totalBusinesses} businesses found</span>
            </div>
            <div className="toolbar-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          <div className={`businesses-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {businesses.length > 0 ? (
              businesses.map(business => (
                <Link key={business._id} to={`/businesses/${business._id}`} className="business-card">
                  <div className="business-header">
                    <div className="business-icon">
                      {getCategoryIcon(business.category)}
                    </div>
                    <div className="business-info">
                      <h3>{business.name}</h3>
                      <div className="business-meta">
                        <span className="business-category">
                          {business.category.replace('-', ' ')}
                        </span>
                        <span className="business-subcategory">
                          {business.subcategory}
                        </span>
                      </div>
                    </div>
                    <div className="business-rating">
                      <div className="stars">
                        {renderStars(business.rating.average)}
                      </div>
                      <span className="rating-text">
                        {business.rating.average.toFixed(1)} ({business.rating.count})
                      </span>
                    </div>
                  </div>

                  <div className="business-details">
                    <div className="business-description">
                      <p>{business.description.substring(0, 120)}...</p>
                    </div>

                    <div className="business-location">
                      <span className="location-icon">📍</span>
                      <span className="location-text">
                        {business.address.street}, {business.address.city}, {business.address.state} {business.address.zipCode}
                      </span>
                    </div>

                    <div className="business-contact">
                      {business.contact.phone && (
                        <div className="contact-item">
                          <span className="contact-icon">📞</span>
                          <span className="contact-text">{business.contact.phone}</span>
                        </div>
                      )}
                      {business.contact.email && (
                        <div className="contact-item">
                          <span className="contact-icon">✉️</span>
                          <span className="contact-text">{business.contact.email}</span>
                        </div>
                      )}
                      {business.contact.website && (
                        <div className="contact-item">
                          <span className="contact-icon">🌐</span>
                          <span className="contact-text">{business.contact.website}</span>
                        </div>
                      )}
                    </div>

                    <div className="business-hours">
                      {business.hours && (
                        <div className="hours-info">
                          <span className="hours-label">Hours:</span>
                          <span className="hours-text">
                            {business.hours.monday} - {business.hours.friday}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="business-services">
                      {business.services && business.services.length > 0 && (
                        <div className="services-list">
                          <span className="services-label">Services:</span>
                          <div className="service-tags">
                            {business.services.slice(0, 3).map((service, index) => (
                              <span key={index} className="service-tag">
                                {service}
                              </span>
                            ))}
                            {business.services.length > 3 && (
                              <span className="service-more">
                                +{business.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="business-footer">
                    <div className="business-stats">
                      <span className="business-views">
                        {business.views} views
                      </span>
                      <span className="business-inquiries">
                        {business.inquiries} inquiries
                      </span>
                    </div>
                    <div className="business-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(business.status) }}
                      >
                        {business.status.replace('-', ' ')}
                      </span>
                    </div>
                    <span className="business-date">
                      Listed {new Date(business.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {business.isPremium && (
                    <div className="premium-badge">Premium</div>
                  )}
                </Link>
              ))
            ) : (
              <div className="no-results">
                <h3>No businesses found</h3>
                <p>Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessesList;
