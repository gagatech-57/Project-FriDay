import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  Cloud,
  LockKeyhole,
  Zap
} from 'lucide-react';
import { registerUser } from '../services/api';

export default function RegisterView({ onSwitchToLogin, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passkey, setPasskey] = useState('1234');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password Requirements Evaluation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Please ensure your password meets all security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser({ name, email, password, passkey });
      setLoading(false);

      if (res.success) {
        onRegisterSuccess({ email, user: res.user, token: res.token });
      } else {
        setErrorMsg(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Network error creating account. Please try again.');
    }
  };

  return (
    <div className="login-split-container">
      {/* Left Visual & Hero Panel (Matching Login Page) */}
      <div className="login-visual-panel">
        <div className="login-brand-header">
          <div className="brand-logo-icon">
            <ShieldCheck size={26} color="#00f2fe" />
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

          {/* Feature Highlights */}
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
      <div className="login-form-panel" style={{ overflowY: 'auto', padding: '40px 32px' }}>
        <div className="form-inner-wrapper" style={{ maxWidth: '440px' }}>
          <div className="form-header-text">
            <h2>Create account</h2>
            <p>Set up your Project Friday personal cloud storage space</p>
          </div>

          {errorMsg && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Full Name */}
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Guna Sekar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <User size={16} className="input-icon" />
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="input-field"
                  placeholder="guna@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} className="input-icon" />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} className="input-icon" />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="password-checklist">
                  <div className="checklist-title">Password requirements:</div>
                  <div className={`check-item ${hasMinLength ? 'valid' : ''}`}>
                    {hasMinLength ? <Check size={14} /> : <X size={14} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`check-item ${hasUppercase ? 'valid' : ''}`}>
                    {hasUppercase ? <Check size={14} /> : <X size={14} />}
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`check-item ${hasNumber ? 'valid' : ''}`}>
                    {hasNumber ? <Check size={14} /> : <X size={14} />}
                    <span>One number</span>
                  </div>
                  <div className={`check-item ${hasSpecial ? 'valid' : ''}`}>
                    {hasSpecial ? <Check size={14} /> : <X size={14} />}
                    <span>One special character</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Lock size={16} className="input-icon" />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className={`match-badge ${passwordsMatch ? 'match' : 'mismatch'}`}>
                  {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                  <span>{passwordsMatch ? 'Passwords match' : "Passwords don't match"}</span>
                </div>
              )}
            </div>

            {/* Security Passkey PIN */}
            <div className="form-group">
              <label className="input-label">Security Passkey PIN (4-digit)</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  className="input-field"
                  placeholder="1234"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  maxLength={4}
                  required
                />
                <KeyRound size={16} className="input-icon" />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-action"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              style={{ marginTop: '20px' }}
            >
              {loading ? (
                <>
                  <div className="spinner-small" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-prompt">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="inline-link-btn">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
