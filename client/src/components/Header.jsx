import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShieldCheck, 
  ChevronDown, 
  User, 
  Settings, 
  Lock, 
  LogOut, 
  HelpCircle, 
  CheckCircle,
  Bell,
  Menu
} from 'lucide-react';

export default function Header({ user, searchTerm, onSearchChange, onSelectTab, onLogout, searchCount = 0, onToggleSidebar, isSidebarOpen }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
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

  return (
    <header className="app-top-header">
      {/* 3-Line Hamburger Menu Sidebar Toggle Button */}
      <button
        className="sidebar-toggle-btn"
        onClick={onToggleSidebar}
        title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        aria-label="Toggle Sidebar"
      >
        <Menu size={20} color="var(--text-primary)" />
      </button>

      {/* Mobile Brand Title */}
      <div className="mobile-brand-left">
        <ShieldCheck size={24} color="var(--primary-accent)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '1.1rem' }}>Friday</span>
      </div>

      {/* Global Center Search Input */}
      <div className="header-search-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input-field"
          placeholder="Search your files..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <span className="search-results-badge">
            {searchCount} {searchCount === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>

      {/* Right User Badge & Dropdown */}
      <div className="header-right-actions" ref={dropdownRef}>
        <div 
          className="user-profile-trigger"
          onClick={() => setShowDropdown(!showDropdown)}
          role="button"
          tabIndex={0}
        >
          <div className="avatar-circle">
            {getInitials(user ? user.name : '')}
          </div>
          <div className="user-name-wrapper">
            <div className="user-display-name">{user ? user.name : 'Guna'}</div>
            <div className="user-display-email">{user ? user.email : 'guna@example.com'}</div>
          </div>
          <ChevronDown size={15} color="#64748b" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
        </div>

        {/* Profile Dropdown Popover */}
        {showDropdown && (
          <div className="header-profile-popover">
            <div className="popover-user-card">
              <div className="avatar-circle" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                {getInitials(user ? user.name : '')}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 className="popover-name">{user ? user.name : 'Guna'}</h4>
                <p className="popover-email">{user ? user.email : 'guna@example.com'}</p>
              </div>
            </div>

            <div className="popover-status-badge">
              <CheckCircle size={13} color="#10b981" />
              <span>Protected Personal Cloud</span>
            </div>

            <div className="popover-menu-links">
              <button className="popover-item" onClick={() => { onSelectTab('profile'); setShowDropdown(false); }}>
                <User size={16} />
                <span>Profile</span>
              </button>

              <button className="popover-item" onClick={() => { onSelectTab('settings'); setShowDropdown(false); }}>
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <button className="popover-item" onClick={() => { onSelectTab('security'); setShowDropdown(false); }}>
                <Lock size={16} />
                <span>Security</span>
              </button>

              <button className="popover-item" onClick={() => { onSelectTab('settings'); setShowDropdown(false); }}>
                <HelpCircle size={16} />
                <span>Help & Support</span>
              </button>

              <div className="popover-divider" />

              <button className="popover-item popover-logout" onClick={onLogout}>
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
