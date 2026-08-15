import React from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  FileText, 
  Image, 
  FileCode, 
  HardDrive, 
  Lock, 
  FolderLock,
  Cpu
} from 'lucide-react';

export default function VaultDashboard({ user, onLogout }) {
  const getInitials = (name) => {
    if (!name) return 'PF';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <div className="dashboard-header">
        <div className="user-badge">
          <div className="avatar">{getInitials(user.name)}</div>
          <div>
            <h2 className="dashboard-title">{user.name || 'Agent Vault'}</h2>
            <p className="dashboard-email">{user.email}</p>
          </div>
        </div>

        <button onClick={onLogout} className="btn-secondary">
          <LogOut size={16} />
          <span>SIGN OUT</span>
        </button>
      </div>

      {/* Security Status Banner */}
      <div className="security-banner">
        <div className="security-banner-info">
          <ShieldCheck size={22} color="var(--primary-accent)" />
          <div>
            <h4 className="security-banner-title">Encrypted Vault Active</h4>
            <p className="security-banner-desc">
              Level 2 Passkey authentication passed. Account connected to local MongoDB.
            </p>
          </div>
        </div>
        <div className="status-indicator">
          <Cpu size={14} /> ONLINE
        </div>
      </div>

      {/* Vault Storage Overview */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
            <HardDrive size={16} color="var(--primary-accent)" /> Dormant Vault Storage
          </h3>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            READY FOR FILES
          </span>
        </div>

        <div className="vault-dormant-card">
          <div className="brand-icon-wrapper" style={{ width: '48px', height: '48px', margin: '0 auto 12px' }}>
            <FolderLock size={22} color="var(--primary-accent)" />
          </div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: '700' }}>
            Stage 1 Authentication Complete
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 18px', lineHeight: '1.5' }}>
            Your account credentials and security passkey are encrypted and saved in MongoDB database (<code style={{ color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>project_friday</code>).
          </p>

          <p style={{ fontSize: '0.78rem', color: 'var(--primary-accent)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Supported File Formats for Stage 2:
          </p>
          <div className="file-type-tags">
            <span className="file-tag"><FileText size={13} /> .TXT</span>
            <span className="file-tag"><Image size={13} /> .PNG / .JPG</span>
            <span className="file-tag"><FileCode size={13} /> .PDF</span>
            <span className="file-tag"><Lock size={13} /> ALL FORMATS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

