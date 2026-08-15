import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthCard({ onLoginSuccess, onRequirePasskey }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPasskey('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (activeTab === 'login') {
      if (!email || !password) {
        setErrorMsg('Please fill in both Email and Password.');
        setLoading(false);
        return;
      }

      const res = await loginUser({ email, password });
      setLoading(false);

      if (res.success) {
        setSuccessMsg(res.message);
        // Trigger passkey prompt modal
        setTimeout(() => {
          onRequirePasskey({ email, user: res.user, token: res.token });
        }, 800);
      } else {
        setErrorMsg(res.message || 'Login failed.');
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
        setSuccessMsg('Account created successfully! Proceeding to Passkey verification...');
        setTimeout(() => {
          onRequirePasskey({ email, user: res.user, token: res.token });
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    }
  };

  return (
    <div className="glass-card">
      {/* Navigation Tabs */}
      <div className="tab-switcher">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('login')}
        >
          <LogIn size={15} />
          SIGN IN
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('register')}
        >
          <UserPlus size={15} />
          CREATE ACCOUNT
        </button>
      </div>

      {/* Notifications */}
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

      {/* Auth Form */}
      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Name Field (Register Mode Only) */}
        {activeTab === 'register' && (
          <div className="form-group">
            <label className="form-label">FULL NAME</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Tony Stark"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User size={18} className="input-icon" />
            </div>
          </div>
        )}

        {/* Email Field */}
        <div className="form-group">
          <label className="form-label">EMAIL ADDRESS</label>
          <div className="input-wrapper">
            <input
              type="email"
              className="input-field"
              placeholder="friday@starkindustries.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail size={18} className="input-icon" />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label className="form-label">
            <span>PASSWORD</span>
            {activeTab === 'register' && <span style={{ fontSize: '0.7rem', color: '#718096' }}>Min 6 chars</span>}
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock size={18} className="input-icon" />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Passkey Field (Register Mode Only) */}
        {activeTab === 'register' && (
          <div className="form-group">
            <label className="form-label">
              <span>SECURITY PASSKEY (PIN)</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--cyan-glow)' }}>Used to unlock vault</span>
            </label>
            <div className="input-wrapper">
              <input
                type={showPasskey ? 'text' : 'password'}
                className="input-field"
                placeholder="4-8 Digit Passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                maxLength={8}
                required
              />
              <KeyRound size={18} className="input-icon" />
              <button
                type="button"
                className="input-toggle-btn"
                onClick={() => setShowPasskey(!showPasskey)}
              >
                {showPasskey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span>AUTHENTICATING...</span>
          ) : activeTab === 'login' ? (
            <>
              <LogIn size={18} />
              <span>SIGN IN TO VAULT</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>CREATE SECURE ACCOUNT</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
