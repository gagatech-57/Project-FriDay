import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { verifyPasskey } from '../services/api';

const maskEmail = (emailStr) => {
  if (!emailStr || typeof emailStr !== 'string' || !emailStr.includes('@')) return emailStr;
  const [name, domain] = emailStr.split('@');
  const maskedName = name.length > 1 ? name[0] + '*'.repeat(name.length - 1) : name;
  const domainParts = domain.split('.');
  if (domainParts.length >= 2) {
    const mainDomain = domainParts[0];
    const extension = domainParts.slice(1).join('.');
    const maskedDomain = mainDomain.length > 1 ? mainDomain[0] + '*'.repeat(mainDomain.length - 1) : mainDomain;
    return `${maskedName}@${maskedDomain}.${extension}`;
  }
  return `${maskedName}@${domain}`;
};

export default function PasskeyModal({ email, user, onVerified, onCancel }) {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!passkeyInput) {
      setErrorMsg('Please enter your security Passkey.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await verifyPasskey(email, passkeyInput);
    setLoading(false);

    if (res.success) {
      onVerified({ ...user, passkeyVerified: true });
    } else {
      setErrorMsg(res.message || 'Invalid Passkey entered.');
      setPasskeyInput('');
    }
  };

  return (
    <div className="passkey-modal-overlay">
      <div className="passkey-card">
        {/* Navigation Bar */}
        <div className="passkey-nav-bar">
          <button onClick={onCancel} className="btn-back-link">
            <ArrowLeft size={16} /> BACK
          </button>
          <div className="passkey-badge">
            <ShieldAlert size={14} /> LEVEL 2 AUTH
          </div>
        </div>

        <div className="brand-icon-wrapper" style={{ width: '48px', height: '48px', margin: '0 auto 10px' }}>
          <KeyRound size={22} color="var(--primary-accent)" />
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: '700' }}>
          Passkey Required
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Enter PIN for <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>{maskEmail(email)}</span>
        </p>

        {errorMsg && (
          <div className="alert-box alert-error">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Security Dots Indicator */}
        <div className="passkey-dots">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className={`dot ${passkeyInput.length > idx ? 'filled' : ''}`} />
          ))}
        </div>

        {/* Form and Direct Keyboard Input */}
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '18px' }}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              className="input-field"
              style={{
                textAlign: 'center',
                letterSpacing: '8px',
                fontSize: '1.4rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '14px 16px',
                borderRadius: '16px'
              }}
              placeholder="••••"
              value={passkeyInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // keep numbers only
                setPasskeyInput(val);
                setErrorMsg('');
              }}
              maxLength={8}
              autoFocus
            />
          </div>

          <div className="action-button-container">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !passkeyInput}
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Unlock Security Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

