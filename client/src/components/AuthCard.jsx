import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  AlertCircle,
  CheckCircle2,
  Check,
  BookmarkCheck
} from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthCard({ onRequirePasskey }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-fill saved email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('pf_saved_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (err) {
      console.warn('Could not read saved email:', err);
    }
  }, []);

  const resetForm = () => {
    setName('');
    setPassword('');
    setPasskey('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  // Password strength score (0 to 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'EMPTY', color: '#4a5568' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1: return { score: 25, text: 'WEAK', color: '#ff4757' };
      case 2: return { score: 50, text: 'FAIR', color: '#ffa502' };
      case 3: return { score: 75, text: 'STRONG', color: '#2ed573' };
      case 4: return { score: 100, text: 'EXCELLENT', color: '#00f2fe' };
      default: return { score: 15, text: 'TOO SHORT', color: '#ff4757' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    // Save or clear remembered email
    try {
      if (rememberMe && email) {
        localStorage.setItem('pf_saved_email', email);
      } else {
        localStorage.removeItem('pf_saved_email');
      }
    } catch (err) {
      console.warn('Could not update saved email:', err);
    }

    if (activeTab === 'login') {
      if (!email || !password) {
        setErrorMsg('Please enter both Email and Password.');
        setLoading(false);
        return;
      }

      const res = await loginUser({ email, password });
      setLoading(false);

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onRequirePasskey({ email, user: res.user, token: res.token });
        }, 600);
      } else {
        setErrorMsg(res.message || 'Login failed. Please verify credentials.');
      }
    } else {
      // Register
      if (!name || !email || !password || !passkey) {
        setErrorMsg('All fields are required: Name, Email, Password, and Passkey.');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }

      if (passkey.length < 4) {
        setErrorMsg('Passkey must be at least 4 digits/characters.');
        setLoading(false);
        return;
      }

      const res = await registerUser({ name, email, password, passkey });
      setLoading(false);

      if (res.success) {
        setSuccessMsg('Account created! Proceeding to Passkey verification...');
        setTimeout(() => {
          onRequirePasskey({ email, user: res.user, token: res.token });
        }, 800);
      } else {
        setErrorMsg(res.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="glass-card-wrapper">
      <div className="glass-card">
        {/* Interactive Tab Switcher Banner */}
        <div className="card-header-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >
            <LogIn size={16} /> SIGN IN
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('register')}
          >
            <UserPlus size={16} /> REGISTER
          </button>
        </div>

        <div className="card-body">
          {/* Status Notifications */}
          {errorMsg && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Name Field (Register Mode Only) */}
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="input-label">Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <User size={16} className="input-icon" />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} className="input-icon" />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} className="input-icon" />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength Meter (Register Mode) */}
              {activeTab === 'register' && password.length > 0 && (
                <div className="strength-meter">
                  <div className="strength-bar-bg">
                    <div 
                      className="strength-bar-fill" 
                      style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                    />
                  </div>
                  <span className="strength-text" style={{ color: strength.color }}>
                    {strength.text}
                  </span>
                </div>
              )}
            </div>

            {/* Passkey Field (Register Mode Only) */}
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="input-label">Security Passkey (PIN)</label>
                <div className="input-wrapper">
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    className="input-field"
                    placeholder="4-digit PIN"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    maxLength={8}
                    required
                  />
                  <KeyRound size={16} className="input-icon" />
                  <button
                    type="button"
                    className="input-toggle-btn"
                    onClick={() => setShowPasskey(!showPasskey)}
                    title={showPasskey ? "Hide passkey" : "Show passkey"}
                  >
                    {showPasskey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me / Save Login Session Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 16px', cursor: 'pointer' }} onClick={() => setRememberMe(!rememberMe)}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-accent)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Save login session on this device
              </span>
            </div>

            {/* Submit Action Button */}
            <div className="action-button-container">
              <button type="submit" className="btn-glossy-pill" disabled={loading}>
                {loading ? (
                  <span>Authenticating...</span>
                ) : activeTab === 'login' ? (
                  <>
                    <LogIn size={16} />
                    <span>Sign In to Vault</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>

            {/* Remember Me & Options */}
            {activeTab === 'login' && (
              <div className="form-options">
                <div 
                  className="checkbox-label" 
                  onClick={() => setRememberMe(!rememberMe)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                    {rememberMe && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span>Remember me</span>
                </div>
                <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>
            )}
          </form>
        </div>

        {/* Card Footer */}
        <div className="card-footer">
          <p className="footer-text">
            {activeTab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleTabSwitch('register')}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleTabSwitch('login')}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

