import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdDashboard from './pages/AdDashboard';
import CreateAd from './pages/CreateAd';
import AdSuccess from './pages/AdSuccess';
import AdCancel from './pages/AdCancel';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ads" element={<AdDashboard />} />
            <Route path="/ads/create" element={<CreateAd />} />
            <Route path="/ads/success" element={<AdSuccess />} />
            <Route path="/ads/cancel" element={<AdCancel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
