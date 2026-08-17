import React from 'react';
import { Upload, ShieldCheck, Sparkles, ArrowRight, X } from 'lucide-react';

export default function OnboardingModal({ userName, onUploadClick, onSkip }) {
  return (
    <div className="upload-modal-overlay">
      <div className="onboarding-modal-card">
        <button className="onboarding-close-btn" onClick={onSkip} title="Skip onboarding">
          <X size={18} />
        </button>

        <div className="onboarding-icon-box">
          <Sparkles size={28} color="#00f2fe" />
        </div>

        <h3 className="onboarding-title">
          Welcome to Project Friday, {userName || 'Guna'} 👋
        </h3>

        <p className="onboarding-desc">
          Your secure personal cloud storage space is ready. Store documents, images, and media safely with end-to-end GridFS chunk protection.
        </p>

        <div className="onboarding-actions">
          <button className="btn-primary-action" onClick={onUploadClick}>
            <Upload size={18} />
            <span>Upload your first file</span>
          </button>

          <button className="btn-skip-link" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
