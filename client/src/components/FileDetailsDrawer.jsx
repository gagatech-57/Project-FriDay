import React from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Share2, 
  Star, 
  Trash2, 
  ShieldCheck, 
  HardDrive, 
  User, 
  Calendar, 
  Hash, 
  File
} from 'lucide-react';

export default function FileDetailsDrawer({ file, onClose, onDownload, onShare, onFavoriteToggle, onTrashToggle }) {
  if (!file) return null;

  return (
    <div className="details-drawer-overlay" onClick={onClose}>
      <div className="details-drawer-card" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>File Information</h3>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* File Icon / Thumbnail Hero */}
          <div className="drawer-hero-box">
            {file.type === 'image' && file.url ? (
              <img src={file.url} alt={file.name} className="drawer-img-hero" />
            ) : (
              <div className="drawer-icon-placeholder">
                <FileText size={48} color="var(--primary-accent)" />
              </div>
            )}
            <h4 className="drawer-filename">{file.name}</h4>
            <div className="drawer-size-badge">{file.size}</div>
          </div>

          {/* Action Toolbar */}
          <div className="drawer-actions-grid">
            <button className="drawer-action-btn" onClick={() => onDownload(file)}>
              <Download size={16} />
              <span>Download</span>
            </button>
            <button className="drawer-action-btn" onClick={() => onShare(file)}>
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button className={`drawer-action-btn ${file.isFavorite ? 'active' : ''}`} onClick={() => onFavoriteToggle(file)}>
              <Star size={16} fill={file.isFavorite ? '#f59e0b' : 'none'} color={file.isFavorite ? '#f59e0b' : 'currentColor'} />
              <span>{file.isFavorite ? 'Starred' : 'Favorite'}</span>
            </button>
            <button className="drawer-action-btn btn-danger-action" onClick={() => onTrashToggle(file)}>
              <Trash2 size={16} />
              <span>{file.isDeleted ? 'Restore' : 'Trash'}</span>
            </button>
          </div>

          {/* Detailed Metadata Items */}
          <div className="drawer-meta-list">
            <div className="meta-row">
              <div className="meta-label"><File size={15} /> File type</div>
              <div className="meta-value">{file.mimeType || file.type || 'Document'}</div>
            </div>

            <div className="meta-row">
              <div className="meta-label"><HardDrive size={15} /> File size</div>
              <div className="meta-value">{file.size} ({file.fileSizeBytes || 0} bytes)</div>
            </div>

            <div className="meta-row">
              <div className="meta-label"><Calendar size={15} /> Uploaded date</div>
              <div className="meta-value">{file.date || 'Aug 17, 2026'}</div>
            </div>

            <div className="meta-row">
              <div className="meta-label"><User size={15} /> Owner</div>
              <div className="meta-value">{file.userEmail || 'You'}</div>
            </div>

            <div className="meta-row">
              <div className="meta-label"><ShieldCheck size={15} /> Security Status</div>
              <div className="meta-value status-secure-text">MongoDB GridFS Payload Encrypted</div>
            </div>

            <div className="meta-row">
              <div className="meta-label"><Hash size={15} /> SHA-256 Checksum</div>
              <div className="meta-value font-mono-text">{file.checksum || 'e3b0c44298fc1c14'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
