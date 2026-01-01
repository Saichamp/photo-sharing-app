/**
 * System Settings - Main Configuration Panel
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SystemSettings.css';

const SystemSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        showMessage('error', 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [API_URL]);

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Save section settings
  const saveSettings = async (section, data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${API_URL}/settings/${section}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSettings(prev => ({
          ...prev,
          [section]: response.data.data
        }));
        showMessage('success', 'Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle general settings update
  const handleGeneralUpdate = (field, value) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value
      }
    }));
  };

  // Handle email settings update
  const handleEmailUpdate = (field, value) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [field]: value
      }
    }));
  };

  // Handle storage settings update
  const handleStorageUpdate = (field, value) => {
    setSettings(prev => ({
      ...prev,
      storage: {
        ...prev.storage,
        [field]: value
      }
    }));
  };

  // Handle security settings update
  const handleSecurityUpdate = (field, value) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [field]: value
      }
    }));
  };

  // Handle face recognition settings update
  const handleFaceUpdate = (field, value) => {
    setSettings(prev => ({
      ...prev,
      faceRecognition: {
        ...prev.faceRecognition,
        [field]: value
      }
    }));
  };

  // Handle maintenance mode update
  const handleMaintenanceUpdate = (field, value) => {
    setSettings(prev => ({
      ...prev,
      maintenance: {
        ...prev.maintenance,
        [field]: value
      }
    }));
  };

  // Test email configuration
  const testEmailConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const testEmail = prompt('Enter test email address:');
      
      if (!testEmail) return;

      const response = await axios.post(
        `${API_URL}/settings/email/test`,
        { testEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showMessage('success', response.data.message);
      }
    } catch (error) {
      console.error('Error testing email:', error);
      showMessage('error', 'Failed to send test email');
    }
  };

  if (loading) {
    return (
      <div className="system-settings loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="system-settings">
      {/* Header */}
      <div className="settings-header">
        <div>
          <button onClick={() => navigate('/admin')} className="btn-back">
            ← Back to Dashboard
          </button>
          <h1>⚙️ System Settings</h1>
          <p>Configure your PhotoManEa application</p>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Settings Container */}
      <div className="settings-container">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <button
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <span className="tab-icon">🌐</span>
            <span>General</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <span className="tab-icon">📧</span>
            <span>Email</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            <span className="tab-icon">💾</span>
            <span>Storage</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="tab-icon">🔒</span>
            <span>Security</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'face' ? 'active' : ''}`}
            onClick={() => setActiveTab('face')}
          >
            <span className="tab-icon">👤</span>
            <span>Face Recognition</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <span className="tab-icon">🔧</span>
            <span>Maintenance</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* General Settings */}
          {activeTab === 'general' && settings?.general && (
            <div className="settings-section">
              <h2>🌐 General Settings</h2>
              <p className="section-description">Basic application configuration</p>

              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => handleGeneralUpdate('siteName', e.target.value)}
                  placeholder="PhotoManEa"
                />
              </div>

              <div className="form-group">
                <label>Site Description</label>
                <textarea
                  value={settings.general.siteDescription}
                  onChange={(e) => handleGeneralUpdate('siteDescription', e.target.value)}
                  placeholder="AI-Powered Event Photo Management"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Site URL</label>
                <input
                  type="url"
                  value={settings.general.siteUrl}
                  onChange={(e) => handleGeneralUpdate('siteUrl', e.target.value)}
                  placeholder="https://photomanea.com"
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(e) => handleGeneralUpdate('contactEmail', e.target.value)}
                  placeholder="support@photomanea.com"
                />
              </div>

              <div className="form-group">
                <label>Support Phone</label>
                <input
                  type="tel"
                  value={settings.general.supportPhone}
                  onChange={(e) => handleGeneralUpdate('supportPhone', e.target.value)}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => handleGeneralUpdate('timezone', e.target.value)}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Language</label>
                <select
                  value={settings.general.language}
                  onChange={(e) => handleGeneralUpdate('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <button
                onClick={() => saveSettings('general', settings.general)}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : '💾 Save General Settings'}
              </button>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && settings?.email && (
            <div className="settings-section">
              <h2>📧 Email Settings</h2>
              <p className="section-description">Configure email notifications</p>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.email.enabled}
                    onChange={(e) => handleEmailUpdate('enabled', e.target.checked)}
                  />
                  <span>Enable Email Notifications</span>
                </label>
              </div>

              <div className="form-group">
                <label>Email Provider</label>
                <select
                  value={settings.email.provider}
                  onChange={(e) => handleEmailUpdate('provider', e.target.value)}
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                </select>
              </div>

              {settings.email.provider === 'smtp' && (
                <>
                  <div className="form-group">
                    <label>SMTP Host</label>
                    <input
                      type="text"
                      value={settings.email.smtp?.host || ''}
                      onChange={(e) => handleEmailUpdate('smtp', { ...settings.email.smtp, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>SMTP Port</label>
                    <input
                      type="number"
                      value={settings.email.smtp?.port || ''}
                      onChange={(e) => handleEmailUpdate('smtp', { ...settings.email.smtp, port: parseInt(e.target.value) })}
                      placeholder="587"
                    />
                  </div>

                  <div className="form-group">
                    <label>SMTP Username</label>
                    <input
                      type="text"
                      value={settings.email.smtp?.username || ''}
                      onChange={(e) => handleEmailUpdate('smtp', { ...settings.email.smtp, username: e.target.value })}
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>SMTP Password</label>
                    <input
                      type="password"
                      value={settings.email.smtp?.password || ''}
                      onChange={(e) => handleEmailUpdate('smtp', { ...settings.email.smtp, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>From Email</label>
                <input
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => handleEmailUpdate('fromEmail', e.target.value)}
                  placeholder="noreply@photomanea.com"
                />
              </div>

              <div className="form-group">
                <label>From Name</label>
                <input
                  type="text"
                  value={settings.email.fromName}
                  onChange={(e) => handleEmailUpdate('fromName', e.target.value)}
                  placeholder="PhotoManEa"
                />
              </div>

              <div className="button-group">
                <button
                  onClick={() => saveSettings('email', settings.email)}
                  disabled={saving}
                  className="btn-save"
                >
                  {saving ? 'Saving...' : '💾 Save Email Settings'}
                </button>

                <button
                  onClick={testEmailConfig}
                  className="btn-test"
                >
                  📤 Send Test Email
                </button>
              </div>
            </div>
          )}

          {/* Storage Settings */}
          {activeTab === 'storage' && settings?.storage && (
            <div className="settings-section">
              <h2>💾 Storage Settings</h2>
              <p className="section-description">Configure file upload and storage</p>

              <div className="form-group">
                <label>Max File Size (MB)</label>
                <input
                  type="number"
                  value={settings.storage.maxFileSize / (1024 * 1024)}
                  onChange={(e) => handleStorageUpdate('maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                  min="1"
                  max="100"
                />
                <small>Maximum size per uploaded photo</small>
              </div>

              <div className="form-group">
                <label>Max Photos Per Event</label>
                <input
                  type="number"
                  value={settings.storage.maxPhotosPerEvent}
                  onChange={(e) => handleStorageUpdate('maxPhotosPerEvent', parseInt(e.target.value))}
                  min="10"
                  max="10000"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.storage.compressionEnabled}
                    onChange={(e) => handleStorageUpdate('compressionEnabled', e.target.checked)}
                  />
                  <span>Enable Image Compression</span>
                </label>
              </div>

              {settings.storage.compressionEnabled && (
                <div className="form-group">
                  <label>Compression Quality (%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.storage.compressionQuality}
                    onChange={(e) => handleStorageUpdate('compressionQuality', parseInt(e.target.value))}
                  />
                  <span className="range-value">{settings.storage.compressionQuality}%</span>
                </div>
              )}

              <div className="form-group">
                <label>Storage Provider</label>
                <select
                  value={settings.storage.storageProvider}
                  onChange={(e) => handleStorageUpdate('storageProvider', e.target.value)}
                >
                  <option value="local">Local Storage</option>
                  <option value="s3">Amazon S3</option>
                  <option value="cloudinary">Cloudinary</option>
                </select>
              </div>

              <button
                onClick={() => saveSettings('storage', settings.storage)}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : '💾 Save Storage Settings'}
              </button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && settings?.security && (
            <div className="settings-section">
              <h2>🔒 Security Settings</h2>
              <p className="section-description">Password policies and authentication</p>

              <div className="form-group">
                <label>Minimum Password Length</label>
                <input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => handleSecurityUpdate('passwordMinLength', parseInt(e.target.value))}
                  min="6"
                  max="32"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireUppercase}
                    onChange={(e) => handleSecurityUpdate('passwordRequireUppercase', e.target.checked)}
                  />
                  <span>Require Uppercase Letters</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireNumbers}
                    onChange={(e) => handleSecurityUpdate('passwordRequireNumbers', e.target.checked)}
                  />
                  <span>Require Numbers</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireSpecialChars}
                    onChange={(e) => handleSecurityUpdate('passwordRequireSpecialChars', e.target.checked)}
                  />
                  <span>Require Special Characters</span>
                </label>
              </div>

              <div className="form-group">
                <label>Session Timeout (hours)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSecurityUpdate('sessionTimeout', parseInt(e.target.value))}
                  min="1"
                  max="168"
                />
              </div>

              <div className="form-group">
                <label>Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleSecurityUpdate('maxLoginAttempts', parseInt(e.target.value))}
                  min="3"
                  max="10"
                />
              </div>

              <div className="form-group">
                <label>Lockout Duration (minutes)</label>
                <input
                  type="number"
                  value={settings.security.lockoutDuration}
                  onChange={(e) => handleSecurityUpdate('lockoutDuration', parseInt(e.target.value))}
                  min="5"
                  max="1440"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.security.rateLimitEnabled}
                    onChange={(e) => handleSecurityUpdate('rateLimitEnabled', e.target.checked)}
                  />
                  <span>Enable Rate Limiting</span>
                </label>
              </div>

              <button
                onClick={() => saveSettings('security', settings.security)}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : '💾 Save Security Settings'}
              </button>
            </div>
          )}

          {/* Face Recognition Settings */}
          {activeTab === 'face' && settings?.faceRecognition && (
            <div className="settings-section">
              <h2>👤 Face Recognition Settings</h2>
              <p className="section-description">Configure AI face matching</p>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.faceRecognition.enabled}
                    onChange={(e) => handleFaceUpdate('enabled', e.target.checked)}
                  />
                  <span>Enable Face Recognition</span>
                </label>
              </div>

              <div className="form-group">
                <label>Match Threshold</label>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.05"
                  value={settings.faceRecognition.matchThreshold}
                  onChange={(e) => handleFaceUpdate('matchThreshold', parseFloat(e.target.value))}
                />
                <span className="range-value">{settings.faceRecognition.matchThreshold}</span>
                <small>Lower = more matches, Higher = stricter matching</small>
              </div>

              <div className="form-group">
                <label>Detection Model</label>
                <select
                  value={settings.faceRecognition.detectionModel}
                  onChange={(e) => handleFaceUpdate('detectionModel', e.target.value)}
                >
                  <option value="ssd_mobilenetv1">SSD MobileNet V1 (Balanced)</option>
                  <option value="tiny_face_detector">Tiny Face Detector (Fast)</option>
                  <option value="mtcnn">MTCNN (Accurate)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Faces Per Photo</label>
                <input
                  type="number"
                  value={settings.faceRecognition.maxFacesPerPhoto}
                  onChange={(e) => handleFaceUpdate('maxFacesPerPhoto', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Minimum Face Size (pixels)</label>
                <input
                  type="number"
                  value={settings.faceRecognition.minFaceSize}
                  onChange={(e) => handleFaceUpdate('minFaceSize', parseInt(e.target.value))}
                  min="20"
                  max="200"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.faceRecognition.autoProcessing}
                    onChange={(e) => handleFaceUpdate('autoProcessing', e.target.checked)}
                  />
                  <span>Auto-process Photos on Upload</span>
                </label>
              </div>

              <button
                onClick={() => saveSettings('face-recognition', settings.faceRecognition)}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : '💾 Save Face Recognition Settings'}
              </button>
            </div>
          )}

          {/* Maintenance Mode */}
          {activeTab === 'maintenance' && settings?.maintenance && (
            <div className="settings-section">
              <h2>🔧 Maintenance Mode</h2>
              <p className="section-description">Control site access during maintenance</p>

              <div className="form-group">
                <label className="checkbox-label toggle-large">
                  <input
                    type="checkbox"
                    checked={settings.maintenance.enabled}
                    onChange={(e) => handleMaintenanceUpdate('enabled', e.target.checked)}
                  />
                  <span className="toggle-text">
                    {settings.maintenance.enabled ? '🔴 Maintenance Mode ON' : '🟢 Site is Live'}
                  </span>
                </label>
              </div>

              <div className="form-group">
                <label>Maintenance Message</label>
                <textarea
                  value={settings.maintenance.message}
                  onChange={(e) => handleMaintenanceUpdate('message', e.target.value)}
                  rows="4"
                  placeholder="System is under maintenance..."
                />
              </div>

              <button
                onClick={() => saveSettings('maintenance', settings.maintenance)}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : '💾 Save Maintenance Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
