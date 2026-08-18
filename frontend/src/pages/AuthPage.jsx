import React, { useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import API from '../services/api';
import { Lock, Mail, User, Kanban } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useBoardStore((state) => state.setUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // Log in
        const res = await API.post('/users/login', { email, password });
        setUser(res.data, res.data.token);
      } else {
        // Sign up
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        const res = await API.post('/users', { username, email, password });
        setUser(res.data, res.data.token);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo" style={{ display: 'flex', justifyContent: 'center', color: '#6366f1' }}>
            <Kanban size={40} style={{ filter: 'drop-shadow(var(--glow-primary))' }} />
          </div>
          <h2 className="auth-title">CoBoard</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Collaborative Realtime Workspace' : 'Create your free account'}
          </p>
        </div>

        {errorMsg && (
          <div 
            style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              color: '#f87171', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-form-group">
              <label className="auth-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <p>
              New to CoBoard? <span onClick={() => { setIsLogin(false); setErrorMsg(''); }}>Sign Up</span>
            </p>
          ) : (
            <p>
              Already have an account? <span onClick={() => { setIsLogin(true); setErrorMsg(''); }}>Sign In</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
