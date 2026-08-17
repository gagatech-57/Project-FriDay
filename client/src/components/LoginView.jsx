import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Cloud,
  LockKeyhole,
  Zap,
  ArrowRight
} from 'lucide-react';
import { loginUser } from '../services/api';

export default function LoginView({ onSwitchToRegister, onRequirePasskey, onForgotPassword, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill saved email
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('pf_saved_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (e) {
      console.warn('Could not read saved email');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      setLoading(false);

      if (res.success) {
        try {
          localStorage.setItem('pf_saved_email', email);
        } catch (e) {}

        if (res.requirePasskey) {
          onRequirePasskey({ email, user: res.user, token: res.token });
        } else {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMsg(res.message || "We couldn't sign you in. Please check your email and password.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("We couldn't sign you in. Please check your network connection.");
    }
  };

  return (
    <div className="login-split-container">
      {/* Left Visual Branding Panel */}
      <div className="login-visual-panel">
        <div className="login-brand-header">
          <div className="brand-logo-icon">
            <ShieldCheck size={28} color="#ffffff" />
          </div>
          <span className="brand-name">Project Friday</span>
        </div>

        <div className="login-hero-content">
          <h1 className="hero-tagline">
            Your personal files,<br />protected and organized.
          </h1>
          <p className="hero-subtext">
            Simple personal cloud storage with enterprise-grade security behind the scenes. Access your documents anywhere, anytime.
          </p>

          {/* Minimal Feature Highlights */}
          <div className="hero-features-list">
            <div className="feature-item">
              <div className="feature-icon"><LockKeyhole size={18} /></div>
              <div>
                <strong>Secure Storage</strong>
                <p>End-to-end payload isolation & GridFS data chunking</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Zap size={18} /></div>
              <div>
                <strong>Fast Streaming Uploads</strong>
                <p>Upload files up to 500MB with zero memory latency</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Cloud size={18} /></div>
              <div>
                <strong>Access Anywhere</strong>
                <p>Instant file preview, download, and multi-device sync</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-visual-footer">
          &copy; {new Date().getFullYear()} Project Friday. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-panel">
        <div className="form-inner-wrapper">
          <div className="form-header-text">
            <h2>Welcome back</h2>
            <p>Sign in to your Project Friday personal cloud storage</p>
          </div>

          {errorMsg && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Email Field */}
            <div className="form-group">
              <label className="input-label">Email address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <Mail size={16} className="input-icon" />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Password</label>
                <button
                  type="button"
                  className="forgot-link-btn"
                  onClick={onForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
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
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              className="btn-primary-action"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Secondary Passkey Option */}
          <div className="divider-line">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="btn-passkey-secondary"
            onClick={() => onRequirePasskey({ email: email || 'demo@friday.com' })}
            disabled={loading}
          >
            <KeyRound size={17} color="var(--primary-accent)" />
            <span>Continue with Passkey</span>
          </button>

          {/* Footer Register Link */}
          <div className="auth-footer-prompt">
            Don't have an account?{' '}
            <button type="button" onClick={onSwitchToRegister} className="inline-link-btn">
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
