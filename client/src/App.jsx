import React, { useState } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import AuthCard from './components/AuthCard';
import PasskeyModal from './components/PasskeyModal';
import VaultDashboard from './components/VaultDashboard';

export default function App() {
  // Application Stage: 'auth' | 'passkey_challenge' | 'vault_dashboard'
  const [stage, setStage] = useState('auth');
  const [authSession, setAuthSession] = useState(null); // { email, user, token }
  const [currentUser, setCurrentUser] = useState(null);

  const handleRequirePasskey = (sessionData) => {
    setAuthSession(sessionData);
    setStage('passkey_challenge');
  };

  const handlePasskeyVerified = (verifiedUserData) => {
    setCurrentUser(verifiedUserData);
    setStage('vault_dashboard');
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentUser(null);
    setStage('auth');
  };

  return (
    <>
      {/* Background sci-fi canvas effects */}
      <div className="bg-canvas">
        <div className="grid-overlay"></div>
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>

      <div className="app-container">
        {/* Top Header Branding (visible during auth & passkey challenge) */}
        {stage !== 'vault_dashboard' && (
          <header className="brand-header">
            <div className="brand-icon-wrapper">
              <div className="pulse-ring"></div>
              <Shield size={34} color="var(--cyan-glow)" />
            </div>
            <h1 className="brand-title">PROJECT FRIDAY</h1>
            <p className="brand-subtitle">SECURE DATA VAULT & AUTHENTICATION</p>
          </header>
        )}

        {/* Main Content Area */}
        {stage === 'auth' && (
          <AuthCard onRequirePasskey={handleRequirePasskey} />
        )}

        {stage === 'passkey_challenge' && authSession && (
          <PasskeyModal
            email={authSession.email}
            user={authSession.user}
            onVerified={handlePasskeyVerified}
            onCancel={() => setStage('auth')}
          />
        )}

        {stage === 'vault_dashboard' && currentUser && (
          <VaultDashboard user={currentUser} onLogout={handleLogout} />
        )}

        {/* Footer */}
        <footer style={{ marginTop: '36px', textTransform: 'uppercase', textAlign: 'center', fontSize: '0.72rem', color: '#4a5568', letterSpacing: '1px' }}>
          PROJECT FRIDAY SYSTEM &bull; LOCAL MONGODB BACKEND &bull; STAGE 1
        </footer>
      </div>
    </>
  );
}
