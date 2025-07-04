import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Kasi Listings
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/listings" className="nav-link">Rentals</Link>
          </li>
          <li className="nav-item">
            <Link to="/jobs" className="nav-link">Jobs</Link>
          </li>
          <li className="nav-item">
            <Link to="/skills" className="nav-link">Skills</Link>
          </li>
          <li className="nav-item">
            <Link to="/businesses" className="nav-link">Businesses</Link>
          </li>
          <li className="nav-item">
            <Link to="/ads" className="nav-link">Advertise</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 