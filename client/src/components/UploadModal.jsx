import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, RefreshCw, X, Plus } from 'lucide-react';
import { uploadFileApi } from '../services/api';

export default function UploadModal({ userEmail, onClose, onUploadSuccess }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]); // [{ id, file, progress, status, error }]

  const handleFilesAdded = (fileList) => {
    const newItems = Array.from(fileList).map((file) => ({
      id: 'up_' + Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      progress: 0,
      status: 'pending', // 'pending' | 'uploading' | 'completed' | 'error'
      error: ''
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => startUploadItem(item));
  };

  const startUploadItem = (item) => {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q))
    );

    let progress = 10;
    const timer = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 95) {
        progress = 95;
        clearInterval(timer);

        // Perform actual GridFS upload
        const formData = new FormData();
        formData.append('file', item.file);
        if (userEmail) formData.append('userEmail', userEmail);

        uploadFileApi(formData)
          .then((res) => {
            if (res && res.success) {
              setUploadQueue((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q))
              );
              onUploadSuccess(res.file);
            } else {
              setUploadQueue((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: res.message || 'Upload failed' } : q))
              );
            }
          })
          .catch((err) => {
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: 'Network error uploading file' } : q))
            );
          });
      } else {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress } : q))
        );
      }
    }, 120);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  return (
    <div className="upload-modal-overlay">
      <div className="upload-dropzone-modal">
        <div className="upload-modal-header">
          <h3>Upload files</h3>
          <button className="upload-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          className={`dropzone-box ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
            style={{ display: 'none' }}
            multiple
          />
          <div className="dropzone-icon-wrapper">
            <UploadCloud size={34} color="var(--primary-accent)" />
          </div>
          <h4 className="dropzone-title">Drag and drop files here</h4>
          <p className="dropzone-sub">or click to browse from your computer</p>
          <div className="supported-types-pill">
            Supports PDF, PNG, JPG, MP4, Audio, Code & Encrypted files (Max 500MB)
          </div>
        </div>

        {/* Upload Progress Queue List */}
        {uploadQueue.length > 0 && (
          <div className="upload-queue-container">
            <div className="queue-header">
              Uploading {uploadQueue.filter((q) => q.status === 'completed').length} of {uploadQueue.length} files
            </div>

            {uploadQueue.map((item) => (
              <div key={item.id} className="upload-queue-item">
                <div className="item-file-icon">
                  <File size={18} color="var(--primary-accent)" />
                </div>
                <div className="item-file-info">
                  <div className="item-filename-row">
                    <span className="item-name">{item.name}</span>
                    <span className="item-size">{item.sizeMB}</span>
                  </div>

                  {item.status === 'uploading' && (
                    <div className="queue-progress-bar">
                      <div className="queue-progress-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <div className="status-badge status-success">
                      <CheckCircle2 size={13} /> Completed
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="status-badge status-error">
                      <AlertCircle size={13} /> {item.error || 'Failed'}
                      <button className="retry-btn" onClick={() => startUploadItem(item)}>
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="upload-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
