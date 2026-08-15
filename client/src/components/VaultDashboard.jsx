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
          <ShieldCheck size={26} color="var(--cyan-accent)" />
          <div>
            <h4 className="security-banner-title">FRIDAY ENCRYPTED VAULT ACTIVE</h4>
            <p className="security-banner-desc">
              Level 2 Passkey authentication passed. Account & database connection established.
            </p>
          </div>
        </div>
        <div className="status-indicator">
          <Cpu size={15} /> ONLINE
        </div>
      </div>

      {/* Vault Storage Overview */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} color="var(--cyan-accent)" /> DORMANT VAULT STORAGE
          </h3>
          <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            STATUS: READY FOR FILES
          </span>
        </div>

        <div className="vault-dormant-card">
          <div className="brand-icon-wrapper" style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}>
            <FolderLock size={30} color="var(--cyan-accent)" />
          </div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#fff', marginBottom: '8px' }}>
            STAGE 1 COMPLETED
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 22px', lineHeight: '1.6' }}>
            Your account data (Name, Email, Password, and Passkey) are safely stored in your local MongoDB database (<code style={{ color: 'var(--cyan-accent)', fontFamily: 'var(--font-mono)' }}>project_friday</code>). Your dormant file storage vault is locked and waiting for data!
          </p>

          <p style={{ fontSize: '0.8rem', color: 'var(--cyan-accent)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
            SUPPORTED FILE TYPES FOR STAGE 2:
          </p>
          <div className="file-type-tags">
            <span className="file-tag"><FileText size={14} /> .TXT</span>
            <span className="file-tag"><Image size={14} /> .PNG / .JPG</span>
            <span className="file-tag"><FileCode size={14} /> .PDF</span>
            <span className="file-tag"><Lock size={14} /> ALL FORMATS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

