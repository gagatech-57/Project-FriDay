import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, X, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordView({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSendResetCode = (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 700);
  };

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg('Please enter the verification code sent to your email.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg('Please ensure your new password meets all security requirements.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 800);
  };

  return (
    <div className="register-container">
      <div className="register-card" style={{ maxWidth: '440px' }}>
        {step === 1 && (
          <>
            <div className="register-card-header">
              <div className="brand-logo-pill">
                <ShieldCheck size={22} color="var(--primary-accent)" />
                <span>Project Friday</span>
              </div>
              <h2>Forgot your password?</h2>
              <p>Enter your email address and we'll send you a password reset code.</p>
            </div>

            {errorMsg && (
              <div className="alert-box alert-error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendResetCode}>
              <div className="form-group">
                <label className="input-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} className="input-icon" />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary-action"
                disabled={loading}
                style={{ marginTop: '16px' }}
              >
                {loading ? (
                  <>
                    <div className="spinner-small" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer-prompt" style={{ marginTop: '20px' }}>
              Remembered your password?{' '}
              <button type="button" onClick={onBackToLogin} className="inline-link-btn">
                Sign in
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="register-card-header">
              <h2>Set new password</h2>
              <p>Enter the 6-digit code sent to <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{email}</strong></p>
            </div>

            {errorMsg && (
              <div className="alert-box alert-error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group">
                <label className="input-label">6-Digit Code</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">New Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

                {newPassword.length > 0 && (
                  <div className="password-checklist">
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

              <div className="form-group">
                <label className="input-label">Confirm New Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Lock size={16} className="input-icon" />
                </div>
                {confirmPassword.length > 0 && (
                  <div className={`match-badge ${passwordsMatch ? 'match' : 'mismatch'}`}>
                    {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                    <span>{passwordsMatch ? 'Passwords match' : "Passwords don't match"}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary-action"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                style={{ marginTop: '16px' }}
              >
                {loading ? (
                  <>
                    <div className="spinner-small" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div className="brand-icon-wrapper" style={{ width: '56px', height: '56px', margin: '0 auto 16px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
              <CheckCircle2 size={30} color="var(--success-color)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Password updated successfully
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your Project Friday account password has been updated. You can now sign in with your new password.
            </p>
            <button
              type="button"
              className="btn-primary-action"
              onClick={onBackToLogin}
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
