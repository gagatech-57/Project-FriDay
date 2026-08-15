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
      setErrorMsg(res.message || 'Invalid Passkey.');
      setPasskeyInput('');
    }
  };

  return (
    <div className="passkey-modal-overlay">
      <div className="passkey-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem'
            }}
          >
            <ArrowLeft size={16} /> BACK
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-glow)', fontSize: '0.75rem', fontFamily: 'var(--font-hud)' }}>
            <ShieldAlert size={14} /> LEVEL 2 AUTH
          </div>
        </div>

        <div className="brand-icon-wrapper" style={{ width: '60px', height: '60px', margin: '0 auto 12px' }}>
          <KeyRound size={26} color="var(--cyan-glow)" />
        </div>

        <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '1.25rem', color: '#fff', marginBottom: '4px' }}>
          PASSKEY REQUIRED
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Enter passkey associated with <span style={{ color: 'var(--cyan-glow)' }}>{email}</span>
        </p>

        {errorMsg && (
          <div className="alert-box alert-error" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
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

        {/* Direct Text Input Fallback / Display */}
        <form onSubmit={handleVerify}>
          <input
            type="password"
            className="input-field"
            style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.4rem', fontFamily: 'var(--font-hud)', marginBottom: '20px' }}
            placeholder="••••"
            value={passkeyInput}
            onChange={(e) => {
              setPasskeyInput(e.target.value);
              setErrorMsg('');
            }}
            autoFocus
          />

          {/* Sci-Fi Virtual Keypad */}
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
            <button type="button" className="key-btn" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} onClick={handleClear}>
              CLR
            </button>
            <button type="button" className="key-btn" onClick={() => handleKeyPress('0')}>
              0
            </button>
            <button type="button" className="key-btn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={handleDelete}>
              <Delete size={18} />
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '24px' }}
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
        </form>
      </div>
    </div>
  );
}
