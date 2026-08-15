import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  HardDrive, 
  Lock, 
  FolderLock,
  Cpu,
  Search,
  Upload,
  Plus,
  Activity,
  CheckCircle,
  Key,
  Database,
  LayoutGrid,
  List,
  Trash2,
  Download,
  Eye,
  X,
  File
} from 'lucide-react';

export default function VaultDashboard({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // File Upload & Progress State
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadName, setCurrentUploadName] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Initial Sample Encrypted Vault Files
  const [files, setFiles] = useState([
    {
      id: 'f1',
      name: 'Project_Friday_Security_Protocol.pdf',
      size: '2.4 MB',
      type: 'pdf',
      date: 'Aug 15, 2026',
      url: null
    },
    {
      id: 'f2',
      name: 'Cyber_Vault_Passkey_Badge.png',
      size: '1.1 MB',
      type: 'image',
      date: 'Aug 15, 2026',
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%232563eb"/><circle cx="150" cy="100" r="50" fill="%23ffffff" opacity="0.2"/><path d="M150 70 L170 120 L130 120 Z" fill="%23ffffff"/><text x="150" y="160" font-family="sans-serif" font-weight="bold" font-size="14" fill="%23ffffff" text-anchor="middle">ENCRYPTED BADGE</text></svg>'
    },
    {
      id: 'f3',
      name: 'MongoDB_Encrypted_Backup.enc',
      size: '5.8 MB',
      type: 'code',
      date: 'Aug 15, 2026',
      url: null
    }
  ]);

  const getInitials = (name) => {
    if (!name) return 'PF';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Open Native File Explorer
  const handleOpenExplorer = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle File Selection & 0-100% Progress Animation
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    setCurrentUploadName(file.name);
    setIsUploading(true);
    setUploadProgress(0);

    // Read file for preview if image
    let fileUrl = null;
    if (file.type.startsWith('image/')) {
      fileUrl = URL.createObjectURL(file);
    }

    // Animated Progress Counter 0% -> 100%
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 18) + 12;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setUploadProgress(100);
        clearInterval(interval);

        // Add file to vault list after slight delay
        setTimeout(() => {
          const newFileItem = {
            id: 'file_' + Date.now(),
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            type: file.type.startsWith('image/') ? 'image' : file.name.endsWith('.pdf') ? 'pdf' : 'doc',
            date: 'Just now',
            url: fileUrl
          };

          setFiles((prev) => [newFileItem, ...prev]);
          setIsUploading(false);
          setUploadProgress(0);
          setCurrentUploadName('');
        }, 500);
      } else {
        setUploadProgress(currentProgress);
      }
    }, 120);

    // Reset input
    e.target.value = '';
  };

  // Delete file from state
  const handleDeleteFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Filter & Search Logic
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'docs') return matchesSearch && (file.type === 'pdf' || file.type === 'doc');
    if (activeFilter === 'media') return matchesSearch && file.type === 'image';
    return matchesSearch;
  });

  const renderFileIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={22} color="#2563eb" />;
      case 'pdf': return <FileText size={22} color="#ef4444" />;
      case 'code': return <FileCode size={22} color="#0d9488" />;
      default: return <File size={22} color="#4f46e5" />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Hidden Native File Explorer Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
      />

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
            <div className="metric-value">{files.length} Vault Files</div>
            <div className="metric-label">Storage Capacity</div>
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

      {/* Action Row: Search & + Upload File Button */}
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Grid / List View Toggle */}
          <div className="view-toggle-group">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          {/* Prominent + Plus Upload File Button */}
          <button className="action-btn-pill" onClick={handleOpenExplorer}>
            <Plus size={18} />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout (Storage Manager & Activity Log) */}
      <div className="dashboard-grid-layout">
        {/* Vault Storage Manager Panel */}
        <div className="dashboard-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="panel-title" style={{ margin: 0 }}>
              <HardDrive size={18} color="var(--primary-accent)" /> Encrypted Vault Files ({filteredFiles.length})
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

          {/* Grid View vs List View Display */}
          {filteredFiles.length === 0 ? (
            <div className="vault-dormant-card" style={{ marginTop: 0 }}>
              <div className="brand-icon-wrapper" style={{ width: '48px', height: '48px', margin: '0 auto 12px' }}>
                <FolderLock size={22} color="var(--primary-accent)" />
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: '700' }}>
                No Matching Vault Files
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px' }}>
                Click "+ Upload File" to add encrypted files into your vault storage.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="file-grid-container">
              {filteredFiles.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-preview-box">
                    {file.url ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="file-preview-img"
                        onClick={() => setPreviewImage(file.url)}
                      />
                    ) : (
                      renderFileIcon(file.type)
                    )}
                  </div>
                  <div className="file-card-title" title={file.name}>
                    {file.name}
                  </div>
                  <div className="file-card-meta">
                    {file.size} &bull; {file.date}
                  </div>
                  <div className="file-card-actions">
                    {file.url && (
                      <button
                        className="file-action-btn"
                        onClick={() => setPreviewImage(file.url)}
                        title="View Image"
                      >
                        <Eye size={15} />
                      </button>
                    )}
                    <button
                      className="file-action-btn btn-delete"
                      onClick={() => handleDeleteFile(file.id)}
                      title="Delete File"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View Table */
            <div style={{ overflowX: 'auto' }}>
              <table className="file-list-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Date Added</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="file-table-row">
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                        {renderFileIcon(file.type)}
                        <span title={file.name}>{file.name}</span>
                      </td>
                      <td>{file.size}</td>
                      <td>{file.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        {file.url && (
                          <button
                            className="file-action-btn"
                            onClick={() => setPreviewImage(file.url)}
                            title="View Image"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          className="file-action-btn btn-delete"
                          onClick={() => handleDeleteFile(file.id)}
                          title="Delete File"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Animated 0% to 100% Upload Progress Modal */}
      {isUploading && (
        <div className="upload-modal-overlay">
          <div className="upload-progress-card">
            <div className="brand-icon-wrapper" style={{ width: '52px', height: '52px', margin: '0 auto 12px' }}>
              <Upload size={24} color="var(--primary-accent)" />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Encrypting & Uploading File...
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
              {currentUploadName}
            </p>

            {/* 0% -> 100% Progress Bar */}
            <div className="progress-track-bg">
              <div
                className="progress-track-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <div className="progress-percentage">
              {uploadProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <div className="lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(15, 23, 42, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
            <img src={previewImage} alt="Vault Preview" className="lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}



