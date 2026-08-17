import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ title, message, confirmText = 'Confirm', confirmStyle = 'danger', onConfirm, onCancel }) {
  return (
    <div className="upload-modal-overlay">
      <div className="confirm-modal-card">
        <div className="confirm-modal-header">
          <div className="confirm-warning-icon">
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <h3>{title || 'Confirm Action'}</h3>
          <button className="confirm-close-btn" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <div className="confirm-modal-body">
          <p>{message || 'Are you sure you want to proceed? This action cannot be undone.'}</p>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className={`btn-confirm-${confirmStyle}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
