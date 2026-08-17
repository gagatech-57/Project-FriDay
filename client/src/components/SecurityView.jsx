import React from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Monitor, 
  CheckCircle2, 
  Lock, 
  Activity, 
  LogOut,
  Smartphone
} from 'lucide-react';

export default function SecurityView({ user, onRequirePasskey, onLogoutAll, onShowToast }) {
  return (
    <div className="view-container">
      <div className="view-page-header">
        <h2>Account Security</h2>
        <p>Manage your passkey authentication methods, active sessions, and audit security events.</p>
      </div>

      <div className="settings-sections-grid">
        {/* Authentication Methods */}
        <div className="settings-card">
          <div className="settings-card-title">
            <ShieldCheck size={18} color="var(--primary-accent)" />
            <span>Authentication Methods</span>
          </div>

          <div className="security-method-item">
            <div className="method-icon-box">
              <Lock size={18} color="#2563eb" />
            </div>
            <div className="method-info">
              <div className="method-title">Account Password</div>
              <div className="method-sub">Bcrypt hashed password protection</div>
            </div>
            <div className="method-badge active">Active</div>
          </div>

          <div className="security-method-item">
            <div className="method-icon-box">
              <KeyRound size={18} color="#10b981" />
            </div>
            <div className="method-info">
              <div className="method-title">Security Passkey PIN</div>
              <div className="method-sub">Level 2 secondary authentication</div>
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
              onClick={() => onRequirePasskey({ email: user ? user.email : '' })}
            >
              Test Passkey
            </button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="settings-card">
          <div className="settings-card-title">
            <Monitor size={18} color="var(--primary-accent)" />
            <span>Active Device Sessions</span>
          </div>

          <div className="security-method-item">
            <div className="method-icon-box">
              <Monitor size={18} color="#4f46e5" />
            </div>
            <div className="method-info">
              <div className="method-title">Windows PC &bull; Chrome Web Browser</div>
              <div className="method-sub">Current session &bull; Active just now</div>
            </div>
            <div className="method-badge active">Current</div>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button className="btn-secondary btn-danger-text" onClick={onLogoutAll}>
              <LogOut size={14} />
              <span>Sign out of all devices</span>
            </button>
          </div>
        </div>

        {/* Security Activity Audit Log */}
        <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="settings-card-title">
            <Activity size={18} color="var(--primary-accent)" />
            <span>Recent Security Activity</span>
          </div>

          <div className="audit-log-table-wrapper">
            <table className="file-list-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Device / Browser</th>
                  <th>IP Location</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={15} color="#10b981" />
                      <strong style={{ fontSize: '0.84rem' }}>Passkey Authenticated</strong>
                    </div>
                  </td>
                  <td>Chrome on Windows 11</td>
                  <td>Local Network (127.0.0.1)</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Just now</td>
                </tr>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={15} color="#10b981" />
                      <strong style={{ fontSize: '0.84rem' }}>Successful Login</strong>
                    </div>
                  </td>
                  <td>Chrome on Windows 11</td>
                  <td>Local Network (127.0.0.1)</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Today at 11:45 AM</td>
                </tr>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={15} color="#10b981" />
                      <strong style={{ fontSize: '0.84rem' }}>MongoDB GridFS Vault Storage Verified</strong>
                    </div>
                  </td>
                  <td>Node Express Server API</td>
                  <td>Internal Vault Engine</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Aug 17, 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
