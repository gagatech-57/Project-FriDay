import React, { useState } from 'react';
import { Share2, Copy, Check, Send, Mail, Lock, X } from 'lucide-react';
import { shareFileApi } from '../services/api';

export default function ShareModal({ file, onClose, onShowToast }) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [accessRole, setAccessRole] = useState('view');
  const [shareUrl, setShareUrl] = useState(
    file ? `${window.location.origin}/api/files/${file.id}/stream` : ''
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (onShowToast) onShowToast('Link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    if (onShowToast) onShowToast(`Invitation sent to ${inviteEmail}`, 'success');
    setInviteEmail('');
  };

  return (
    <div className="upload-modal-overlay">
      <div className="share-modal-card">
        <div className="share-modal-header">
          <div className="share-icon-wrapper">
            <Share2 size={20} color="var(--primary-accent)" />
          </div>
          <div>
            <h3>Share "{file ? file.name : 'file'}"</h3>
            <p>Anyone with the link can {accessRole === 'view' ? 'view' : 'download'} this file.</p>
          </div>
          <button className="share-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="share-modal-body">
          {/* Link Sharing Box */}
          <div className="share-section">
            <label className="input-label">Anyone with the link</label>
            <div className="share-link-input-group">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="input-field share-link-field"
              />
              <button className="btn-copy-link" onClick={handleCopyLink}>
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="divider-line" style={{ margin: '18px 0' }}>
            <span>OR</span>
          </div>

          {/* Email Invite Box */}
          <form onSubmit={handleSendInvite} className="share-section">
            <label className="input-label">Invite people</label>
            <div className="share-invite-row">
              <div className="input-wrapper" style={{ flex: 1 }}>
                <input
                  type="email"
                  className="input-field"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Mail size={16} className="input-icon" />
              </div>
              <select
                className="access-select-field"
                value={accessRole}
                onChange={(e) => setAccessRole(e.target.value)}
              >
                <option value="view">Can View</option>
                <option value="download">Can Download</option>
              </select>
              <button type="submit" className="btn-invite-send" title="Send Invitation">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
