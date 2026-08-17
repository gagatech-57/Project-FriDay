import React, { useState, useEffect } from 'react';
import { User, Mail, AtSign, ShieldCheck, Check, Save } from 'lucide-react';
import { fetchUserProfileApi, updateUserProfileApi } from '../services/api';

export default function ProfileView({ user, onUpdateUserSuccess, onShowToast }) {
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [username, setUsername] = useState(user && user.email ? user.email.split('@')[0] : 'guna');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.email) {
      setName(user.name || '');
      setEmail(user.email || '');
      fetchUserProfileApi(user.email).then((res) => {
        if (res && res.success && res.user) {
          if (res.user.username) setUsername(res.user.username);
        }
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await updateUserProfileApi({ email, name, username });
      setSaving(false);

      if (res.success) {
        if (onUpdateUserSuccess) {
          onUpdateUserSuccess({ ...user, name, username });
        }
        if (onShowToast) onShowToast('Profile details updated successfully', 'success');
      } else {
        if (onShowToast) onShowToast(res.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      setSaving(false);
      if (onShowToast) onShowToast('Network error updating profile', 'error');
    }
  };

  const getInitials = (n) => {
    if (!n) return 'PF';
    return n.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="view-container">
      <div className="view-page-header">
        <h2>Profile</h2>
        <p>Manage your public personal details and username.</p>
      </div>

      <div className="profile-page-card">
        {/* Avatar Hero */}
        <div className="profile-hero-row">
          <div className="profile-avatar-large">
            {getInitials(name)}
          </div>
          <div>
            <h3 className="profile-hero-name">{name || 'Guna'}</h3>
            <p className="profile-hero-email">{email || 'guna@example.com'}</p>
            <div className="profile-verified-badge">
              <ShieldCheck size={14} color="#10b981" />
              <span>Verified Friday User</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label className="input-label">Full Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User size={16} className="input-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <AtSign size={16} className="input-icon" />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="input-field"
                value={email}
                readOnly
                disabled
                style={{ opacity: 0.7 }}
              />
              <Mail size={16} className="input-icon" />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary-action"
            disabled={saving}
            style={{ width: 'auto', padding: '0 24px', marginTop: '12px' }}
          >
            {saving ? (
              <>
                <div className="spinner-small" />
                <span>Saving changes...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
