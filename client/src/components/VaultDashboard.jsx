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
    <div className="dashboard-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Top Header */}
      <div className="dashboard-header">
        <div className="user-badge">
          <div className="avatar">{getInitials(user.name)}</div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
              {user.name || 'Agent Vault'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {user.email}
            </p>
          </div>
        </div>

        <button onClick={onLogout} className="btn-secondary">
          <LogOut size={15} />
          <span>SIGN OUT</span>
        </button>
      </div>

      {/* Security Status Banner */}
      <div 
        style={{
          background: 'rgba(0, 242, 254, 0.06)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} color="var(--cyan-glow)" />
          <div>
            <h4 style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', color: '#fff' }}>
              FRIDAY ENCRYPTED VAULT ACTIVE
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Level 2 Passkey authentication passed. Account & database connection established.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--success-color)', fontFamily: 'var(--font-hud)' }}>
          <Cpu size={14} /> ONLINE
        </div>
      </div>

      {/* Vault Storage Overview (Dormant Storage ready for Stage 2) */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} color="var(--cyan-glow)" /> DORMANT VAULT STORAGE
          </h3>
          <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            STATUS: READY FOR FILES
          </span>
        </div>

        <div className="vault-dormant-card">
          <div className="brand-icon-wrapper" style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}>
            <FolderLock size={30} color="var(--cyan-glow)" />
          </div>
          <h4 style={{ fontFamily: 'var(--font-hud)', fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>
            STAGE 1 COMPLETED
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: '1.5' }}>
            Your account data (Name, Email, Password, and Passkey) are safely stored in your local MongoDB database (<code style={{ color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)' }}>project_friday</code>). Your dormant file storage vault is locked and waiting for data!
          </p>

          <p style={{ fontSize: '0.8rem', color: 'var(--cyan-glow)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
            SUPPORTED FILE TYPES FOR STAGE 2:
          </p>
          <div className="file-type-tags">
            <span className="file-tag"><FileText size={13} style={{ display: 'inline', marginRight: '4px' }} /> .TXT</span>
            <span className="file-tag"><Image size={13} style={{ display: 'inline', marginRight: '4px' }} /> .PNG / .JPG</span>
            <span className="file-tag"><FileCode size={13} style={{ display: 'inline', marginRight: '4px' }} /> .PDF</span>
            <span className="file-tag"><Lock size={13} style={{ display: 'inline', marginRight: '4px' }} /> ALL FORMATS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
