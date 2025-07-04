import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = ({ placeholder = "Search rentals, jobs, skills, businesses...", className = "" }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const searchTypes = [
    { value: 'all', label: 'All', icon: '🔍' },
    { value: 'rentals', label: 'Rentals', icon: '🏠' },
    { value: 'jobs', label: 'Jobs', icon: '💼' },
    { value: 'skills', label: 'Services', icon: '🔧' },
    { value: 'businesses', label: 'Businesses', icon: '🏢' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=${selectedType}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedType]);

  const handleSearch = (searchQuery = query, type = selectedType) => {
    if (!searchQuery.trim()) return;
    
    const searchParams = new URLSearchParams({
      q: searchQuery.trim(),
      type: type
    });
    
    navigate(`/search?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion, type) => {
    setQuery(suggestion.title || suggestion.name || suggestion);
    handleSearch(suggestion.title || suggestion.name || suggestion, type);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSuggestionIcon = (type) => {
    const icons = {
      rentals: '🏠',
      jobs: '💼',
      skills: '🔧',
      businesses: '🏢'
    };
    return icons[type] || '🔍';
  };

  const getSuggestionText = (suggestion, type) => {
    switch (type) {
      case 'rentals':
        return `${suggestion.title} - ${suggestion.address?.city}, ${suggestion.address?.state}`;
      case 'jobs':
        return `${suggestion.title} - ${suggestion.company?.name}`;
      case 'skills':
        return `${suggestion.title} - ${suggestion.category}`;
      case 'businesses':
        return `${suggestion.name} - ${suggestion.category}`;
      default:
        return suggestion.title || suggestion.name || suggestion;
    }
  };

  return (
    <div className={`search-container ${className}`} ref={searchRef}>
      <div className="search-bar">
        {/* Search Type Selector */}
        <div className="search-type-selector">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="type-select"
          >
            {searchTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="search-input"
          />
          <button
            onClick={() => handleSearch()}
            className="search-button"
            disabled={!query.trim()}
          >
            🔍
          </button>
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="search-suggestions">
          {loading ? (
            <div className="suggestion-loading">
              <span>Loading suggestions...</span>
            </div>
          ) : (
            <>
              {/* Quick Search Options */}
              <div className="quick-search">
                <h4>Quick Search</h4>
                <div className="quick-search-buttons">
                  <button
                    onClick={() => handleSearch('apartment', 'rentals')}
                    className="quick-search-btn"
                  >
                    🏠 Apartments
                  </button>
                  <button
                    onClick={() => handleSearch('remote', 'jobs')}
                    className="quick-search-btn"
                  >
                    💻 Remote Jobs
                  </button>
                  <button
                    onClick={() => handleSearch('cleaning', 'skills')}
                    className="quick-search-btn"
                  >
                    🧹 Cleaning Services
                  </button>
                  <button
                    onClick={() => handleSearch('restaurant', 'businesses')}
                    className="quick-search-btn"
                  >
                    🍽️ Restaurants
                  </button>
                </div>
              </div>

              {/* Suggestions by Type */}
              {Object.entries(suggestions).map(([type, typeSuggestions]) => {
                if (!typeSuggestions || typeSuggestions.length === 0) return null;
                
                return (
                  <div key={type} className="suggestion-group">
                    <h4>
                      {getSuggestionIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </h4>
                    <div className="suggestion-list">
                      {typeSuggestions.slice(0, 5).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion, type)}
                          className="suggestion-item"
                        >
                          <span className="suggestion-icon">
                            {getSuggestionIcon(type)}
                          </span>
                          <span className="suggestion-text">
                            {getSuggestionText(suggestion, type)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Search All Results */}
              <div className="search-all-results">
                <button
                  onClick={() => handleSearch()}
                  className="search-all-btn"
                >
                  🔍 Search for "{query}" in all categories
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 