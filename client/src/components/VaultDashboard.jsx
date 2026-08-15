import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  FileText, 
  Image, 
  FileCode, 
  HardDrive, 
  Lock, 
  FolderLock,
  Cpu,
  Search,
  Upload,
  Activity,
  CheckCircle,
  Key,
  Database
} from 'lucide-react';

export default function VaultDashboard({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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
      {/* Top Application Header */}
      <div className="dashboard-header">
        <div className="user-badge">
          <div className="avatar">{getInitials(user.name)}</div>
          <div>
            <h2 className="dashboard-title">{user.name || 'Agent Vault'}</h2>
            <p className="dashboard-email">{user.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="status-indicator" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '10px' }}>
            <Cpu size={14} /> MONGODB ACTIVE
          </div>

          <button onClick={onLogout} className="btn-secondary">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Grid (4 Cards) */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="metric-value">Level 2 Active</div>
            <div className="metric-label">Passkey Verified</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Lock size={22} />
          </div>
          <div>
            <div className="metric-value">AES-256 Bit</div>
            <div className="metric-label">Vault Encryption</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' }}>
            <HardDrive size={22} />
          </div>
          <div>
            <div className="metric-value">Ready Storage</div>
            <div className="metric-label">Stage 1 Standby</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Activity size={22} />
          </div>
          <div>
            <div className="metric-value">100% Protected</div>
            <div className="metric-label">Security Health</div>
          </div>
        </div>
      </div>

      {/* Action Row & Search */}
      <div className="dashboard-actions-row">
        <div className="search-bar-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search vault files, encryption keys, logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="action-btn-pill">
            <Upload size={15} />
            <span>Upload File (Stage 2)</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout (Storage & Activity Log) */}
      <div className="dashboard-grid-layout">
        {/* Storage Vault Manager Panel */}
        <div className="dashboard-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="panel-title" style={{ margin: 0 }}>
              <HardDrive size={18} color="var(--primary-accent)" /> Vault Storage Manager
            </h3>

            {/* Filter Tags */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'docs', 'media'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: activeFilter === filter ? '700' : '500',
                    border: activeFilter === filter ? '1px solid var(--primary-accent)' : '1px solid #e2e8f0',
                    background: activeFilter === filter ? 'rgba(37, 99, 235, 0.1)' : '#ffffff',
                    color: activeFilter === filter ? 'var(--primary-accent)' : 'var(--text-muted)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="vault-dormant-card" style={{ marginTop: 0 }}>
            <div className="brand-icon-wrapper" style={{ width: '48px', height: '48px', margin: '0 auto 12px' }}>
              <FolderLock size={22} color="var(--primary-accent)" />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: '700' }}>
              Dormant Vault Ready For Files
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 16px', lineHeight: '1.5' }}>
              Your user credentials (Name, Email, Password, Passkey) are encrypted and saved in your local MongoDB database (<code style={{ color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)' }}>project_friday</code>). File upload pipeline is staged and ready for Stage 2!
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

        {/* Security Audit Activity Log Panel */}
        <div className="dashboard-panel-card">
          <h3 className="panel-title">
            <Activity size={18} color="var(--primary-accent)" /> Security Activity Log
          </h3>

          <div className="activity-list">
            <div className="activity-item">
              <CheckCircle size={15} color="#10b981" />
              <div>
                <div className="activity-text">Passkey Verified</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Level 2 PIN challenge</div>
              </div>
              <div className="activity-time">Just now</div>
            </div>

            <div className="activity-item">
              <Key size={15} color="#2563eb" />
              <div>
                <div className="activity-text">Email Authenticated</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Password hash match</div>
              </div>
              <div className="activity-time">1 min ago</div>
            </div>

            <div className="activity-item">
              <Database size={15} color="#0d9488" />
              <div>
                <div className="activity-text">MongoDB Connected</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Local 127.0.0.1:27017</div>
              </div>
              <div className="activity-time">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


