import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function EmailVerifyView({ email, onVerificationComplete, onChangeEmail }) {
  const [cooldown, setCooldown] = useState(45);
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setCooldown(45);
      setResentMsg('A new verification code has been dispatched to your email.');
    }, 800);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onVerificationComplete();
    }, 600);
  };

  return (
    <div className="register-container">
      <div className="register-card" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="brand-icon-wrapper" style={{ width: '56px', height: '56px', margin: '0 auto 16px', background: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <Mail size={28} color="var(--primary-accent)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '1.4rem', color: 'var(--text-primary)' }}>
            Check your email
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
            We've sent a 6-digit security code to<br />
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{email || 'user@example.com'}</strong>
          </p>
        </div>

        {resentMsg && (
          <div className="alert-box alert-success" style={{ marginBottom: '16px' }}>
            <CheckCircle2 size={18} />
            <span>{resentMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerifyCode}>
          <div className="form-group">
            <label className="input-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-digit code</label>
            <input
              type="text"
              className="input-field"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary-action"
            disabled={verifying || otpCode.length < 4}
            style={{ marginTop: '16px' }}
          >
            {verifying ? (
              <>
                <div className="spinner-small" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify Email</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="inline-link-btn"
            style={{ fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={resending ? 'spin-icon' : ''} />
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification code'}
          </button>

          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={onChangeEmail}
              className="forgot-link-btn"
              style={{ fontSize: '0.82rem' }}
            >
              Use a different email address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
