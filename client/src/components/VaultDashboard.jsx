import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  HardDrive, 
  FolderLock,
  Search,
  Upload,
  Plus,
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
  Star,
  Share2,
  Info,
  Clock,
  Folder,
  ShieldCheck,
  MoreVertical,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  uploadFileApi, 
  fetchFilesApi, 
  toggleFavoriteApi, 
  trashFileApi, 
  permanentDeleteFileApi, 
  fetchFileContentApi,
  shareFileApi
} from '../services/api';

import Sidebar from './Sidebar';
import Header from './Header';
import UploadModal from './UploadModal';
import ShareModal from './ShareModal';
import FileDetailsDrawer from './FileDetailsDrawer';
import ConfirmModal from './ConfirmModal';
import SettingsView from './SettingsView';
import SecurityView from './SecurityView';
import ProfileView from './ProfileView';

export default function VaultDashboard({ 
  user, 
  onLogout, 
  currentTheme, 
  onThemeChange, 
  onRequirePasskey, 
  onShowToast, 
  activeNavTab, 
  onSelectNavTab 
}) {
  const [activeTab, setActiveTab] = useState(activeNavTab || 'home');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'image' | 'pdf' | 'doc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals & Panels
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [shareTargetFile, setShareTargetFile] = useState(null);
  const [detailsFile, setDetailsFile] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copySuccess, setCopySuccess] = useState(false);

  // Files State
  const [files, setFiles] = useState([
    {
      id: 'f1',
      name: 'Project_Friday_Security_Protocol.pdf',
      size: '2.4 MB',
      fileSizeBytes: 2516582,
      type: 'pdf',
      date: 'Aug 15, 2026',
      checksum: 'e3b0c44298fc1c14',
      storageType: 'gridfs',
      isFavorite: true,
      isDeleted: false,
      userEmail: user ? user.email : 'guna@example.com',
      url: null,
      content: `[PROJECT FRIDAY - CLASSIFIED SECURITY PROTOCOL v2.4]
1. PASSKEY AUTHENTICATION: Active
2. VAULT ENCRYPTION: AES-256-GCM
3. GRIDFS CHUNK STORAGE: Active`
    },
    {
      id: 'f2',
      name: 'Cyber_Vault_Passkey_Badge.png',
      size: '1.1 MB',
      fileSizeBytes: 1153433,
      type: 'image',
      date: 'Aug 15, 2026',
      checksum: 'f44f4964e6c998de',
      storageType: 'gridfs',
      isFavorite: false,
      isDeleted: false,
      userEmail: user ? user.email : 'guna@example.com',
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230d1527" rx="24"/><rect width="596" height="396" x="2" y="2" fill="none" stroke="%2300f2fe" stroke-width="2" rx="22" opacity="0.6"/><circle cx="300" cy="200" r="110" fill="%2300f2fe" opacity="0.1"/><path d="M300 130 L350 240 L250 240 Z" fill="%2300f2fe"/><text x="300" y="310" font-family="sans-serif" font-weight="900" font-size="22" fill="%23ffffff" text-anchor="middle" letter-spacing="3">PROJECT FRIDAY VAULT</text></svg>'
    }
  ]);

  useEffect(() => {
    if (activeNavTab) {
      setActiveTab(activeNavTab);
    }
  }, [activeNavTab]);

  // Load files from backend depending on activeTab (home, files, recent, favorites, trash)
  const loadFiles = async () => {
    if (user && user.email) {
      let viewQuery = 'all';
      if (activeTab === 'recent') viewQuery = 'recent';
      if (activeTab === 'favorites') viewQuery = 'favorites';
      if (activeTab === 'trash') viewQuery = 'trash';

      const res = await fetchFilesApi(user.email, viewQuery);
      if (res && res.success && res.files) {
        setFiles(res.files);
      }
    }
  };

  useEffect(() => {
    loadFiles();
  }, [user, activeTab]);

  // Filtered files list for rendering
  const filteredFiles = files.filter((file) => {
    // Filter by tab
    if (activeTab === 'trash') {
      if (!file.isDeleted) return false;
    } else {
      if (file.isDeleted) return false;
      if (activeTab === 'favorites' && !file.isFavorite) return false;
    }

    // Filter by search term
    const matchesSearch =
      !searchTerm ||
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.type.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by file type pill
    if (activeFilter === 'image') return matchesSearch && file.type === 'image';
    if (activeFilter === 'pdf') return matchesSearch && (file.type === 'pdf' || file.name.endsWith('.pdf'));
    if (activeFilter === 'doc') return matchesSearch && (file.type === 'doc' || file.type === 'code');
    return matchesSearch;
  });

  const calculateStorageMB = () => {
    const totalBytes = files
      .filter((f) => !f.isDeleted)
      .reduce((acc, curr) => acc + (curr.fileSizeBytes || 1048576), 0);
    return (totalBytes / (1024 * 1024)).toFixed(1);
  };

  // Handlers
  const handleToggleFavorite = async (file, e) => {
    if (e) e.stopPropagation();
    const newStatus = !file.isFavorite;
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, isFavorite: newStatus } : f)));
    onShowToast(newStatus ? 'Added to Favorites' : 'Removed from Favorites', 'info');
    await toggleFavoriteApi(file.id, newStatus);
  };

  const handleMoveToTrash = async (file, e) => {
    if (e) e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    onShowToast(`Moved "${file.name}" to Trash`, 'info');
    await trashFileApi(file.id, true);
  };

  const handleRestoreFromTrash = async (file, e) => {
    if (e) e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    onShowToast(`Restored "${file.name}"`, 'success');
    await trashFileApi(file.id, false);
  };

  const handlePermanentDelete = async (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setConfirmDeleteId(null);
    onShowToast('File permanently deleted', 'success');
    await permanentDeleteFileApi(fileId);
  };

  const handleDownloadFile = (e, file) => {
    if (e) e.stopPropagation();
    const downloadUrl = file.downloadUrl || `/api/files/${file.id}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Downloading ${file.name}...`, 'info');
  };

  const handleOpenPreview = async (file) => {
    setZoomLevel(1);
    setSelectedPreviewFile(file);

    if (file.hasContent && !file.content && !file.url) {
      setIsPreviewLoading(true);
      const res = await fetchFileContentApi(file.id);
      setIsPreviewLoading(false);
      if (res && res.success) {
        setSelectedPreviewFile((prev) => (prev ? { ...prev, ...res } : prev));
      }
    }
  };

  const renderFileIcon = (type, size = 22) => {
    switch (type) {
      case 'image': return <ImageIcon size={size} color="#2563eb" />;
      case 'pdf': return <FileText size={size} color="#ef4444" />;
      case 'code': return <FileCode size={size} color="#10b981" />;
      default: return <File size={size} color="#7928ca" />;
    }
  };

  return (
    <div className="app-shell-layout">
      {/* Desktop Sidebar & Mobile Bottom Navbar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => { setActiveTab(tab); if (onSelectNavTab) onSelectNavTab(tab); }}
        onOpenUpload={() => setShowUploadModal(true)}
        storageUsedMB={calculateStorageMB()}
        isOpen={isSidebarOpen}
      />

      <div className="app-main-content">
        {/* Top Header */}
        <Header
          user={user}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectTab={(tab) => { setActiveTab(tab); if (onSelectNavTab) onSelectNavTab(tab); }}
          onLogout={onLogout}
          searchCount={filteredFiles.length}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Dynamic Route Content */}
        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            storageUsedMB={calculateStorageMB()}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'security' && (
          <SecurityView
            user={user}
            onRequirePasskey={onRequirePasskey}
            onLogoutAll={onLogout}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            onShowToast={onShowToast}
          />
        )}

        {(activeTab === 'home' || activeTab === 'files' || activeTab === 'recent' || activeTab === 'favorites' || activeTab === 'trash') && (
          <div className="view-container">
            {/* Greeting Header (Home View) */}
            {activeTab === 'home' && (
              <div className="home-hero-header">
                <div>
                  <h1 className="hero-greeting">Good afternoon, {user ? user.name : 'Guna'} 👋</h1>
                  <p className="hero-greeting-sub">Manage your files securely from one place.</p>
                </div>
                <button className="btn-primary-action btn-compact-upload" onClick={() => setShowUploadModal(true)}>
                  <Plus size={18} />
                  <span>Upload File</span>
                </button>
              </div>
            )}

            {/* View Header (My Files, Recent, Favorites, Trash) */}
            {activeTab !== 'home' && (
              <div className="view-page-header-row">
                <div>
                  <h2 className="view-title">
                    {activeTab === 'files' && 'My Files'}
                    {activeTab === 'recent' && 'Recent Files'}
                    {activeTab === 'favorites' && 'Favorite Files'}
                    {activeTab === 'trash' && 'Trash'}
                  </h2>
                  <p className="view-sub">
                    {activeTab === 'files' && 'All your files stored in MongoDB GridFS.'}
                    {activeTab === 'recent' && 'Files opened or uploaded recently.'}
                    {activeTab === 'favorites' && 'Your starred favorite files.'}
                    {activeTab === 'trash' && 'Deleted files can be restored or permanently purged.'}
                  </p>
                </div>
                {activeTab !== 'trash' && (
                  <button className="btn-primary-action btn-compact-upload" onClick={() => setShowUploadModal(true)}>
                    <Plus size={18} />
                    <span>Upload File</span>
                  </button>
                )}
              </div>
            )}

            {/* Filter Pills & Grid/List Toggle Row */}
            <div className="files-toolbar-row">
              <div className="filter-badge-group">
                {['all', 'image', 'pdf', 'doc'].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter === 'all' ? 'All Files' : filter.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="view-mode-toggle-group">
                <button
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* File Display Container */}
            {filteredFiles.length === 0 ? (
              <div className="empty-files-card">
                <div className="empty-icon-box">
                  <FolderLock size={32} color="var(--primary-accent)" />
                </div>
                <h3>
                  {activeTab === 'trash' ? 'Trash is Empty' : 'No Files Found'}
                </h3>
                <p>
                  {activeTab === 'trash'
                    ? 'No deleted files currently stored in trash.'
                    : 'Click "+ Upload File" to add files to your space.'}
                </p>
                {activeTab !== 'trash' && (
                  <button className="btn-primary-action" onClick={() => setShowUploadModal(true)} style={{ marginTop: '16px' }}>
                    <Plus size={16} />
                    <span>Upload File</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="consumer-file-grid">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="consumer-file-card" onClick={() => handleOpenPreview(file)}>
                    {/* Thumbnail Box */}
                    <div className="card-thumbnail-box">
                      {file.type === 'image' ? (
                        <img
                          src={file.url || file.streamUrl || `/api/files/${file.id}/stream`}
                          alt={file.name}
                          className="card-thumbnail-img"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        renderFileIcon(file.type, 36)
                      )}

                      {/* Favorite Star Badge */}
                      <button
                        className={`star-badge-btn ${file.isFavorite ? 'active' : ''}`}
                        onClick={(e) => handleToggleFavorite(file, e)}
                        title={file.isFavorite ? 'Unstar file' : 'Star file'}
                      >
                        <Star size={15} fill={file.isFavorite ? '#f59e0b' : 'none'} color={file.isFavorite ? '#f59e0b' : '#94a3b8'} />
                      </button>
                    </div>

                    {/* Meta Footer */}
                    <div className="card-info-footer">
                      <div className="card-name-row">
                        <span className="card-file-name" title={file.name}>{file.name}</span>
                        <button
                          className="card-more-btn"
                          onClick={(e) => { e.stopPropagation(); setDetailsFile(file); }}
                          title="File details"
                        >
                          <Info size={16} />
                        </button>
                      </div>

                      <div className="card-sub-meta">
                        {file.size} &bull; {file.date}
                      </div>

                      {/* Action Row */}
                      <div className="card-quick-actions">
                        <button className="quick-act-btn" onClick={(e) => { e.stopPropagation(); handleOpenPreview(file); }} title="Preview">
                          <Eye size={14} />
                        </button>
                        <button className="quick-act-btn" onClick={(e) => handleDownloadFile(e, file)} title="Download">
                          <Download size={14} />
                        </button>
                        <button className="quick-act-btn" onClick={(e) => { e.stopPropagation(); setShareTargetFile(file); }} title="Share">
                          <Share2 size={14} />
                        </button>
                        {activeTab === 'trash' ? (
                          <>
                            <button className="quick-act-btn" onClick={(e) => handleRestoreFromTrash(file, e)} title="Restore">
                              <RotateCcw size={14} color="#10b981" />
                            </button>
                            <button className="quick-act-btn btn-del" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(file.id); }} title="Delete Permanently">
                              <Trash2 size={14} color="#ef4444" />
                            </button>
                          </>
                        ) : (
                          <button className="quick-act-btn btn-del" onClick={(e) => handleMoveToTrash(file, e)} title="Move to Trash">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List Table View */
              <div className="table-responsive-wrapper">
                <table className="file-list-table">
                  <thead>
                    <tr>
                      <th className="th-file-name">Name</th>
                      <th className="th-file-size">Size</th>
                      <th className="th-file-date">Modified</th>
                      <th className="th-file-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="file-table-row" onClick={() => handleOpenPreview(file)}>
                        <td className="td-file-name">
                          <div className="file-name-cell-content">
                            {renderFileIcon(file.type, 18)}
                            <span className="file-name-text" title={file.name}>{file.name}</span>
                            {file.isFavorite && <Star size={14} fill="#f59e0b" color="#f59e0b" />}
                          </div>
                        </td>
                        <td className="td-file-size">{file.size}</td>
                        <td className="td-file-date">{file.date}</td>
                        <td className="td-file-actions">
                          <div className="table-actions-group">
                            <button className="file-action-btn" onClick={(e) => { e.stopPropagation(); handleOpenPreview(file); }} title="Preview">
                              <Eye size={15} />
                            </button>
                            <button className="file-action-btn" onClick={(e) => handleDownloadFile(e, file)} title="Download">
                              <Download size={15} />
                            </button>
                            <button className="file-action-btn" onClick={(e) => { e.stopPropagation(); setShareTargetFile(file); }} title="Share">
                              <Share2 size={15} />
                            </button>
                            {activeTab === 'trash' ? (
                              <button className="file-action-btn btn-delete" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(file.id); }} title="Delete Permanently">
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <button className="file-action-btn btn-delete" onClick={(e) => handleMoveToTrash(file, e)} title="Move to Trash">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          userEmail={user ? user.email : ''}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={(newFile) => {
            setFiles((prev) => [newFile, ...prev]);
            onShowToast(`Uploaded ${newFile.name}`, 'success');
          }}
        />
      )}

      {/* Share Modal */}
      {shareTargetFile && (
        <ShareModal
          file={shareTargetFile}
          onClose={() => setShareTargetFile(null)}
          onShowToast={onShowToast}
        />
      )}

      {/* File Details Drawer */}
      {detailsFile && (
        <FileDetailsDrawer
          file={detailsFile}
          onClose={() => setDetailsFile(null)}
          onDownload={(f) => handleDownloadFile(null, f)}
          onShare={(f) => setShareTargetFile(f)}
          onFavoriteToggle={(f) => handleToggleFavorite(f, null)}
          onTrashToggle={(f) => handleMoveToTrash(f, null)}
        />
      )}

      {/* Permanent Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <ConfirmModal
          title="Delete permanently?"
          message="This file will be permanently purged from MongoDB GridFS. This action cannot be undone."
          confirmText="Delete permanently"
          confirmStyle="danger"
          onConfirm={() => handlePermanentDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Multi-Format Centered File Preview Modal */}
      {selectedPreviewFile && (
        <div className="preview-modal-backdrop" onClick={() => setSelectedPreviewFile(null)}>
          <div className="file-preview-card" onClick={(e) => e.stopPropagation()}>
            {/* Header: File Metadata + Download / Share / Star / Close Toolbar */}
            <div className="preview-modal-header">
              <div className="preview-file-info-group">
                <div className="preview-file-icon">
                  {renderFileIcon(selectedPreviewFile.type, 22)}
                </div>
                <div>
                  <h3 className="preview-modal-title" title={selectedPreviewFile.name}>
                    {selectedPreviewFile.name}
                  </h3>
                  <span className="preview-modal-subtitle">
                    {selectedPreviewFile.size} &bull; {selectedPreviewFile.mimeType || selectedPreviewFile.type || 'Document'}
                  </span>
                </div>
              </div>

              {/* Quick Action Toolbar */}
              <div className="preview-header-actions">
                <button
                  className="btn-primary-action btn-preview-download"
                  onClick={(e) => handleDownloadFile(e, selectedPreviewFile)}
                  title="Download File"
                >
                  <Download size={15} />
                  <span>Download</span>
                </button>

                <button
                  className="preview-action-btn"
                  onClick={() => setShareTargetFile(selectedPreviewFile)}
                  title="Share File"
                >
                  <Share2 size={16} />
                </button>

                <button
                  className={`preview-action-btn ${selectedPreviewFile.isFavorite ? 'active' : ''}`}
                  onClick={(e) => handleToggleFavorite(selectedPreviewFile, e)}
                  title={selectedPreviewFile.isFavorite ? "Unstar File" : "Star File"}
                >
                  <Star size={16} fill={selectedPreviewFile.isFavorite ? "#f59e0b" : "none"} color={selectedPreviewFile.isFavorite ? "#f59e0b" : "currentColor"} />
                </button>

                <button
                  className="preview-close-btn"
                  onClick={() => setSelectedPreviewFile(null)}
                  title="Close Preview (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body: Format-Specific Previewer */}
            <div className="preview-body-container">
              {isPreviewLoading ? (
                <div className="preview-loading-box">
                  <div className="spinner-small" />
                  <span>Loading file preview...</span>
                </div>
              ) : (selectedPreviewFile.type === 'pdf' || selectedPreviewFile.name.toLowerCase().endsWith('.pdf')) ? (
                /* PDF Document Viewer */
                <iframe
                  src={selectedPreviewFile.url || selectedPreviewFile.streamUrl || `/api/files/${selectedPreviewFile.id}/stream`}
                  title={selectedPreviewFile.name}
                  className="preview-iframe-pdf"
                />
              ) : (selectedPreviewFile.type === 'image' || /\.(png|jpe?g|gif|webp|svg)$/i.test(selectedPreviewFile.name)) ? (
                /* Image Viewer */
                <img
                  src={selectedPreviewFile.url || selectedPreviewFile.streamUrl || `/api/files/${selectedPreviewFile.id}/stream`}
                  alt={selectedPreviewFile.name}
                  className="preview-img-content"
                />
              ) : (selectedPreviewFile.type === 'video' || /\.(mp4|webm|mkv|mov)$/i.test(selectedPreviewFile.name)) ? (
                /* Video Player */
                <video
                  src={selectedPreviewFile.url || selectedPreviewFile.streamUrl || `/api/files/${selectedPreviewFile.id}/stream`}
                  controls
                  className="preview-video-content"
                />
              ) : (selectedPreviewFile.type === 'audio' || /\.(mp3|wav|ogg|m4a)$/i.test(selectedPreviewFile.name)) ? (
                /* Audio Player */
                <div className="preview-audio-wrapper">
                  <audio
                    src={selectedPreviewFile.url || selectedPreviewFile.streamUrl || `/api/files/${selectedPreviewFile.id}/stream`}
                    controls
                    className="preview-audio-content"
                  />
                </div>
              ) : (selectedPreviewFile.type === 'code' || selectedPreviewFile.type === 'text' || /\.(txt|json|js|jsx|ts|tsx|py|html|css|md|log)$/i.test(selectedPreviewFile.name)) ? (
                /* Text / Code Viewer */
                <pre className="preview-code-box">
                  <code>
                    {selectedPreviewFile.content || `[GRIDFS STREAM PAYLOAD]\nFile: ${selectedPreviewFile.name}\nSize: ${selectedPreviewFile.size}\nSHA-256: ${selectedPreviewFile.checksum || 'a8f5f167f44f4964'}`}
                  </code>
                </pre>
              ) : (
                /* Fallback Document Card */
                <div className="preview-fallback-card">
                  <div className="fallback-icon-box">
                    {renderFileIcon(selectedPreviewFile.type, 48)}
                  </div>
                  <h4>{selectedPreviewFile.name}</h4>
                  <p>Direct preview is not supported for this file type.</p>
                  <button
                    className="btn-primary-action btn-compact-upload"
                    onClick={(e) => handleDownloadFile(e, selectedPreviewFile)}
                    style={{ marginTop: '16px' }}
                  >
                    <Download size={16} />
                    <span>Download File ({selectedPreviewFile.size})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
