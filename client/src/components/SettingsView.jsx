import React, { useState } from 'react';
import { User, Sun, Moon, Monitor, Bell, HardDrive, ShieldCheck, Check } from 'lucide-react';
import { updateUserSettingsApi } from '../services/api';

export default function SettingsView({ user, currentTheme, onThemeChange, storageUsedMB = 12.4, storageTotalMB = 5120, onShowToast }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const percentUsed = Math.min(100, Math.max(2, (storageUsedMB / storageTotalMB) * 100));

  const handleSelectTheme = (theme) => {
    onThemeChange(theme);
    if (user && user.email) {
      updateUserSettingsApi({ email: user.email, themePreference: theme });
    }
    if (onShowToast) onShowToast(`Appearance theme set to ${theme}`, 'info');
  };

  return (
    <div className="view-container">
      <div className="view-page-header">
        <h2>Settings</h2>
        <p>Manage your account preferences, appearance, and cloud storage.</p>
      </div>

      <div className="settings-sections-grid">
        {/* Account Summary Card */}
        <div className="settings-card">
          <div className="settings-card-title">
            <User size={18} color="var(--primary-accent)" />
            <span>Account Overview</span>
          </div>

          <div className="settings-field-group">
            <label className="settings-label">Full Name</label>
            <div className="settings-read-value">{user ? user.name : 'Guna'}</div>
          </div>

          <div className="settings-field-group">
            <label className="settings-label">Email Address</label>
            <div className="settings-read-value">{user ? user.email : 'guna@example.com'}</div>
          </div>
        </div>

        {/* Appearance Theme Selector */}
        <div className="settings-card">
          <div className="settings-card-title">
            <Sun size={18} color="var(--primary-accent)" />
            <span>Appearance Theme</span>
          </div>
          <p className="settings-card-desc">Choose your preferred visual theme for Project Friday.</p>

          <div className="theme-options-grid">
            <button
              className={`theme-option-card ${currentTheme === 'light' ? 'active' : ''}`}
              onClick={() => handleSelectTheme('light')}
            >
              <div className="theme-icon-box">
                <Sun size={20} />
              </div>
              <div className="theme-label">Light</div>
              {currentTheme === 'light' && <Check size={14} className="theme-check-icon" />}
            </button>

            <button
              className={`theme-option-card ${currentTheme === 'dark' ? 'active' : ''}`}
              onClick={() => handleSelectTheme('dark')}
            >
              <div className="theme-icon-box">
                <Moon size={20} />
              </div>
              <div className="theme-label">Dark</div>
              {currentTheme === 'dark' && <Check size={14} className="theme-check-icon" />}
            </button>

            <button
              className={`theme-option-card ${currentTheme === 'system' ? 'active' : ''}`}
              onClick={() => handleSelectTheme('system')}
            >
              <div className="theme-icon-box">
                <Monitor size={20} />
              </div>
              <div className="theme-label">System</div>
              {currentTheme === 'system' && <Check size={14} className="theme-check-icon" />}
            </button>
          </div>
        </div>

        {/* Cloud Storage Usage */}
        <div className="settings-card">
          <div className="settings-card-title">
            <HardDrive size={18} color="var(--primary-accent)" />
            <span>Storage Allocation</span>
          </div>

          <div className="storage-meter-large">
            <div className="meter-header">
              <span className="meter-title">Used Storage</span>
              <span className="meter-values">{storageUsedMB} MB / 5 GB</span>
            </div>
            <div className="meter-bar-track">
              <div className="meter-bar-fill" style={{ width: `${percentUsed}%` }} />
            </div>
            <div className="meter-subtext">MongoDB GridFS Chunked Storage Enabled</div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card-title">
            <Bell size={18} color="var(--primary-accent)" />
            <span>Notifications</span>
          </div>

          <div className="toggle-setting-row">
            <div>
              <div className="toggle-title">Security & Passkey Alerts</div>
              <div className="toggle-sub">Receive email alerts when a new passkey login occurs.</div>
            </div>
            <input
              type="checkbox"
              checked={securityAlerts}
              onChange={(e) => setSecurityAlerts(e.target.checked)}
              className="settings-toggle-checkbox"
            />
          </div>

          <div className="toggle-setting-row" style={{ border: 'none', paddingBottom: 0 }}>
            <div>
              <div className="toggle-title">Storage Updates</div>
              <div className="toggle-sub">Get notified when storage exceeds 80% capacity.</div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="settings-toggle-checkbox"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
