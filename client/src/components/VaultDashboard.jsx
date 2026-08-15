import React, { useState, useRef, useEffect } from 'react';
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
  File,
  FileCheck,
  ExternalLink
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
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);

  // Initial Sample Encrypted Vault Files
  const [files, setFiles] = useState([
    {
      id: 'f1',
      name: 'Project_Friday_Security_Protocol.pdf',
      size: '2.4 MB',
      type: 'pdf',
      date: 'Aug 15, 2026',
      url: null,
      content: `[PROJECT FRIDAY - CLASSIFIED SECURITY PROTOCOL v2.4]

1. LEVEL 2 PASSKEY AUTHENTICATION
- Primary Authentication: Password Hash (Bcrypt 10 rounds).
- Secondary Authentication: 4 to 8 digit Passkey PIN.
- Database Connection: Local MongoDB (mongodb://127.0.0.1:27017/project_friday).

2. VAULT ENCRYPTION & KEY DERIVATION
- Encryption Standard: AES-256-GCM.
- Key Derivation Function: PBKDF2 with SHA-256 HMAC.
- Payload Protection: End-to-end local zero-trust model.

3. DORMANT STORAGE PIPELINE
- File Storage Pipeline: Stage 1 active, Stage 2 upload pipeline initialized.
- Supported File Formats: .TXT, .PNG, .JPG, .PDF, .ENC, .JSON.`
    },
    {
      id: 'f2',
      name: 'Cyber_Vault_Passkey_Badge.png',
      size: '1.1 MB',
      type: 'image',
      date: 'Aug 15, 2026',
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%232563eb" rx="24"/><circle cx="300" cy="200" r="110" fill="%23ffffff" opacity="0.15"/><path d="M300 130 L350 240 L250 240 Z" fill="%23ffffff"/><text x="300" y="310" font-family="sans-serif" font-weight="800" font-size="22" fill="%23ffffff" text-anchor="middle" letter-spacing="3">PROJECT FRIDAY VAULT BADGE</text><text x="300" y="340" font-family="monospace" font-size="14" fill="%2393c5fd" text-anchor="middle">LEVEL 2 SECURITY AUTHENTICATED</text></svg>'
    },
    {
      id: 'f3',
      name: 'MongoDB_Encrypted_Backup.enc',
      size: '5.8 MB',
      type: 'code',
      date: 'Aug 15, 2026',
      url: null,
      content: `{
  "system": "Project Friday Vault Database",
  "version": "1.0.0",
  "status": "ENCRYPTED_AES_256",
  "dbName": "project_friday",
  "collections": ["users", "vault_metadata", "audit_logs"],
  "securityLevel": 2,
  "passkeyVerification": true,
  "payloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}`
    }
  ]);

  // Keyboard Escape listener to close preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPreviewFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

    // Read file text or image preview
    let fileUrl = null;
    let fileContent = null;

    if (file.type.startsWith('image/')) {
      fileUrl = URL.createObjectURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        fileContent = event.target.result;
      };
      reader.readAsText(file);
    }

    // Animated Progress Counter 0% -> 100%
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 18) + 12;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setUploadProgress(100);
        clearInterval(interval);

        setTimeout(() => {
          const fileType = file.type.startsWith('image/')
            ? 'image'
            : file.name.endsWith('.pdf')
            ? 'pdf'
            : file.type.includes('json') || file.name.endsWith('.enc') || file.type.includes('javascript')
            ? 'code'
            : 'doc';

          const newFileItem = {
            id: 'file_' + Date.now(),
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            type: fileType,
            date: 'Just now',
            url: fileUrl,
            content: fileContent || `[ENCRYPTED PAYLOAD DATA FOR ${file.name}]\n\nAES-256 Bit Encrypted Storage Item.\nUploaded At: ${new Date().toLocaleString()}\nFile Size: ${file.size} bytes.`
          };

          setFiles((prev) => [newFileItem, ...prev]);
          setIsUploading(false);
          setUploadProgress(0);
          setCurrentUploadName('');
        }, 400);
      } else {
        setUploadProgress(currentProgress);
      }
    }, 120);

    e.target.value = '';
  };

  // Delete file from state
  const handleDeleteFile = (e, id) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedPreviewFile && selectedPreviewFile.id === id) {
      setSelectedPreviewFile(null);
    }
  };

  // Filter & Search Logic
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'docs') return matchesSearch && (file.type === 'pdf' || file.type === 'doc');
    if (activeFilter === 'media') return matchesSearch && file.type === 'image';
    return matchesSearch;
  });

  const renderFileIcon = (type, size = 22) => {
    switch (type) {
      case 'image': return <ImageIcon size={size} color="#2563eb" />;
      case 'pdf': return <FileText size={size} color="#ef4444" />;
      case 'code': return <FileCode size={size} color="#0d9488" />;
      default: return <File size={size} color="#4f46e5" />;
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

      {/* Main Grid Layout (Storage Manager Panel) */}
      <div className="dashboard-grid-layout">
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
                <div 
                  key={file.id} 
                  className="file-card"
                  onClick={() => setSelectedPreviewFile(file)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="file-preview-box">
                    {file.url ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="file-preview-img"
                      />
                    ) : (
                      renderFileIcon(file.type, 28)
                    )}
                  </div>
                  <div className="file-card-title" title={file.name}>
                    {file.name}
                  </div>
                  <div className="file-card-meta">
                    {file.size} &bull; {file.date}
                  </div>
                  <div className="file-card-actions">
                    <button
                      className="file-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreviewFile(file);
                      }}
                      title="Preview File"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="file-action-btn btn-delete"
                      onClick={(e) => handleDeleteFile(e, file.id)}
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
                    <tr 
                      key={file.id} 
                      className="file-table-row"
                      onClick={() => setSelectedPreviewFile(file)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                        {renderFileIcon(file.type)}
                        <span title={file.name}>{file.name}</span>
                      </td>
                      <td>{file.size}</td>
                      <td>{file.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="file-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPreviewFile(file);
                          }}
                          title="Preview File"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="file-action-btn btn-delete"
                          onClick={(e) => handleDeleteFile(e, file.id)}
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

      {/* Universal Multi-Format File Previewer Modal (Images, PDFs, Code, Text) */}
      {selectedPreviewFile && (
        <div className="file-preview-modal-overlay" onClick={() => setSelectedPreviewFile(null)}>
          <div className="file-preview-card" onClick={(e) => e.stopPropagation()}>
            {/* Header with Title and Close X Button */}
            <div className="preview-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderFileIcon(selectedPreviewFile.type, 22)}
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {selectedPreviewFile.name}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {selectedPreviewFile.size} &bull; Encrypted AES-256
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="preview-close-btn"
                  onClick={() => setSelectedPreviewFile(null)}
                  title="Close Preview (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Rendering Based on File Type */}
            <div className="preview-body-container">
              {/* IMAGE PREVIEW */}
              {selectedPreviewFile.type === 'image' && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <img
                    src={selectedPreviewFile.url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%232563eb"/><text x="200" y="150" font-size="18" fill="%23ffffff" text-anchor="middle">IMAGE PREVIEW</text></svg>'}
                    alt={selectedPreviewFile.name}
                    style={{ maxWidth: '100%', maxHeight: '62vh', borderRadius: '14px', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                  />
                </div>
              )}

              {/* PDF DOCUMENT PREVIEW */}
              {selectedPreviewFile.type === 'pdf' && (
                <div className="pdf-preview-doc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', fontWeight: '700' }}>
                      PDF DOCUMENT VIEWER &bull; PAGE 1 OF 1
                    </span>
                    <span style={{ fontSize: '0.74rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                      VERIFIED PDF
                    </span>
                  </div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {selectedPreviewFile.content || `[CLASSIFIED PDF DOCUMENT]\n\nDocument Title: ${selectedPreviewFile.name}\nEncryption Protocol: SHA-256 / AES-256-GCM\nDate Uploaded: ${selectedPreviewFile.date}\n\nThis document contains encrypted security payload records. Authentication passed via Level 2 Passkey.`}
                  </pre>
                </div>
              )}

              {/* CODE / TEXT FILE PREVIEW */}
              {(selectedPreviewFile.type === 'code' || selectedPreviewFile.type === 'doc') && (
                <div className="code-preview-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>MONOSPACE PAYLOAD VIEWER</span>
                    <span style={{ color: '#10b981', fontSize: '0.76rem' }}>UTF-8 ENCODED</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: '0.84rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', whiteSpace: 'pre-wrap' }}>
                    {selectedPreviewFile.content || `// Encrypted Payload Data File\n{\n  "fileName": "${selectedPreviewFile.name}",\n  "fileSize": "${selectedPreviewFile.size}",\n  "encrypted": true,\n  "checksum": "a8f5f167f44f4964e6c998dee827110c"\n}`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
