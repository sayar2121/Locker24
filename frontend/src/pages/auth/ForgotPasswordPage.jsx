import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle, ExternalLink, QrCode, Clipboard, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null); // { message, reset_url }
  const [copied, setCopied] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState('');

  const triggerMailTo = (emailVal) => {
    const subject = encodeURIComponent("Locker 24 - Vault Recovery Request");
    const body = encodeURIComponent(`Hello Administrator,\n\nI am requesting a password recovery key for my secure vault account.\n\nMy Registered Email Address: ${emailVal}\n\nPlease review my vault ownership claim and issue a new secure entry key.\n\nThank you!`);
    window.location.href = `mailto:naiyooffice@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRequestedEmail(email);
    setIsLoading(true);
    setError('');

    try {
      // Trigger the local mail composer with prefilled parameters
      triggerMailTo(email);
      
      // Open the elegant glassmorphism confirmation modal dialog
      setShowAdminPopup(true);
    } catch (err) {
      setError(err.message || 'An error occurred while launching your mail client.');
    } finally {
      setIsLoading(false);
    }

    /* Commented out original recovery logic to satisfy user request:
    setIsLoading(true);
    setError('');
    setSuccessData(null);
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Email address not found');
      }

      const data = await response.json();
      setSuccessData(data);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
    */
  };

  const handleCopyLink = () => {
    if (successData?.reset_url) {
      navigator.clipboard.writeText(successData.reset_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100 via-background to-accent-100 dark:from-primary-950 dark:via-background dark:to-accent-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo and Brand */}
        <div className="text-center mb-10">
          <Link to="/login" className="inline-block hover:scale-105 active:scale-95 transition-all duration-200" title="Restore Website">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <img src={logo} alt="Locker 24 Logo" className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(14,165,233,0.3)]" />
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold mb-2 font-display">Recover Vault</h1>
          <p className="text-muted-foreground">Restore secure key access to your documents</p>
        </div>

        {/* Content Box */}
        <div className="glass p-8 rounded-[2rem] space-y-6">
          <AnimatePresence mode="wait">
            {!successData ? (
              <motion.form 
                key="request-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <p className="text-sm text-slate-400 text-center leading-relaxed">
                  Enter your registered vault email address. We will verify it and construct a secure one-time recovery key linkage.
                </p>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold text-center flex items-center gap-2 justify-center"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Input 
                  label="Vault Email Address"
                  type="email"
                  placeholder="name@example.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button 
                  type="submit" 
                  className="w-full py-4 text-lg" 
                  isLoading={isLoading}
                >
                  Send Recovery Password <Send size={18} className="ml-2" />
                </Button>
              </motion.form>
            ) : (
              <motion.div 
                key="success-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                  <CheckCircle size={32} />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Recovery Key Created</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    A secure 15-minute zero-knowledge password reset authorization link has been prepared.
                  </p>
                </div>

                {/* Sandbox Developer Panel */}
                <div className="bg-primary-950/40 border border-primary-500/20 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] font-extrabold text-primary-400 tracking-wider uppercase bg-primary-500/10 py-1 px-2 rounded-md border border-primary-500/20">
                    DEMO SIMULATOR CONSOLE
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Since you are running Locker 24 locally, copy the direct recovery link below to proceed instantly to key creation:
                  </p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={successData.reset_url}
                      className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-400 flex-1 overflow-x-auto select-all outline-none"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-center transition-all ${copied ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-white/10 hover:bg-white/5 text-slate-400'}`}
                      title="Copy URL"
                    >
                      <Clipboard size={14} />
                    </button>
                  </div>
                  
                  <a 
                    href={successData.reset_url} 
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-xs font-bold transition-all shadow-md shadow-primary-600/15"
                  >
                    Launch Recovery Console <ExternalLink size={12} />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Back Link */}
          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 font-bold hover:text-slate-200 transition-colors">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
      {/* Administrative Redirect Popup Modal */}
      <AnimatePresence>
        {showAdminPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminPopup(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-primary-500/10 text-primary-500 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/5">
                  <Mail size={32} />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Recovery Request Routed</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Your request has been successfully transmitted to the system administrator.
                </p>
              </div>

              <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 text-left space-y-4 mb-6">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Requested Account</span>
                  <span className="text-sm font-semibold text-slate-200 break-all">{requestedEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Routed To</span>
                  <span className="text-sm font-semibold text-primary-400 break-all">naiyooffice@gmail.com</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The administrator will review your vault ownership claim and issue a new secure entry key to your registered address.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => triggerMailTo(requestedEmail)}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 font-bold flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Open Mail Client Again
                </Button>
                <button 
                  onClick={() => setShowAdminPopup(false)}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors font-semibold"
                >
                  Close & Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPasswordPage;
