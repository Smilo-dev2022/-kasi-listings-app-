import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Skills.css';

const SkillsList = () => {
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
    location: '',
    rating: '',
    availability: ''
  });
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [skills, filters, sortBy]);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...skills];

    // Apply price filter
    if (filters.minPrice) {
      filtered = filtered.filter(skill => skill.pricing.amount >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(skill => skill.pricing.amount <= parseFloat(filters.maxPrice));
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(skill => skill.category === filters.category);
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(skill => 
        skill.location.serviceArea.cities.some(city => 
          city.toLowerCase().includes(filters.location.toLowerCase())
        )
      );
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(skill => skill.rating.average >= parseFloat(filters.rating));
    }

    // Apply availability filter
    if (filters.availability) {
      filtered = filtered.filter(skill => skill.availability === filters.availability);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.pricing.amount - b.pricing.amount);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.pricing.amount - a.pricing.amount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating.average - a.rating.average);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }

    setFilteredSkills(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      category: '',
      location: '',
      rating: '',
      availability: ''
    });
  };

  const formatPrice = (amount, type) => {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(value);
    };

    if (type === 'negotiable') {
      return 'Negotiable';
    }
    return `${formatCurrency(amount)}/${type}`;
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
      'home-services': '🏠',
      'professional-services': '💼',
      'creative-services': '🎨',
      'health-wellness': '💆',
      'education-tutoring': '📚',
      'transportation': '🚗',
      'event-services': '🎉',
      'technology': '💻',
      'beauty-personal-care': '💄',
      'fitness-sports': '💪',
      'food-catering': '🍽️',
      'cleaning-maintenance': '🧹',
      'repair-construction': '🔧',
      'consulting': '📊',
      'writing-translation': '✍️',
      'design-media': '🎭',
      'legal-financial': '⚖️',
      'other': '🔧'
    };
    return icons[category] || '🔧';
  };

  if (loading) {
    return (
      <div className="skills-container">
        <div className="loading-spinner">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="skills-container">
      <div className="skills-header">
        <div className="header-content">
          <h1>Find Local Services</h1>
          <p>Connect with skilled professionals in your community</p>
        </div>
        <Link to="/skills/create" className="post-skill-btn">
          Offer a Service
        </Link>
      </div>

      <div className="skills-content">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Any</option>
              <option value="home-services">Home Services</option>
              <option value="professional-services">Professional Services</option>
              <option value="creative-services">Creative Services</option>
              <option value="health-wellness">Health & Wellness</option>
              <option value="education-tutoring">Education & Tutoring</option>
              <option value="transportation">Transportation</option>
              <option value="event-services">Event Services</option>
              <option value="technology">Technology</option>
              <option value="beauty-personal-care">Beauty & Personal Care</option>
              <option value="fitness-sports">Fitness & Sports</option>
              <option value="food-catering">Food & Catering</option>
              <option value="cleaning-maintenance">Cleaning & Maintenance</option>
              <option value="repair-construction">Repair & Construction</option>
              <option value="consulting">Consulting</option>
              <option value="writing-translation">Writing & Translation</option>
              <option value="design-media">Design & Media</option>
              <option value="legal-financial">Legal & Financial</option>
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

          {/* Availability */}
          <div className="filter-group">
            <label>Availability</label>
            <select
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            >
              <option value="">Any</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
            </select>
          </div>
        </div>

        {/* Skills List */}
        <div className="skills-main">
          <div className="skills-toolbar">
            <div className="results-info">
              <span>{filteredSkills.length} services found</span>
            </div>
            <div className="toolbar-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
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

          <div className={`skills-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredSkills.length > 0 ? (
              filteredSkills.map(skill => (
                <Link key={skill._id} to={`/skills/${skill._id}`} className="skill-card">
                  <div className="skill-header">
                    <div className="skill-icon">
                      {getCategoryIcon(skill.category)}
                    </div>
                    <div className="skill-title-section">
                      <h3>{skill.title}</h3>
                      <div className="provider-info">
                        <span className="provider-name">{skill.provider.name}</span>
                        <span className="provider-location">
                          {skill.location.serviceArea.cities[0]}
                        </span>
                      </div>
                    </div>
                    <div className="skill-rating">
                      <div className="stars">
                        {renderStars(skill.rating.average)}
                      </div>
                      <span className="rating-text">
                        {skill.rating.average.toFixed(1)} ({skill.rating.count})
                      </span>
                    </div>
                  </div>

                  <div className="skill-details">
                    <div className="skill-category">
                      <span className="category-badge">
                        {skill.category.replace('-', ' ')}
                      </span>
                      <span className="subcategory">
                        {skill.subcategory}
                      </span>
                    </div>

                    <div className="skill-description">
                      <p>{skill.description.substring(0, 120)}...</p>
                    </div>

                    <div className="skill-pricing">
                      <span className="price-amount">
                        {formatPrice(skill.pricing.amount, skill.pricing.type)}
                      </span>
                    </div>

                    <div className="skill-availability">
                      <span className={`availability-badge ${skill.availability}`}>
                        {skill.availability}
                      </span>
                    </div>

                    <div className="skill-stats">
                      <span className="skill-views">
                        {skill.views} views
                      </span>
                      <span className="skill-inquiries">
                        {skill.inquiries} inquiries
                      </span>
                    </div>
                  </div>

                  <div className="skill-footer">
                    <span className="skill-date">
                      Posted {new Date(skill.createdAt).toLocaleDateString()}
                    </span>
                    <button className="contact-btn">
                      Contact Provider
                    </button>
                  </div>

                  {skill.isPremium && (
                    <div className="premium-badge">Premium</div>
                  )}
                </Link>
              ))
            ) : (
              <div className="no-results">
                <h3>No services found</h3>
                <p>Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsList; 