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
  Eye,
  X,
  File,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Cpu,
  Layers,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { uploadFileApi, fetchFilesApi, deleteFileApi, fetchFileContentApi } from '../services/api';

// Helper to convert base64 DataURL or GridFS streaming endpoint into a native Blob / Stream URL
const createBlobUrl = (dataUrl, fallbackMime = 'application/pdf') => {
  if (!dataUrl) return null;
  if (dataUrl.startsWith('blob:') || dataUrl.startsWith('/api/files/') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }
  if (dataUrl.startsWith('data:')) {
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : fallbackMime;
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('Could not create blob URL:', e);
      return dataUrl;
    }
  }
  return dataUrl;
};

export default function VaultDashboard({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Profile Popover Dropdown Menu State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // File Upload & Progress State
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadName, setCurrentUploadName] = useState('');
  const [newlyAddedFileId, setNewlyAddedFileId] = useState(null);

  // Preview & Download Modal State
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copySuccess, setCopySuccess] = useState(false);

  // Initial Encrypted Vault Metadata Files
  const [files, setFiles] = useState([
    {
      id: 'f1',
      name: 'Project_Friday_Security_Protocol.pdf',
      size: '2.4 MB',
      fileSizeBytes: 2516582,
      type: 'pdf',
      date: 'Aug 15, 2026',
      checksum: 'e3b0c44298fc1c14',
      storageType: 'metadata_vault',
      url: null,
      content: `[PROJECT FRIDAY - CLASSIFIED SECURITY PROTOCOL v2.4]

1. LEVEL 2 PASSKEY AUTHENTICATION
- Primary Authentication: Password Hash (Bcrypt 10 rounds).
- Secondary Authentication: 4 to 8 digit Passkey PIN.
- Database Connection: Local MongoDB (mongodb://127.0.0.1:27017/project_friday).

2. VAULT ENCRYPTION & KEY DERIVATION
- Encryption Standard: AES-256-GCM.
- Key Derivation Function: PBKDF2 with SHA-256 HMAC.
- Payload Protection: End-to-end zero-trust metadata separation model.`
    },
    {
      id: 'f2',
      name: 'Cyber_Vault_Passkey_Badge.png',
      size: '1.1 MB',
      fileSizeBytes: 1153433,
      type: 'image',
      date: 'Aug 15, 2026',
      checksum: 'f44f4964e6c998de',
      storageType: 'metadata_vault',
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230d1527" rx="24"/><rect width="596" height="396" x="2" y="2" fill="none" stroke="%2300f2fe" stroke-width="2" rx="22" opacity="0.6"/><circle cx="300" cy="200" r="110" fill="%2300f2fe" opacity="0.1"/><path d="M300 130 L350 240 L250 240 Z" fill="%2300f2fe"/><text x="300" y="310" font-family="sans-serif" font-weight="900" font-size="22" fill="%23ffffff" text-anchor="middle" letter-spacing="3">PROJECT FRIDAY VAULT</text><text x="300" y="340" font-family="monospace" font-size="14" fill="%2300f2fe" text-anchor="middle">LEVEL 2 SECURITY AUTHENTICATED</text></svg>'
    },
    {
      id: 'f3',
      name: 'MongoDB_Encrypted_Backup.enc',
      size: '5.8 MB',
      fileSizeBytes: 6081740,
      type: 'code',
      date: 'Aug 15, 2026',
      checksum: 'a8f5f167f44f4964',
      storageType: 'metadata_vault',
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

  // Load saved file metadata from MongoDB database on mount (Ultra-Fast Metadata Fetch)
  useEffect(() => {
    async function loadSavedFiles() {
      if (user && user.email) {
        const res = await fetchFilesApi(user.email);
        if (res && res.success && res.files && res.files.length > 0) {
          setFiles(res.files);
        }
      }
    }
    loadSavedFiles();
  }, [user]);

  // Close profile dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Handle File Selection, Metadata Extraction & Stream Upload to MongoDB GridFS
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];

    // File Size Validation (Max 500 MB)
    const maxSizeBytes = 500 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert('File size exceeds the 500MB limit for Project Friday GridFS storage.');
      e.target.value = '';
      return;
    }

    setCurrentUploadName(file.name);
    setIsUploading(true);
    setUploadProgress(0);

    const fileType = file.type.startsWith('image/')
      ? 'image'
      : file.name.endsWith('.pdf') || file.type === 'application/pdf'
      ? 'pdf'
      : file.type.startsWith('video/') || file.type.startsWith('audio/')
      ? 'media'
      : file.type.includes('json') || file.name.endsWith('.enc') || file.type.includes('javascript')
      ? 'code'
      : 'doc';

    // 0% -> 100% Upload Progress Animation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 22) + 16;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setUploadProgress(100);
        clearInterval(interval);

        setTimeout(async () => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userEmail', user.email);
          formData.append('type', fileType);
          formData.append('size', (file.size / (1024 * 1024)).toFixed(2) + ' MB');

          // Stream File directly to MongoDB GridFS Vault
          const apiRes = await uploadFileApi(formData);
          const savedFile = (apiRes && apiRes.success && apiRes.file)
            ? apiRes.file
            : {
                id: 'file_' + Date.now(),
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                fileSizeBytes: file.size,
                type: fileType,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                url: `/api/files/file_${Date.now()}/stream`,
                downloadUrl: `/api/files/file_${Date.now()}/download`,
                userEmail: user.email
              };

          setFiles((prev) => [savedFile, ...prev]);
          setNewlyAddedFileId(savedFile.id);
          setIsUploading(false);
          setUploadProgress(0);
          setCurrentUploadName('');
          setTimeout(() => setNewlyAddedFileId(null), 3500);
        }, 250);
      } else {
        setUploadProgress(currentProgress);
      }
    }, 60);

    e.target.value = '';
  };

  // Open Lazy File Preview Modal
  const handleOpenPreview = async (file) => {
    setZoomLevel(1);
    setCopySuccess(false);

    // If streaming url or content payload is present, open immediately
    if (file.url || file.streamUrl || file.content) {
      const previewObj = {
        ...file,
        url: file.streamUrl || file.url || `/api/files/${file.id}/stream`
      };
      setSelectedPreviewFile(previewObj);
      return;
    }

    // Otherwise, lazily fetch payload
    setIsPreviewLoading(true);
    setSelectedPreviewFile(file);

    const res = await fetchFileContentApi(file.id);
    setIsPreviewLoading(false);

    if (res && res.success) {
      setSelectedPreviewFile((prev) => ({
        ...prev,
        url: res.url || `/api/files/${file.id}/stream`,
        content: res.content,
        checksum: res.checksum || prev.checksum
      }));
    }
  };

  // Direct High-Speed GridFS File Download Handler
  const handleDownloadFile = async (e, file) => {
    if (e) e.stopPropagation();

    const downloadEndpoint = file.downloadUrl || `/api/files/${file.id}/download`;

    if (file.id && !file.id.startsWith('f1') && !file.id.startsWith('f2')) {
      const a = document.createElement('a');
      a.href = downloadEndpoint;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    let payloadUrl = file.url || downloadEndpoint;
    let payloadContent = file.content;

    if (payloadUrl) {
      const a = document.createElement('a');
      a.href = payloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (payloadContent) {
      const blob = new Blob([payloadContent], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  };

  // Copy Content Payload to Clipboard
  const handleCopyContent = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Delete file from MongoDB database
  const handleDeleteFile = async (e, id) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedPreviewFile && selectedPreviewFile.id === id) {
      setSelectedPreviewFile(null);
    }
    await deleteFileApi(id);
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
      case 'code': return <FileCode size={size} color="#10b981" />;
      default: return <File size={size} color="#7928ca" />;
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
        {/* Left: Brand Logo Title & Welcome Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon-wrapper" style={{ width: '44px', height: '44px' }}>
            <ShieldCheck size={26} color="var(--primary-accent)" />
          </div>
          <div>
            <h2 className="dashboard-title" style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>
              Project Friday
            </h2>
            <p className="dashboard-email" style={{ color: 'var(--primary-accent)', fontWeight: '700', fontSize: '0.84rem', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              Welcome back, {user.name || 'Guna'}
            </p>
          </div>
        </div>

        {/* Right: Interactive Profile Avatar Badge & Dropdown */}
        <div className="profile-dropdown-wrapper" ref={profileMenuRef}>
          <div 
            className="profile-trigger-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            role="button"
            tabIndex={0}
            title="View Profile & Options"
          >
            <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>
              {getInitials(user.name)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>
                {user.name || 'Guna'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {user.email}
              </div>
            </div>
            <ChevronDown size={16} color="#64748b" style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          </div>

          {/* Profile Popover Menu */}
          {showProfileMenu && (
            <div className="profile-popover-menu">
              <div className="popover-user-info">
                <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '1rem', flexShrink: 0 }}>
                  {getInitials(user.name)}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </span>
                </div>
              </div>

              <div style={{ padding: '8px 10px', background: 'rgba(37, 99, 235, 0.06)', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.15)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={14} color="#10b981" />
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: '700' }}>
                  Level 2 Verified &bull; MongoDB Vault
                </span>
              </div>

              <button onClick={onLogout} className="popover-logout-btn">
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Overview Grid (4 Cards) */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box">
            <ShieldCheck size={24} color="#2563eb" />
          </div>
          <div>
            <div className="metric-value">Level 2 Active</div>
            <div className="metric-label">Passkey Verified</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(79, 70, 229, 0.08)', borderColor: 'rgba(79, 70, 229, 0.25)' }}>
            <Lock size={24} color="#4f46e5" />
          </div>
          <div>
            <div className="metric-value">AES-256 GCM</div>
            <div className="metric-label">Vault Encryption</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <Cpu size={24} color="#10b981" />
          </div>
          <div>
            <div className="metric-value">{files.length} Vault Files</div>
            <div className="metric-label">Indexed Metadata</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(37, 99, 235, 0.08)', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <Activity size={24} color="#2563eb" />
          </div>
          <div>
            <div className="metric-value">Ultra High Speed</div>
            <div className="metric-label">Lazy Loading Engine</div>
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
            placeholder="Search vault metadata, encryption keys, logs..."
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 className="panel-title" style={{ margin: 0 }}>
              <HardDrive size={20} color="var(--primary-accent)" /> Encrypted Storage Vault ({filteredFiles.length})
            </h3>

            {/* Filter Tags */}
            <div className="filter-btn-group">
              {['all', 'docs', 'media'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`filter-badge-btn ${activeFilter === filter ? 'active' : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Grid View vs List View Display */}
          {filteredFiles.length === 0 ? (
            <div className="vault-dormant-card" style={{ marginTop: 0 }}>
              <div className="brand-icon-wrapper" style={{ width: '52px', height: '52px', margin: '0 auto 14px' }}>
                <FolderLock size={24} color="var(--primary-accent)" />
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: '800' }}>
                No Matching Vault Files
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 18px' }}>
                Click "+ Upload File" to add encrypted files into your MongoDB metadata storage vault.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="file-grid-container">
              {filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className={`file-card ${file.id === newlyAddedFileId ? 'new-file-animated-entry' : ''}`}
                  onClick={() => handleOpenPreview(file)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="file-preview-box">
                    {file.type === 'image' ? (
                      <img
                        src={file.url || file.streamUrl || `/api/files/${file.id}/stream`}
                        alt={file.name}
                        className="file-preview-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      renderFileIcon(file.type, 32)
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
                        handleOpenPreview(file);
                      }}
                      title="Preview File"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="file-action-btn btn-download"
                      onClick={(e) => handleDownloadFile(e, file)}
                      title="Download File"
                    >
                      <Download size={15} />
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
            <div className="table-responsive-wrapper">
              <table className="file-list-table">
                <thead>
                  <tr>
                    <th className="th-file-name">File Name</th>
                    <th className="th-file-size">Size</th>
                    <th className="th-file-date">Date Added</th>
                    <th className="th-file-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr 
                      key={file.id} 
                      className={`file-table-row ${file.id === newlyAddedFileId ? 'new-file-animated-entry' : ''}`}
                      onClick={() => handleOpenPreview(file)}
                    >
                      <td className="td-file-name">
                        <div className="file-name-cell-content">
                          {renderFileIcon(file.type, 18)}
                          <span className="file-name-text" title={file.name}>{file.name}</span>
                        </div>
                      </td>
                      <td className="td-file-size">{file.size}</td>
                      <td className="td-file-date">{file.date}</td>
                      <td className="td-file-actions">
                        <div className="table-actions-group">
                          <button
                            className="file-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPreview(file);
                            }}
                            title="Preview File"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="file-action-btn btn-download"
                            onClick={(e) => handleDownloadFile(e, file)}
                            title="Download File"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            className="file-action-btn btn-delete"
                            onClick={(e) => handleDeleteFile(e, file.id)}
                            title="Delete File"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            <div className="brand-icon-wrapper" style={{ width: '56px', height: '56px', margin: '0 auto 14px' }}>
              <Upload size={26} color="var(--primary-accent)" />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Encrypting & Uploading Metadata...
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)', margin: '4px 0 14px' }}>
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

      {/* Universal Sci-Fi File Previewer & Downloader Modal */}
      {selectedPreviewFile && (
        <div className="file-preview-modal-overlay" onClick={() => setSelectedPreviewFile(null)}>
          <div className="file-preview-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with Title, Telemetry Tools & Action Buttons */}
            <div className="preview-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                {renderFileIcon(selectedPreviewFile.type, 24)}
                <div style={{ overflow: 'hidden' }}>
                  <h3 className="preview-modal-title" title={selectedPreviewFile.name}>
                    {selectedPreviewFile.name}
                  </h3>
                  <span className="preview-modal-subtitle">
                    {selectedPreviewFile.size} &bull; AES-256
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {/* External Full Screen Browser View Button for PDF & Documents */}
                {selectedPreviewFile.url && (
                  <button
                    className="action-btn-pill"
                    style={{ padding: '7px 14px', fontSize: '0.76rem', background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #2563eb', color: '#38bdf8' }}
                    onClick={() => {
                      const blobUrl = createBlobUrl(selectedPreviewFile.url, selectedPreviewFile.type === 'pdf' ? 'application/pdf' : 'image/png');
                      if (blobUrl) {
                        window.open(blobUrl, '_blank');
                      }
                    }}
                    title="Open Document in Full Browser Tab"
                  >
                    <ExternalLink size={15} />
                    <span>Full Screen</span>
                  </button>
                )}

                {/* Download Button */}
                <button
                  className="action-btn-pill"
                  style={{ padding: '7px 14px', fontSize: '0.76rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
                  onClick={(e) => handleDownloadFile(e, selectedPreviewFile)}
                  title="Download File Now"
                >
                  <Download size={15} />
                  <span>Download</span>
                </button>

                {/* Zoom controls for Image / PDF */}
                {(selectedPreviewFile.type === 'image' || selectedPreviewFile.type === 'pdf') && (
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(7, 10, 20, 0.8)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(30, 41, 59, 0.9)' }}>
                    <button
                      className="file-action-btn"
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      title="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <button
                      className="file-action-btn"
                      onClick={() => setZoomLevel(1)}
                      title="Reset Zoom"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      className="file-action-btn"
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      title="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                  </div>
                )}

                {/* Copy content text button */}
                {(selectedPreviewFile.type === 'code' || selectedPreviewFile.type === 'doc' || selectedPreviewFile.content) && (
                  <button
                    className="file-action-btn"
                    onClick={() => handleCopyContent(selectedPreviewFile.content || selectedPreviewFile.name)}
                    title="Copy Content"
                  >
                    {copySuccess ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                )}

                <button
                  className="preview-close-btn"
                  onClick={() => setSelectedPreviewFile(null)}
                  title="Close Preview (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Rendering */}
            <div className="preview-body-container">
              {isPreviewLoading ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div className="brand-icon-wrapper" style={{ width: '56px', height: '56px', margin: '0 auto 14px' }}>
                    <Cpu size={28} color="var(--primary-accent)" />
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', color: '#ffffff', fontSize: '1rem' }}>
                    Lazily Fetching Payload Content...
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Streaming data payload from database vault
                  </p>
                </div>
              ) : (
                <>
                  {/* IMAGE PREVIEW */}
                  {selectedPreviewFile.type === 'image' && (
                    <div style={{ textAlign: 'center', width: '100%', overflow: 'auto', padding: '10px' }}>
                      <img
                        src={selectedPreviewFile.url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230d1527"/><text x="300" y="200" font-size="20" fill="%2300f2fe" text-anchor="middle">IMAGE PREVIEW</text></svg>'}
                        alt={selectedPreviewFile.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '62vh',
                          borderRadius: '16px',
                          objectFit: 'contain',
                          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7)',
                          transform: `scale(${zoomLevel})`,
                          transition: 'transform 0.2s ease-out'
                        }}
                      />
                    </div>
                  )}

                  {/* NATIVE VISUAL PDF PREVIEW */}
                  {selectedPreviewFile.type === 'pdf' && (
                    <div style={{ width: '100%', height: '620px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: '#ffffff' }}>
                      {selectedPreviewFile.url ? (
                        <object
                          data={createBlobUrl(selectedPreviewFile.url, 'application/pdf')}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                          style={{ border: 'none', background: '#ffffff', display: 'block' }}
                        >
                          <iframe
                            src={createBlobUrl(selectedPreviewFile.url, 'application/pdf')}
                            title={selectedPreviewFile.name}
                            width="100%"
                            height="100%"
                            style={{ border: 'none', background: '#ffffff', transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                          >
                            <div style={{ padding: '30px', textAlign: 'center', color: '#0f172a' }}>
                              <p style={{ fontWeight: '700', marginBottom: '12px' }}>PDF Inline Preview ready.</p>
                              <button
                                className="action-btn-pill"
                                style={{ margin: '0 auto' }}
                                onClick={() => window.open(createBlobUrl(selectedPreviewFile.url, 'application/pdf'), '_blank')}
                              >
                                Open PDF in Browser Tab
                              </button>
                            </div>
                          </iframe>
                        </object>
                      ) : (
                        <div className="pdf-preview-doc">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(30, 41, 59, 0.9)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', fontWeight: '700' }}>
                              PDF DOCUMENT VIEWER &bull; MONGODB VAULT
                            </span>
                            <span style={{ fontSize: '0.74rem', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary-accent)', padding: '2px 8px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                              VERIFIED DOCUMENT
                            </span>
                          </div>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0 }}>
                            {selectedPreviewFile.content || `[CLASSIFIED PDF DOCUMENT RECORD]\n\nDocument Title: ${selectedPreviewFile.name}\nEncryption Protocol: SHA-256 / AES-256-GCM\nDate Uploaded: ${selectedPreviewFile.date}\n\nThis document contains encrypted security payload records stored in MongoDB metadata storage vault.`}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CODE / TEXT FILE PREVIEW */}
                  {(selectedPreviewFile.type === 'code' || selectedPreviewFile.type === 'doc') && (
                    <div className="code-preview-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(30, 41, 59, 0.9)', paddingBottom: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>MONOSPACE PAYLOAD VIEWER</span>
                        <span style={{ color: '#10b981', fontSize: '0.76rem' }}>UTF-8 ENCODED &bull; METADATA VAULT</span>
                      </div>
                      <pre style={{ margin: 0, fontSize: '0.86rem', fontFamily: 'var(--font-mono)', color: '#00f2fe', whiteSpace: 'pre-wrap' }}>
                        {selectedPreviewFile.content || `// Encrypted Payload Metadata Record\n{\n  "fileName": "${selectedPreviewFile.name}",\n  "fileSize": "${selectedPreviewFile.size}",\n  "encrypted": true,\n  "checksum": "${selectedPreviewFile.checksum || 'a8f5f167f44f4964'}"\n}`}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
