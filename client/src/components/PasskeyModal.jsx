import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowLeft, CheckCircle, AlertCircle, Delete } from 'lucide-react';
import { verifyPasskey } from '../services/api';

export default function PasskeyModal({ email, user, onVerified, onCancel }) {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeyPress = (num) => {
    if (passkeyInput.length < 8) {
      setPasskeyInput((prev) => prev + num);
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    setPasskeyInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPasskeyInput('');
    setErrorMsg('');
  };

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

        <div className="brand-icon-wrapper" style={{ width: '64px', height: '64px', margin: '0 auto 14px' }}>
          <KeyRound size={28} color="var(--cyan-accent)" />
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#fff', marginBottom: '6px' }}>
          PASSKEY REQUIRED
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Enter PIN for <span style={{ color: 'var(--cyan-accent)', fontWeight: '600' }}>{email}</span>
        </p>

        {errorMsg && (
          <div className="alert-box alert-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Security Dots Indicator */}
        <div className="passkey-dots">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className={`dot ${passkeyInput.length > idx ? 'filled' : ''}`} />
          ))}
        </div>

        {/* Form and Keypad */}
        <form onSubmit={handleVerify}>
          <input
            type="password"
            className="input-field"
            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontFamily: 'var(--font-mono)', marginBottom: '20px' }}
            placeholder="••••"
            value={passkeyInput}
            onChange={(e) => {
              setPasskeyInput(e.target.value);
              setErrorMsg('');
            }}
            maxLength={8}
            autoFocus
          />

          {/* Virtual Keypad */}
          <div className="keypad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                className="key-btn"
                onClick={() => handleKeyPress(digit)}
              >
                {digit}
              </button>
            ))}
            <button 
              type="button" 
              className="key-btn" 
              style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} 
              onClick={handleClear}
            >
              CLR
            </button>
            <button type="button" className="key-btn" onClick={() => handleKeyPress('0')}>
              0
            </button>
            <button type="button" className="key-btn" onClick={handleDelete} title="Delete">
              <Delete size={20} />
            </button>
          </div>

          <div className="action-button-container">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !passkeyInput}
            >
              {loading ? (
                <span>VERIFYING PASSKEY...</span>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>UNLOCK FRIDAY VAULT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

