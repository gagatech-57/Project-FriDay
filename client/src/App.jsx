import React, { useState } from 'react';
import { Shield } from 'lucide-react';
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
      {/* Background canvas effects */}
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
              <Shield size={28} color="var(--primary-accent)" />
            </div>
            <h1 className="brand-title">Project Friday</h1>
            <p className="brand-subtitle">Encrypted Data Vault & Security Stage 1</p>
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
        <footer className="app-footer">
          PROJECT FRIDAY SYSTEM &bull; LOCAL MONGODB BACKEND &bull; STAGE 1
        </footer>
      </div>
    </>
  );
}

