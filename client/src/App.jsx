import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import EmailVerifyView from './components/EmailVerifyView';
import ForgotPasswordView from './components/ForgotPasswordView';
import PasskeyModal from './components/PasskeyModal';
import OnboardingModal from './components/OnboardingModal';
import VaultDashboard from './components/VaultDashboard';
import ToastNotification from './components/ToastNotification';

export default function App() {
  // Navigation View Stage: 'login' | 'register' | 'verify-email' | 'forgot-password' | 'passkey_challenge' | 'app'
  const [stage, setStage] = useState('login');
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [authSession, setAuthSession] = useState(null); // { email, user, token }
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  // Toasts Stack
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Restore saved session & theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('pf_theme_pref');
      if (savedTheme) {
        setCurrentTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      }

      const savedSession = localStorage.getItem('pf_user_session');
      if (savedSession) {
        const parsedUser = JSON.parse(savedSession);
        if (parsedUser && parsedUser.email) {
          setCurrentUser(parsedUser);
          setStage('app');
        }
      }
    } catch (err) {
      console.warn('Could not restore session:', err);
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('pf_theme_pref', newTheme);
    } catch (e) {}
  };

  const handleRequirePasskey = (sessionData) => {
    setAuthSession(sessionData);
    setStage('passkey_challenge');
  };

  const handlePasskeyVerified = (verifiedUserData) => {
    setCurrentUser(verifiedUserData);
    setStage('app');
    addToast(`Welcome back, ${verifiedUserData.name || 'Guna'}!`, 'success');
    try {
      localStorage.setItem('pf_user_session', JSON.stringify(verifiedUserData));
    } catch (err) {}
  };

  const handleRegisterSuccess = (sessionData) => {
    setAuthSession(sessionData);
    setStage('verify-email');
  };

  const handleEmailVerificationComplete = () => {
    if (authSession && authSession.user) {
      setCurrentUser(authSession.user);
      try {
        localStorage.setItem('pf_user_session', JSON.stringify(authSession.user));
      } catch (e) {}
    } else {
      setCurrentUser({ name: 'Guna', email: authSession ? authSession.email : 'guna@example.com' });
    }

    setStage('app');
    setShowOnboarding(true);
    addToast('Account created & verified successfully!', 'success');
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentUser(null);
    setStage('login');
    setShowOnboarding(false);
    addToast('Signed out successfully', 'info');
    try {
      localStorage.removeItem('pf_user_session');
    } catch (err) {}
  };

  return (
    <>
      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Main Application Container */}
      <div className={`app-root-shell ${currentTheme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
        {stage === 'login' && (
          <LoginView
            onSwitchToRegister={() => setStage('register')}
            onRequirePasskey={handleRequirePasskey}
            onForgotPassword={() => setStage('forgot-password')}
            onLoginSuccess={(userObj) => {
              setCurrentUser(userObj);
              setStage('app');
              addToast(`Welcome back, ${userObj.name}!`, 'success');
              try {
                localStorage.setItem('pf_user_session', JSON.stringify(userObj));
              } catch (e) {}
            }}
          />
        )}

        {stage === 'register' && (
          <RegisterView
            onSwitchToLogin={() => setStage('login')}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}

        {stage === 'verify-email' && (
          <EmailVerifyView
            email={authSession ? authSession.email : 'user@example.com'}
            onVerificationComplete={handleEmailVerificationComplete}
            onChangeEmail={() => setStage('register')}
          />
        )}

        {stage === 'forgot-password' && (
          <ForgotPasswordView
            onBackToLogin={() => setStage('login')}
          />
        )}

        {stage === 'passkey_challenge' && authSession && (
          <PasskeyModal
            email={authSession.email}
            user={authSession.user}
            onVerified={handlePasskeyVerified}
            onCancel={() => setStage('login')}
          />
        )}

        {stage === 'app' && currentUser && (
          <VaultDashboard
            user={currentUser}
            onLogout={handleLogout}
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            onRequirePasskey={handleRequirePasskey}
            onShowToast={addToast}
            activeNavTab={activeNavTab}
            onSelectNavTab={setActiveNavTab}
          />
        )}

        {/* Onboarding Welcome Screen */}
        {showOnboarding && currentUser && (
          <OnboardingModal
            userName={currentUser.name}
            onUploadClick={() => {
              setShowOnboarding(false);
              setActiveNavTab('files');
            }}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
      </div>
    </>
  );
}
