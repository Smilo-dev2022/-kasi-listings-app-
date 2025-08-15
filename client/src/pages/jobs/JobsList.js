import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Jobs.css';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
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

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: sortBy,
      });

      if (filters.minSalary) params.append('minSalary', filters.minSalary);
      if (filters.maxSalary) params.append('maxSalary', filters.maxSalary);
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      // Note: Backend does not currently support filtering by experience.

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setTotalPages(data.pagination.total || 0);
        setTotalJobs(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1);
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
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const formatSalary = (min, max) => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
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
              <span>{totalJobs} jobs found</span>
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
            {jobs.length > 0 ? (
              jobs.map(job => (
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

export default JobsList;
