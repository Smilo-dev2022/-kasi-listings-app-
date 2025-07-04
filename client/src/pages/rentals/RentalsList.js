import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Rentals.css';

const RentalsList = () => {
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    propertyType: '',
    location: '',
    amenities: []
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    fetchRentals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rentals, filters, sortBy]);

  const fetchRentals = async () => {
    try {
      const response = await fetch('/api/rentals');
      if (response.ok) {
        const data = await response.json();
        setRentals(data.rentals || []);
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rentals];

    // Apply price filter
    if (filters.minPrice) {
      filtered = filtered.filter(rental => rental.price.amount >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(rental => rental.price.amount <= parseFloat(filters.maxPrice));
    }

    // Apply bedrooms filter
    if (filters.bedrooms) {
      filtered = filtered.filter(rental => rental.details.bedrooms >= parseInt(filters.bedrooms));
    }

    // Apply property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(rental => rental.propertyType === filters.propertyType);
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(rental => 
        rental.address.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        rental.address.state.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(rental => 
        filters.amenities.every(amenity => rental.amenities.includes(amenity))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price.amount - a.price.amount);
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

    setFilteredRentals(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      propertyType: '',
      location: '',
      amenities: []
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="rentals-container">
        <div className="loading-spinner">Loading rentals...</div>
      </div>
    );
  }

  return (
    <div className="rentals-container">
      <div className="rentals-header">
        <div className="header-content">
          <h1>Find Your Perfect Home</h1>
          <p>Discover amazing rental properties in your area</p>
        </div>
        <Link to="/rentals/create" className="post-rental-btn">
          Post a Rental
        </Link>
      </div>

      <div className="rentals-content">
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

          {/* Bedrooms */}
          <div className="filter-group">
            <label>Bedrooms</label>
            <select
              value={filters.bedrooms}
              onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          {/* Property Type */}
          <div className="filter-group">
            <label>Property Type</label>
            <select
              value={filters.propertyType}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            >
              <option value="">Any</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="studio">Studio</option>
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

          {/* Amenities */}
          <div className="filter-group">
            <label>Amenities</label>
            <div className="amenities-list">
              {['parking', 'laundry', 'gym', 'pool', 'pet-friendly', 'furnished'].map(amenity => (
                <label key={amenity} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <span>{amenity.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Rentals List */}
        <div className="rentals-main">
          <div className="rentals-toolbar">
            <div className="results-info">
              <span>{filteredRentals.length} rentals found</span>
            </div>
            <div className="toolbar-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
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

          <div className={`rentals-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredRentals.length > 0 ? (
              filteredRentals.map(rental => (
                <Link key={rental._id} to={`/rentals/${rental._id}`} className="rental-card">
                  <div className="rental-image">
                    {rental.images && rental.images.length > 0 ? (
                      <img src={rental.images[0]} alt={rental.title} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    {rental.isPremium && (
                      <div className="premium-badge">Premium</div>
                    )}
                  </div>
                  <div className="rental-content">
                    <div className="rental-header">
                      <h3>{rental.title}</h3>
                      <span className="rental-price">{formatPrice(rental.price.amount)}/month</span>
                    </div>
                    <div className="rental-location">
                      <span>{rental.address.city}, {rental.address.state}</span>
                    </div>
                    <div className="rental-details">
                      <span>{rental.details.bedrooms} bed</span>
                      <span>{rental.details.bathrooms} bath</span>
                      <span>{rental.details.squareFeet} sq ft</span>
                    </div>
                    <div className="rental-amenities">
                      {rental.amenities.slice(0, 3).map(amenity => (
                        <span key={amenity} className="amenity-tag">
                          {amenity}
                        </span>
                      ))}
                      {rental.amenities.length > 3 && (
                        <span className="amenity-more">+{rental.amenities.length - 3} more</span>
                      )}
                    </div>
                    <div className="rental-footer">
                      <span className="rental-date">
                        Posted {new Date(rental.createdAt).toLocaleDateString()}
                      </span>
                      <span className="rental-views">
                        {rental.views} views
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="no-results">
                <h3>No rentals found</h3>
                <p>Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalsList; 