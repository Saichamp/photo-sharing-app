import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MultiStepForm from './components/MultiStepForm';
import Dashboard from './pages/Dashboard';
import './App.css';
// In App.js, verify you have this exact route:
<Route path="/register/:eventId" element={<MultiStepForm />} />

// Simple Home Page Component
const HomePage = () => (
  <div className="container">
    <div className="card" style={{ textAlign: 'center' }}>
      <h1 style={{ color: '#1E2A38', marginBottom: '20px' }}>PhotoEvents MVP</h1>
      <p style={{ color: '#8A8A8A', marginBottom: '30px' }}>
        Choose your role to continue:
      </p>
      <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
        <Link 
          to="/register" 
          style={{ textDecoration: 'none' }}
        >
          <button className="btn-primary">
            👤 Guest Registration
          </button>
        </Link>
        <Link 
          to="/dashboard" 
          style={{ textDecoration: 'none' }}
        >
          <button 
            className="btn-primary"
            style={{ 
              background: 'linear-gradient(135deg, #2AC4A0 0%, #20A085 100%)' 
            }}
          >
            📊 Event Organizer Dashboard
          </button>
        </Link>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<MultiStepForm />} />
          <Route path="/register/:eventId" element={<MultiStepForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
