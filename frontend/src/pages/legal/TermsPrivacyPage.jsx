import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  ArrowLeft, 
  Lock, 
  EyeOff, 
  Trash2, 
  Scale, 
  Globe, 
  AlertCircle
} from 'lucide-react';
import logo from '../../assets/logo.png';

const TermsPrivacyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = location.pathname.includes('/privacy') ? 'privacy' : 'terms';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with pathname if path changes
  useEffect(() => {
    setActiveTab(location.pathname.includes('/privacy') ? 'privacy' : 'terms');
  }, [location.pathname]);

  const handleBack = () => {
    // If they have previous history, go back; otherwise go to login
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Locker 24 Logo" className="w-12 h-12 object-contain drop-shadow-[0_4px_10px_rgba(14,165,233,0.3)]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-primary-500 to-indigo-500 bg-clip-text text-transparent">Locker 24</h1>
              <p className="text-xs text-slate-500">End-to-End Encrypted Document Vault</p>
            </div>
          </div>

          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>

        {/* Dynamic Title */}
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-extrabold font-display bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {activeTab === 'terms' ? 'Terms of Service' : 'Privacy & Security Policy'}
          </h2>
          <p className="text-sm text-slate-400">
            Last Updated: May 17, 2026 • Version 1.0.0
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 shadow-inner">
          <button
            onClick={() => {
              setActiveTab('terms');
              navigate('/terms', { replace: true });
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'terms'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={16} /> Terms of Service
          </button>
          <button
            onClick={() => {
              setActiveTab('privacy');
              navigate('/privacy', { replace: true });
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'privacy'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={16} /> Privacy & Security
          </button>
        </div>

        {/* Glassmorphic Document Container */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-8 text-slate-300 leading-relaxed text-sm md:text-base"
        >
          {activeTab === 'terms' ? (
            /* Terms of Service Content */
            <div className="space-y-6">
              
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <Scale size={20} />
                  <h3>1. Acceptance of Terms</h3>
                </div>
                <p>
                  By creating an account or accessing the Locker 24 application, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the application. Locker 24 provides a zero-knowledge personal storage platform and encrypts your data locally before uploading to server nodes.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <Lock size={20} />
                  <h3>2. Zero-Knowledge Accountability</h3>
                </div>
                <p>
                  Locker 24 is built on a <strong>zero-knowledge architecture</strong>. This means your passwords, recovery keys, and Vault PINs are generated and processed on your client device using AES-256 local encryption.
                </p>
                <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex gap-3 text-sm text-amber-300/90">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>CRITICAL WARNING:</strong> Locker 24 does not store or have access to your passwords or master key in plaintext. If you lose your security password, recovery code, or Vault PIN, Locker 24 <strong>cannot recover them</strong>. You are solely responsible for backup storage of your encryption credentials.
                  </span>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <Globe size={20} />
                  <h3>3. Usage & Sharing Policy</h3>
                </div>
                <p>
                  Locker 24 provides robust link-sharing features. By sharing a document publicly or generating tokenized links, you agree that you are solely responsible for the links generated and the contents you share. You represent that you own the rights to all materials uploaded and shared.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <Trash2 size={20} />
                  <h3>4. Termination & Deactivation</h3>
                </div>
                <p>
                  You are the absolute owner of your vault. You may deactivate your account and delete your files permanently at any time. Upon account deletion, all database records, shared link tokens, and uploaded physical files are immediately and permanently wiped from our disks in accordance with our strict secure erasure standards.
                </p>
              </section>

            </div>
          ) : (
            /* Privacy & Security Policy Content */
            <div className="space-y-6">
              
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <EyeOff size={20} />
                  <h3>1. Zero-Telemetry & Zero-Reading</h3>
                </div>
                <p>
                  We believe privacy is an absolute human right. Locker 24 has <strong>zero access</strong> to your files, file contents, filenames, or previews. Your files are automatically encrypted locally on your device with your private key before they cross the network boundary.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <ShieldCheck size={20} />
                  <h3>2. Advanced Security Mechanisms</h3>
                </div>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>End-to-End Encryption (E2EE)</strong>: All files are encrypted using military-grade AES-256 encryption.
                  </li>
                  <li>
                    <strong>Vault Locks</strong>: Highly sensitive folders (Finance, Identity, Health, and Legal) are kept under an active double-layer lock, which is verified dynamically in the browser against your local security settings.
                  </li>
                  <li>
                    <strong>Isolated Sessions</strong>: Access tokens (JWT) expire automatically to protect you from unauthorized devices.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <Lock size={20} />
                  <h3>3. Data Collected</h3>
                </div>
                <p>
                  Locker 24 collects only the bare minimum operational details required to manage your account: your username, email, hashed security password, and dynamic activity logs (e.g., login times, uploads) that are accessible only to you. We do not track, profile, monetize, or sell your vault activities.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400 font-bold text-lg">
                  <Trash2 size={20} />
                  <h3>4. Complete Erasure & Portability</h3>
                </div>
                <p>
                  When you delete a document or deactivate your vault account, Locker 24 performs a full and complete database deletion. Physical disk files are removed using absolute wipe protocols, meaning no deleted files or links can ever be recovered, restored, or accessed again.
                </p>
              </section>

            </div>
          )}
        </motion.div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-4">
          <p>
            By using Locker 24, you confirm that you accept the security and privacy mechanisms outlined in these policies.
          </p>
          <div className="flex justify-center gap-4 text-primary-500 font-bold">
            <Link to="/login" className="hover:underline">Login Page</Link>
            <span>•</span>
            <Link to="/register" className="hover:underline">Register Page</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TermsPrivacyPage;
