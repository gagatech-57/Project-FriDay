fix import React, { useState } from 'react';
import { 
  Smartphone, 
  KeyRound, 
  Lock, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ArrowLeft,
  ShieldCheck,
  Check,
  MessageSquare,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { sendWhatsAppOtpApi, verifyWhatsAppOtpResetApi } from '../services/api';

export default function SmsResetModal({ initialMode = 'password', onClose, onResetSuccess }) {
  // Reset Mode: 'password' | 'passkey'
  const [resetType, setResetType] = useState(initialMode);
  
  // Step: 1 (Request OTP), 2 (Verify OTP), 3 (Set New Credential)
  const [step, setStep] = useState(1);

  // Form inputs
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState('');

  // Step 1: Send WhatsApp Security OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!emailOrMobile) {
      setErrorMsg('Please enter your Mobile Phone Number or Email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await sendWhatsAppOtpApi({ emailOrMobile, type: resetType });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('WhatsApp security message dispatched!');
      if (res.whatsappUrl) {
        setWhatsappUrl(res.whatsappUrl);
      }
      if (res.otpSimulated) {
        setSimulatedOtpNotice(res.otpSimulated);
      }
      setOtpCode(''); // Keep input blank for manual user typing
      setStep(2);
    } else {
      setErrorMsg(res.message || 'Failed to send WhatsApp security code.');
    }
  };

  // Step 2: Verify 6-digit WhatsApp OTP Code
  const handleVerifyOtpCode = (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('Please enter the 6-digit WhatsApp OTP code.');
      return;
    }

    if (simulatedOtpNotice && otpCode.trim() !== simulatedOtpNotice.trim()) {
      setErrorMsg('Invalid WhatsApp OTP code. Please enter the correct code.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('WhatsApp OTP Verified! Set your new security credentials.');
    setStep(3);
  };

  // Auto-advance if 6 digits match
  const handleOtpInputChange = (e) => {
    const val = e.target.value;
    setOtpCode(val);
    setErrorMsg('');
    if (val.length === 6 && simulatedOtpNotice && val.trim() === simulatedOtpNotice.trim()) {
      setTimeout(() => {
        setErrorMsg('');
        setSuccessMsg('WhatsApp OTP Verified!');
        setStep(3);
      }, 300);
    }
  };

  // Step 3: Save New Password / Passkey PIN
  const handleSaveCredentials = async (e) => {
    if (e) e.preventDefault();

    if (resetType === 'password' && (!newPassword || newPassword.length < 6)) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (resetType === 'passkey' && (!newPasskey || newPasskey.length < 4)) {
      setErrorMsg('New Passkey PIN must be at least 4 digits.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await verifyWhatsAppOtpResetApi({
      emailOrMobile,
      otp: otpCode,
      newPassword,
      newPasskey,
      type: resetType
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (onResetSuccess) onResetSuccess();
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message || 'Error updating account credentials.');
    }
  };

  return (
    <div className="passkey-modal-overlay">
      <div className="passkey-card" style={{ maxWidth: '440px' }}>
        {/* Header Toolbar */}
        <div className="passkey-nav-bar">
          <button 
            type="button" 
            onClick={step > 1 ? () => setStep(step - 1) : onClose} 
            className="btn-back-link"
          >
            <ArrowLeft size={16} /> {step > 1 ? 'BACK' : 'CANCEL'}
          </button>
          <div className="passkey-badge" style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25d366', borderColor: 'rgba(37, 211, 102, 0.3)' }}>
            <MessageSquare size={14} color="#25d366" /> WHATSAPP OTP
          </div>
        </div>

        {/* Step Visual Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: '32px',
                height: '4px',
                borderRadius: '4px',
                background: step >= s ? '#25d366' : 'rgba(203, 213, 225, 0.6)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Brand Header */}
        <div className="brand-icon-wrapper" style={{ width: '52px', height: '52px', margin: '0 auto 12px', background: 'rgba(37, 211, 102, 0.08)', borderColor: 'rgba(37, 211, 102, 0.25)' }}>
          {resetType === 'password' ? (
            <Lock size={24} color="#25d366" />
          ) : (
            <KeyRound size={24} color="#25d366" />
          )}
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: '800' }}>
          {step === 1 && `WhatsApp ${resetType === 'password' ? 'Password' : 'Passkey PIN'} Reset`}
          {step === 2 && 'Verify WhatsApp Security OTP'}
          {step === 3 && `Set New ${resetType === 'password' ? 'Password' : 'Passkey PIN'}`}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {step === 1 && 'Enter mobile number to receive 6-digit WhatsApp security code message'}
          {step === 2 && 'Enter the 6-digit security code message sent to WhatsApp'}
          {step === 3 && `Enter new ${resetType === 'password' ? 'password' : 'passkey PIN'} for account`}
        </p>

        {/* Tab Selector between Password and Passkey */}
        {step === 1 && (
          <div className="card-header-tabs" style={{ margin: '0 0 16px' }}>
            <button
              type="button"
              className={`tab-btn ${resetType === 'password' ? 'active' : ''}`}
              onClick={() => {
                setResetType('password');
                setErrorMsg('');
              }}
            >
              <Lock size={14} /> RESET PASSWORD
            </button>
            <button
              type="button"
              className={`tab-btn ${resetType === 'passkey' ? 'active' : ''}`}
              onClick={() => {
                setResetType('passkey');
                setErrorMsg('');
              }}
            >
              <KeyRound size={14} /> RESET PASSKEY
            </button>
          </div>
        )}

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="alert-box alert-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-box alert-success" style={{ background: 'rgba(37, 211, 102, 0.1)', borderColor: 'rgba(37, 211, 102, 0.3)', color: '#059669' }}>
            <CheckCircle size={16} color="#25d366" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1 FORM: Enter Mobile Number / Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="input-label">Mobile Phone Number (WhatsApp)</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-field"
                  placeholder="+1 (555) 019-2834 or user@domain.com"
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  required
                  autoFocus
                />
                <Smartphone size={16} className="input-icon" />
              </div>
            </div>

            <div className="action-button-container">
              <button 
                type="submit" 
                className="btn-glossy-pill" 
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)' }}
              >
                {loading ? (
                  <span>Sending WhatsApp Message...</span>
                ) : (
                  <>
                    <MessageCircle size={16} color="#ffffff" />
                    <span>Send WhatsApp Security Code</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 FORM: Verify WhatsApp OTP Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpCode}>
            {/* Quick Trigger Button to open WhatsApp app directly */}
            {whatsappUrl && (
              <div style={{ marginBottom: '16px' }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justify-content: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(37, 211, 102, 0.12)',
                    border: '1px solid rgba(37, 211, 102, 0.35)',
                    color: '#128c7e',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '700',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MessageCircle size={16} color="#25d366" />
                  <span>Open WhatsApp to View Code</span>
                  <ExternalLink size={14} color="#128c7e" />
                </a>
              </div>
            )}

            <div className="form-group">
              <label className="input-label">6-Digit WhatsApp Security Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-field"
                  style={{ letterSpacing: '6px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: '700' }}
                  placeholder="098099"
                  value={otpCode}
                  onChange={handleOtpInputChange}
                  maxLength={6}
                  required
                  autoFocus
                />
                <ShieldCheck size={16} className="input-icon" />
              </div>
            </div>

            <div className="action-button-container">
              <button 
                type="submit" 
                className="btn-glossy-pill" 
                disabled={loading || !otpCode}
                style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)' }}
              >
                <span>Verify WhatsApp Code & Next</span>
                <CheckCircle size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 FORM: Set New Password or Passkey PIN */}
        {step === 3 && (
          <form onSubmit={handleSaveCredentials}>
            {resetType === 'password' ? (
              <div className="form-group">
                <label className="input-label">New Account Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <Lock size={16} className="input-icon" />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="input-label">New Level 2 Passkey PIN</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    className="input-field"
                    style={{ letterSpacing: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                    placeholder="4 to 8 digit PIN"
                    value={newPasskey}
                    onChange={(e) => setNewPasskey(e.target.value)}
                    maxLength={8}
                    required
                    autoFocus
                  />
                  <KeyRound size={16} className="input-icon" />
                </div>
              </div>
            )}

            <div className="action-button-container">
              <button 
                type="submit" 
                className="btn-glossy-pill" 
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)' }}
              >
                {loading ? (
                  <span>Saving Credentials...</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save Credentials & Access Vault</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
