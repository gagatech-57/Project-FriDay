import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import AuthCard from './components/AuthCard';
import PasskeyModal from './components/PasskeyModal';
import VaultDashboard from './components/VaultDashboard';

export default function App() {
  // Application Stage: 'auth' | 'passkey_challenge' | 'vault_dashboard'
  const [stage, setStage] = useState('auth');
  const [authSession, setAuthSession] = useState(null); // { email, user, token }
  const [currentUser, setCurrentUser] = useState(null);

  // Auto-restore saved session from localStorage on app start
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('pf_user_session');
      if (savedSession) {
        const parsedUser = JSON.parse(savedSession);
        if (parsedUser && parsedUser.email) {
          setCurrentUser(parsedUser);
          setStage('vault_dashboard');
        }
      }
    } catch (err) {
      console.warn('Could not restore local user session:', err);
    }
  }, []);

  const handleRequirePasskey = (sessionData) => {
    setAuthSession(sessionData);
    setStage('passkey_challenge');
  };

  const handlePasskeyVerified = (verifiedUserData) => {
    setCurrentUser(verifiedUserData);
    setStage('vault_dashboard');
    try {
      localStorage.setItem('pf_user_session', JSON.stringify(verifiedUserData));
    } catch (err) {
      console.warn('Could not save user session locally:', err);
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentUser(null);
    setStage('auth');
    try {
      localStorage.removeItem('pf_user_session');
    } catch (err) {
      console.warn('Could not remove user session:', err);
    }
  };

  const containerClass = stage === 'vault_dashboard' 
    ? 'app-container app-dashboard-mode' 
    : 'app-container app-auth-mode';

  return (
    <>
      {/* Background canvas effects */}
      <div className="bg-canvas">
        <div className="grid-overlay"></div>
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>

      <div className={containerClass}>
        {/* Top Header Branding (visible during auth & passkey challenge) */}
        {stage !== 'vault_dashboard' && (
          <header className="brand-header">
            <div className="brand-icon-wrapper">
              <ShieldCheck size={30} color="var(--primary-accent)" />
            </div>
            <h1 className="brand-title">Project Friday</h1>
            <p className="brand-subtitle">CLASSIFIED DATA VAULT &bull; LEVEL 2 PROTOCOL</p>
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
      </div>
    </>
  );
}



