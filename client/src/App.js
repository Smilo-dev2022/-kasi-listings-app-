import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { useToast, ToastContainer } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdDashboard from './pages/AdDashboard';
import CreateAd from './pages/CreateAd';
import AdSuccess from './pages/AdSuccess';
import AdCancel from './pages/AdCancel';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserDashboard from './pages/dashboard/UserDashboard';
import RentalsList from './pages/rentals/RentalsList';
import JobsList from './pages/jobs/JobsList';
import SkillsList from './pages/skills/SkillsList';
import BusinessesList from './pages/businesses/BusinessesList';
import Messaging from './pages/messaging/Messaging';

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/rentals" element={<RentalsList />} />
            <Route path="/jobs" element={<JobsList />} />
            <Route path="/skills" element={<SkillsList />} />
            <Route path="/businesses" element={<BusinessesList />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/ads" element={<AdDashboard />} />
            <Route path="/ads/create" element={<CreateAd />} />
            <Route path="/ads/success" element={<AdSuccess />} />
            <Route path="/ads/cancel" element={<AdCancel />} />
          </Routes>
        </main>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
