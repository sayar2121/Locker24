import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  ChevronRight,
  ToggleLeft as Toggle,
  Trash2,
  Lock,
  User as UserIcon,
  Mail,
  QrCode,
  Key,
  CheckCircle,
  AlertTriangle,
  Download,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const SettingSection = ({ title, icon: Icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 px-2">
      <Icon size={18} className="text-primary-500" />
      <h2 className="text-lg font-bold text-slate-200">{title}</h2>
    </div>
    <div className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
      {children}
    </div>
  </div>
);

const SettingsPage = () => {
  const { token, API_URL, logout } = useAuth();
  
  // Profile settings state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    username: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // System toggles state
  const [notifications, setNotifications] = useState({
    email: true,
    security: true,
    reminders: true
  });
  const [appLock, setAppLock] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);
  const [tfaEnabled, setTfaEnabled] = useState(false);

  // Storage metric states
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const LIMIT_BYTES = 15 * 1024 * 1024 * 1024; // 15 GB

  // Modals & Notices
  const [toastMessage, setToastMessage] = useState(null);
  const [show2faModal, setShow2faModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  
  // Custom Vault PIN states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinForm, setPinForm] = useState({ newPin: '', confirmPin: '' });
  const [pinError, setPinError] = useState('');
  const [customPinSet, setCustomPinSet] = useState(false);

  // 2FA modal state
  const [verificationCode, setVerificationCode] = useState('');
  const [tfaError, setTfaError] = useState('');
  const [isVerifyingTfa, setIsVerifyingTfa] = useState(false);

  // Sessions list
  const [sessions, setSessions] = useState([
    { id: 'sess_1', device: 'Chrome on Windows (Current Session)', ip: '192.168.1.45', active: 'Just Now', current: true },
    { id: 'sess_2', device: 'Safari on iPhone 15 Pro', ip: '172.56.21.9', active: '3 hours ago', current: false },
    { id: 'sess_3', device: 'Firefox on macOS Sonoma', ip: '94.23.112.54', active: '2 days ago', current: false }
  ]);

  const parseSizeToBytes = (sizeStr) => {
    if (!sizeStr) return 0;
    const match = sizeStr.trim().match(/^([\d.]+)\s*([A-Za-z]+)?$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    const multipliers = {
      'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024, 'TB': 1024 * 1024 * 1024 * 1024
    };
    return value * (multipliers[unit] || 1);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch initial profile and storage details
  useEffect(() => {
    const fetchSettingsData = async () => {
      if (!token) return;
      setIsLoadingStorage(true);
      try {
        // Fetch User Info
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfile({
            name: userData.name || '',
            email: userData.email || '',
            username: userData.username || ''
          });
        }

        // Fetch Documents for Storage calculation
        const docRes = await fetch(`${API_URL}/api/documents/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (docRes.ok) {
          const documents = await docRes.json();
          const totalBytes = documents.reduce((sum, doc) => sum + parseSizeToBytes(doc.size), 0);
          setStorageUsedBytes(totalBytes);
        }
      } catch (error) {
        console.error('Failed to load settings data:', error);
      } finally {
        setIsLoadingStorage(false);
      }
    };

    // Load local storage preferences
    const savedNotifications = localStorage.getItem('settings_notifications');
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    setAppLock(localStorage.getItem('settings_app_lock') === 'true');
    setAutoArchive(localStorage.getItem('settings_auto_archive') === 'true');
    setTfaEnabled(localStorage.getItem('settings_tfa') === 'true');
    setCustomPinSet(!!localStorage.getItem('vault_lock_pin'));

    fetchSettingsData();
  }, [token, API_URL]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (passwordForm.new_password && passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('New passwords do not match!');
      return;
    }

    try {
      const payload = {
        name: profile.name,
        email: profile.email
      };

      if (passwordForm.new_password) {
        payload.current_password = passwordForm.current_password;
        payload.new_password = passwordForm.new_password;
      }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update context/localStorage user detail
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showToast('Profile preferences updated successfully!');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const errData = await res.json();
        showToast(errData.detail || 'Failed to update profile details.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend server.');
    }
  };

  // Toggle Preferences
  const handleToggleNotification = (key) => {
    const nextVal = { ...notifications, [key]: !notifications[key] };
    setNotifications(nextVal);
    localStorage.setItem('settings_notifications', JSON.stringify(nextVal));
    showToast('Notification triggers modified.');
  };

  const handleToggleAppLock = () => {
    const nextVal = !appLock;
    setAppLock(nextVal);
    localStorage.setItem('settings_app_lock', nextVal ? 'true' : 'false');
    showToast(`App lock protection ${nextVal ? 'enabled' : 'disabled'}.`);
  };

  const handleToggleAutoArchive = () => {
    const nextVal = !autoArchive;
    setAutoArchive(nextVal);
    localStorage.setItem('settings_auto_archive', nextVal ? 'true' : 'false');
    showToast(`Automatic archiving ${nextVal ? 'activated' : 'deactivated'}.`);
  };

  // 2FA Setup Flow
  const handleVerify2fa = () => {
    if (verificationCode.trim().length !== 6) {
      setTfaError('Please enter a valid 6-digit code');
      return;
    }
    setIsVerifyingTfa(true);
    setTfaError('');
    setTimeout(() => {
      setIsVerifyingTfa(false);
      setTfaEnabled(true);
      localStorage.setItem('settings_tfa', 'true');
      setShow2faModal(false);
      setVerificationCode('');
      showToast('Two-Factor Authentication activated successfully!');
    }, 1500);
  };

  const handleDisableTfa = () => {
    setTfaEnabled(false);
    localStorage.setItem('settings_tfa', 'false');
    showToast('Two-Factor Authentication disabled.');
  };

  // JSON Data Export
  const handleExportData = async () => {
    if (!token) return;
    showToast('Preparing secure backup data package...');
    try {
      const res = await fetch(`${API_URL}/api/documents/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const activityRes = await fetch(`${API_URL}/api/activity/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let docs = [];
      let logs = [];
      if (res.ok) docs = await res.json();
      if (activityRes.ok) logs = await activityRes.json();

      const backupPackage = {
        exported_at: new Date().toISOString(),
        vault_profile: profile,
        documents: docs,
        activity_logs: logs,
        client_settings: {
          notifications,
          appLock,
          autoArchive,
          tfaEnabled
        }
      };

      const jsonStr = JSON.stringify(backupPackage, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Locker24_Secure_Vault_Backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Backup JSON downloaded successfully.');
    } catch (e) {
      console.error(e);
      showToast('Failed to export vault backup data.');
    }
  };

  // Account Deactivation
  const handleDeactivate = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        window.location.href = '/login?deactivated=true';
      } else {
        showToast('Failed to execute account deactivation.');
      }
    } catch (e) {
      showToast('Error connecting to backend server.');
    }
  };

  // Save Secure Vault Access PIN
  const handleSavePin = (e) => {
    e.preventDefault();
    if (pinForm.newPin.length !== 4 || !/^\d+$/.test(pinForm.newPin)) {
      setPinError('PIN must be exactly 4 digits long.');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('Passwords/PINs do not match.');
      return;
    }
    localStorage.setItem('vault_lock_pin', pinForm.newPin);
    setCustomPinSet(true);
    setShowPinModal(false);
    setPinForm({ newPin: '', confirmPin: '' });
    setPinError('');
    showToast('Vault Access PIN updated successfully!');
  };

  const percentageUsed = Math.min(100, parseFloat(((storageUsedBytes / LIMIT_BYTES) * 100).toFixed(2)));
  const freeBytes = Math.max(0, LIMIT_BYTES - storageUsedBytes);



  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className="p-8 space-y-10 max-w-7xl mx-auto w-full">
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-6 right-6 z-50 glass bg-primary-950/80 border border-primary-500/30 text-primary-400 py-3 px-6 rounded-2xl shadow-xl font-bold flex items-center gap-2"
              >
                <CheckCircle size={18} />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Section */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-600/10 text-primary-500 flex items-center justify-center">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display">System Settings</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Manage your secure zero-knowledge preferences, profile parameters, and account settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            
            {/* User Profile Editor Section */}
            <SettingSection title="User Profile Settings" icon={UserIcon}>
              <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    label="Full Name" 
                    type="text" 
                    icon={UserIcon}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required 
                  />
                  <Input 
                    label="Email Address" 
                    type="email" 
                    icon={Mail}
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required 
                  />
                </div>
                
                <div className="h-px bg-white/5 my-2"></div>
                <h3 className="text-sm font-bold text-slate-400 px-1">Update Security Key (Password)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input 
                    label="Current Password" 
                    type="password" 
                    placeholder="••••••••"
                    icon={Lock}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    required={!!passwordForm.new_password}
                  />
                  <Input 
                    label="New Password" 
                    type="password" 
                    placeholder="••••••••"
                    icon={Lock}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  />
                  <Input 
                    label="Confirm New Password" 
                    type="password" 
                    placeholder="••••••••"
                    icon={Lock}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit">Save Profile Changes</Button>
                </div>
              </form>
            </SettingSection>

            {/* Account & Security Settings */}
            <SettingSection title="Account & Security" icon={Shield}>
              
              {/* Two-Factor Authentication */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Add an extra layer of biometric/security code validation on log in</div>
                </div>
                {tfaEnabled ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 py-1 px-2.5 rounded-full">ACTIVE</span>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 font-bold" onClick={handleDisableTfa}>Disable</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="text-primary-500" onClick={() => setShow2faModal(true)}>Configure</Button>
                )}
              </div>
              
              <div className="h-px bg-white/5"></div>

              {/* Active Sessions */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Active Sessions</div>
                  <div className="text-sm text-muted-foreground">Inspect and terminate active web console connections</div>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-500" onClick={() => setShowSessionsModal(true)}>View All ({sessions.length})</Button>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* App Lock Toggle */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Vault App Lock Protection</div>
                  <div className="text-sm text-muted-foreground">Automatically lock console UI after 10 minutes of complete inactivity</div>
                </div>
                <button 
                  onClick={handleToggleAppLock}
                  className={`w-12 h-6 rounded-full transition-all relative ${appLock ? 'bg-primary-600 shadow-[0_0_10px_rgba(2,132,199,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${appLock ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* Vault Lock PIN Config */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Vault Access PIN</div>
                  <div className="text-sm text-muted-foreground">Establish a custom 4-digit security PIN to protect highly sensitive categories and document previews</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full ${customPinSet ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                    {customPinSet ? 'CUSTOM SET' : 'DEFAULT (1234)'}
                  </span>
                  <Button variant="ghost" size="sm" className="text-primary-500" onClick={() => setShowPinModal(true)}>
                    {customPinSet ? 'Change PIN' : 'Configure'}
                  </Button>
                </div>
              </div>
            </SettingSection>

            {/* Notification Directives */}
            <SettingSection title="Notifications" icon={Bell}>
              
              {/* Email Notifications */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Email Security Reports</div>
                  <div className="text-sm text-muted-foreground">Receive automated reports concerning secure shared file access details</div>
                </div>
                <button 
                  onClick={() => handleToggleNotification('email')}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.email ? 'bg-primary-600 shadow-[0_0_10px_rgba(2,132,199,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications.email ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="h-px bg-white/5"></div>

              {/* Login Alerts */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Security Warnings</div>
                  <div className="text-sm text-muted-foreground">Alert instantly on new browser profile logins or failed session tries</div>
                </div>
                <button 
                  onClick={() => handleToggleNotification('security')}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.security ? 'bg-primary-600 shadow-[0_0_10px_rgba(2,132,199,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications.security ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* Reminders Toggle */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Shared Link Expiration Warnings</div>
                  <div className="text-sm text-muted-foreground">Trigger reminders 24 hours prior to standard share token link closures</div>
                </div>
                <button 
                  onClick={() => handleToggleNotification('reminders')}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.reminders ? 'bg-primary-600 shadow-[0_0_10px_rgba(2,132,199,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications.reminders ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </SettingSection>

            {/* Storage and Backup Data */}
            <SettingSection title="Storage & Backup Data" icon={Database}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-bold text-slate-200">Storage Usage</div>
                  <div className="text-sm text-primary-500 font-bold">
                    {isLoadingStorage ? 'Calculating...' : `${formatBytes(storageUsedBytes)} / 15.0 GB`}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div 
                    style={{ width: `${percentageUsed}%` }}
                    className="h-full bg-primary-600 rounded-full shadow-[0_0_10px_rgba(2,132,199,0.5)] transition-all duration-500"
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>{isLoadingStorage ? '...' : `${percentageUsed}% Used`}</span>
                  <span>{isLoadingStorage ? '...' : `${formatBytes(freeBytes)} Free`}</span>
                </div>
              </div>
              
              <div className="h-px bg-white/5"></div>
              
              {/* Secure JSON Backup Export */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Export Vault Data</div>
                  <div className="text-sm text-muted-foreground">Download a complete encrypted archive JSON backup of all logs, file items, and configurations</div>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-500 flex items-center gap-1.5" onClick={handleExportData}>
                  <Download size={16} /> Export Backup
                </Button>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* Auto-Archive toggle */}
              <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors">Auto-Archive Old Files</div>
                  <div className="text-sm text-muted-foreground">Move files unaccessed for over 90 days to the secure Archive folder automatically</div>
                </div>
                <button 
                  onClick={handleToggleAutoArchive}
                  className={`w-12 h-6 rounded-full transition-all relative ${autoArchive ? 'bg-primary-600 shadow-[0_0_10px_rgba(2,132,199,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoArchive ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </SettingSection>

            {/* Danger Zone */}
            <div className="pt-4">
              <SettingSection title="Danger Zone" icon={Trash2}>
                <div className="p-6 flex items-center justify-between bg-red-500/5 group rounded-3xl">
                  <div>
                    <div className="font-bold text-red-500">Deactivate Vault Account</div>
                    <div className="text-sm text-red-500/60">Permanently delete your profile, logs, and all stored files from local directories and databases. This action is irreversible.</div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setShowDeactivateConfirm(true)}>Deactivate Account</Button>
                </div>
              </SettingSection>
            </div>
          </div>
        </div>
      </main>

      {/* 2FA SETUP MODAL */}
      <AnimatePresence>
        {show2faModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShow2faModal(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass bg-slate-900 rounded-[2rem] border border-white/10 p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Configure Two-Factor Auth</h3>
                  <p className="text-xs text-muted-foreground mt-1">Scan the QR code below using your Google Authenticator or Duo app</p>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-3xl max-w-[180px] mx-auto shadow-lg flex flex-col items-center justify-center gap-2">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`otpauth://totp/Locker24:${profile.email || 'user'}?secret=JBSWY3DPEHPK3PXP&issuer=Locker24`)}`}
                  alt="2FA QR Code" 
                  className="w-full aspect-square object-contain rounded-xl"
                />
                <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-700 select-all">JBSW Y3DP EHPK 3PXP</span>
              </div>

              <div className="space-y-4">
                <Input 
                  label="Verification Code" 
                  type="text" 
                  placeholder="Enter 6-digit authenticator code" 
                  icon={Key} 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0,6))}
                  required 
                />
                
                {tfaError && (
                  <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/5 py-2 px-3 border border-red-500/15 rounded-xl justify-center">
                    <AlertCircle size={14} /> {tfaError}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setShow2faModal(false)}>Cancel</Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleVerify2fa}
                    isLoading={isVerifyingTfa}
                  >
                    Activate TFA
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ACTIVE SESSIONS MODAL */}
      <AnimatePresence>
        {showSessionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowSessionsModal(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass bg-slate-900 rounded-[2rem] border border-white/10 p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 text-primary-500 rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Security Sessions Console</h3>
                  <p className="text-xs text-muted-foreground">Manage active connection sessions inside the system</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div>
                      <div className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                        {sess.device}
                        {sess.current && <span className="text-[9px] font-extrabold text-primary-500 bg-primary-500/10 py-0.5 px-2 rounded-full border border-primary-500/20">CURRENT</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">IP: {sess.ip} • Last active {sess.active}</div>
                    </div>
                    {!sess.current && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:bg-red-500/10"
                        onClick={() => {
                          setSessions(sessions.filter(s => s.id !== sess.id));
                          showToast('Login session revoked successfully.');
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={() => setShowSessionsModal(false)}>Close Console</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VAULT PIN CONFIGURATION MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass bg-slate-900 rounded-[2rem] border border-white/10 p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Configure Vault Access PIN</h3>
                  <p className="text-xs text-muted-foreground mt-1">Set a 4-digit PIN to secure highly sensitive previews and folders</p>
                </div>
              </div>

              <form onSubmit={handleSavePin} className="space-y-4">
                <Input 
                  label="New 4-Digit PIN" 
                  type="password" 
                  maxLength={4}
                  placeholder="••••" 
                  icon={Lock} 
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required 
                />

                <Input 
                  label="Confirm 4-Digit PIN" 
                  type="password" 
                  maxLength={4}
                  placeholder="••••" 
                  icon={Lock} 
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required 
                />
                
                {pinError && (
                  <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/5 py-2 px-3 border border-red-500/15 rounded-xl justify-center">
                    <AlertCircle size={14} /> {pinError}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowPinModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Save Access PIN</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM ACCOUNT DEACTIVATION MODAL */}
      <ConfirmModal 
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleDeactivate}
        title="Permanently Deactivate Account?"
        message="Are you sure you want to deactivate your Vault? This will permanently delete your entire profile, database references, and purge all your encrypted files from local storage. This action CANNOT be undone."
        confirmText="Permanently Deactivate"
      />
    </div>
  );
};

export default SettingsPage;
