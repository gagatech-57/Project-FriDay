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
  CheckCircle2,
  Check
} from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthCard({ onLoginSuccess, onRequirePasskey }) {
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
        setSuccessMsg('Account created! Proceeding to Passkey verification...');
        setTimeout(() => {
          onRequirePasskey({ email, user: res.user, token: res.token });
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    }
  };

  return (
    <div className="glass-card-wrapper">
      <div className="glass-card">
        {/* Card Header Banner */}
        <div className="card-header-banner">
          <h2 className="card-header-title">
            {activeTab === 'login' ? 'MEMBER LOGIN' : 'CREATE ACCOUNT'}
          </h2>
        </div>

        <div className="card-body">
          {/* Notifications */}
          {errorMsg && (
            <div className="alert-box alert-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Name Field (Register Mode Only) */}
            {activeTab === 'register' && (
              <div className="form-group">
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="YOUR FIRST & LAST NAME"
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
              <div className="input-wrapper">
                <input
                  type="email"
                  className="input-field"
                  placeholder="YOUR E-MAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={18} className="input-icon" />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="YOUR PASSWORD"
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
                <div className="input-wrapper">
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    className="input-field"
                    placeholder="YOUR 4-DIGIT PASSKEY (PIN)"
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

            {/* Submit Glossy Pill Button */}
            <div className="action-button-container">
              <button type="submit" className="btn-glossy-pill" disabled={loading}>
                {loading ? (
                  <span>AUTHENTICATING...</span>
                ) : activeTab === 'login' ? (
                  <span>LOGIN</span>
                ) : (
                  <span>REGISTER ACCOUNT</span>
                )}
              </button>
            </div>

            {/* Remember Me Checkbox & Options */}
            {activeTab === 'login' && (
              <div className="form-options">
                <label className="checkbox-label" onClick={() => setRememberMe(!rememberMe)}>
                  <div className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                    {rememberMe && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>
            )}
          </form>
        </div>

        {/* Bottom Toggle Footer */}
        <div className="card-footer">
          <div className="footer-divider"></div>
          <p className="footer-text">
            {activeTab === 'login' ? (
              <>
                Not a member?{' '}
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleTabSwitch('register')}
                >
                  CREATE ACCOUNT
                </button>
              </>
            ) : (
              <>
                Already a member?{' '}
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => handleTabSwitch('login')}
                >
                  SIGN IN
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
