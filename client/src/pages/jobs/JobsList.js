import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Jobs.css';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minSalary: '',
    maxSalary: '',
    jobType: '',
    category: '',
    location: '',
    experience: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters, sortBy]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Apply salary filter
    if (filters.minSalary) {
      filtered = filtered.filter(job => job.salary.min >= parseFloat(filters.minSalary));
    }
    if (filters.maxSalary) {
      filtered = filtered.filter(job => job.salary.max <= parseFloat(filters.maxSalary));
    }

    // Apply job type filter
    if (filters.jobType) {
      filtered = filtered.filter(job => job.jobType === filters.jobType);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(job => job.category === filters.category);
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.address.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        job.location.address.state.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply experience filter
    if (filters.experience) {
      filtered = filtered.filter(job => job.requirements.experience === filters.experience);
    }

    // Apply sorting
    switch (sortBy) {
      case 'salary-low':
        filtered.sort((a, b) => a.salary.min - b.salary.min);
        break;
      case 'salary-high':
        filtered.sort((a, b) => b.salary.max - a.salary.max);
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

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minSalary: '',
      maxSalary: '',
      jobType: '',
      category: '',
      location: '',
      experience: ''
    });
  };

  const formatSalary = (min, max) => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    if (min === max) {
      return formatCurrency(min);
    }
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  const getJobTypeColor = (jobType) => {
    const colors = {
      'full-time': '#48bb78',
      'part-time': '#4299e1',
      'contract': '#ed8936',
      'temporary': '#e53e3e',
      'internship': '#9f7aea',
      'freelance': '#38b2ac'
    };
    return colors[jobType] || '#718096';
  };

  if (loading) {
    return (
      <div className="jobs-container">
        <div className="loading-spinner">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      <div className="jobs-header">
        <div className="header-content">
          <h1>Find Your Next Opportunity</h1>
          <p>Discover amazing job opportunities in your community</p>
        </div>
        <Link to="/jobs/create" className="post-job-btn">
          Post a Job
        </Link>
      </div>

      <div className="jobs-content">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>

          {/* Salary Range */}
          <div className="filter-group">
            <label>Salary Range</label>
            <div className="salary-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.minSalary}
                onChange={(e) => handleFilterChange('minSalary', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxSalary}
                onChange={(e) => handleFilterChange('maxSalary', e.target.value)}
              />
            </div>
          </div>

          {/* Job Type */}
          <div className="filter-group">
            <label>Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
            >
              <option value="">Any</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

          {/* Category */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Any</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="finance">Finance</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
              <option value="customer-service">Customer Service</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="construction">Construction</option>
              <option value="transportation">Transportation</option>
              <option value="hospitality">Hospitality</option>
              <option value="retail">Retail</option>
              <option value="administration">Administration</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
              <option value="engineering">Engineering</option>
              <option value="science">Science</option>
              <option value="legal">Legal</option>
              <option value="media">Media</option>
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

          {/* Experience Level */}
          <div className="filter-group">
            <label>Experience Level</label>
            <select
              value={filters.experience}
              onChange={(e) => handleFilterChange('experience', e.target.value)}
            >
              <option value="">Any</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}
        <div className="jobs-main">
          <div className="jobs-toolbar">
            <div className="results-info">
              <span>{filteredJobs.length} jobs found</span>
            </div>
            <div className="toolbar-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="salary-low">Salary: Low to High</option>
                <option value="salary-high">Salary: High to Low</option>
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

          <div className={`jobs-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <Link key={job._id} to={`/jobs/${job._id}`} className="job-card">
                  <div className="job-header">
                    <div className="job-title-section">
                      <h3>{job.title}</h3>
                      <div className="company-info">
                        <span className="company-name">{job.company.name}</span>
                        <span className="company-location">
                          {job.location.address.city}, {job.location.address.state}
                        </span>
                      </div>
                    </div>
                    <div className="job-type-badge" style={{ backgroundColor: getJobTypeColor(job.jobType) }}>
                      {job.jobType.replace('-', ' ')}
                    </div>
                  </div>

                  <div className="job-details">
                    <div className="salary-info">
                      <span className="salary-amount">
                        {formatSalary(job.salary.min, job.salary.max)}
                      </span>
                      <span className="salary-period">/year</span>
                    </div>

                    <div className="job-meta">
                      <span className="experience-level">
                        {job.requirements.experience} level
                      </span>
                      <span className="job-category">
                        {job.category}
                      </span>
                    </div>

                    <div className="job-description">
                      <p>{job.description.substring(0, 150)}...</p>
                    </div>

                    <div className="job-requirements">
                      <h4>Requirements:</h4>
                      <ul>
                        {job.requirements.skills.slice(0, 3).map((skill, index) => (
                          <li key={index}>{skill}</li>
                        ))}
                        {job.requirements.skills.length > 3 && (
                          <li>+{job.requirements.skills.length - 3} more skills</li>
                        )}
                      </ul>
                    </div>

                    <div className="job-benefits">
                      {job.benefits.slice(0, 3).map((benefit, index) => (
                        <span key={index} className="benefit-tag">
                          {benefit}
                        </span>
                      ))}
                      {job.benefits.length > 3 && (
                        <span className="benefit-more">
                          +{job.benefits.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="job-footer">
                    <div className="job-stats">
                      <span className="job-views">
                        {job.views} views
                      </span>
                      <span className="job-applications">
                        {job.applications} applications
                      </span>
                    </div>
                    <span className="job-date">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {job.isPremium && (
                    <div className="premium-badge">Premium</div>
                  )}
                </Link>
              ))
            ) : (
              <div className="no-results">
                <h3>No jobs found</h3>
                <p>Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsList; 