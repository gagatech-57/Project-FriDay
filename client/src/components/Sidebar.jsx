import React from 'react';
import { 
  Home, 
  Folder, 
  Clock, 
  Star, 
  Trash2, 
  Settings, 
  ShieldCheck, 
  User, 
  Plus, 
  HardDrive,
  HelpCircle
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, onOpenUpload, storageUsedMB = 12.4, storageTotalMB = 5120 }) {
  const percentUsed = Math.min(100, Math.max(2, (storageUsedMB / storageTotalMB) * 100));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="app-sidebar-desktop">
        <div className="sidebar-brand-row">
          <div className="brand-logo-icon" style={{ width: '36px', height: '36px' }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <span className="sidebar-brand-name">Project Friday</span>
        </div>

        {/* Primary + Upload File Action Pill */}
        <button className="sidebar-upload-btn" onClick={onOpenUpload}>
          <Plus size={18} />
          <span>Upload File</span>
        </button>

        {/* Main Navigation Group */}
        <div className="sidebar-nav-group">
          <div className="nav-group-title">Cloud Storage</div>

          <button
            className={`nav-item-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onSelectTab('home')}
          >
            <Home size={18} />
            <span>Home</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => onSelectTab('files')}
          >
            <Folder size={18} />
            <span>My Files</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => onSelectTab('recent')}
          >
            <Clock size={18} />
            <span>Recent</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => onSelectTab('favorites')}
          >
            <Star size={18} />
            <span>Favorites</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === 'trash' ? 'active' : ''}`}
            onClick={() => onSelectTab('trash')}
          >
            <Trash2 size={18} />
            <span>Trash</span>
          </button>
        </div>

        {/* Lower System Navigation Group */}
        <div className="sidebar-nav-group" style={{ marginTop: 'auto' }}>
          <div className="nav-group-title">Preferences</div>

          <button
            className={`nav-item-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onSelectTab('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => onSelectTab('security')}
          >
            <ShieldCheck size={18} />
            <span>Security</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => onSelectTab('profile')}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </div>

        {/* Compact Storage Meter Widget */}
        <div className="sidebar-storage-widget">
          <div className="storage-widget-header">
            <HardDrive size={15} color="var(--primary-accent)" />
            <span>Storage</span>
          </div>
          <div className="storage-widget-bar">
            <div className="storage-widget-fill" style={{ width: `${percentUsed}%` }} />
          </div>
          <div className="storage-widget-text">
            {storageUsedMB} MB of {storageTotalMB >= 1024 ? `${(storageTotalMB / 1024).toFixed(0)} GB` : `${storageTotalMB} MB`} used
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onSelectTab('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => onSelectTab('files')}
        >
          <Folder size={20} />
          <span>Files</span>
        </button>

        <button
          className={`mobile-nav-upload-btn`}
          onClick={onOpenUpload}
        >
          <Plus size={22} color="#ffffff" />
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => onSelectTab('favorites')}
        >
          <Star size={20} />
          <span>Favorites</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </>
  );
}
