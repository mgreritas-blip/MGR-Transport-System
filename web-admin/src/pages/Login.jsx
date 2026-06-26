import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusFront, KeyRound } from 'lucide-react';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate Login
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card">
        <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <img src={logo} alt="Dr MGR University Logo" style={{ width: '100%', maxWidth: '380px', background: 'white', padding: '15px', borderRadius: '8px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Transport Admin</h2>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email / ID</label>
            <input 
              type="text" 
              placeholder="admin@college.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <div className="login-actions">
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <KeyRound size={18} style={{ marginRight: '8px' }} /> Login
            </button>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <a href="#" className="forgot-pwd">Forgot Password?</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
