// src/components/dashboard/ShareModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Link,
  Copy,
  Check,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import Button from '../common/Button';
import shareService from '../../services/shareService';

const EXPIRY_OPTIONS = [
  { label: '1 Hour',   hours: 1 },
  { label: '6 Hours',  hours: 6 },
  { label: '24 Hours', hours: 24 },
  { label: '3 Days',   hours: 72 },
  { label: '7 Days',   hours: 168 },
];

const ShareModal = ({ isOpen, onClose, document, token, API_URL, bypassPin }) => {
  const [selectedHours, setSelectedHours] = useState(24);
  const [shareResult, setShareResult]     = useState(null); // { share_url, expires_at }
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [copied, setCopied]               = useState(false);

  // Secure Vault PIN states
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (document) {
      const isSensitive = ['Finance', 'Identity', 'Health', 'Legal'].includes(document.category) || document.is_sensitive;
      setPinVerified(!isSensitive || !!bypassPin);
      setPinInput('');
      setPinError('');
    }
  }, [document, bypassPin, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Capture back button press / swipe-to-back gestures on mobile
      window.history.pushState({ modalOpen: true }, '');

      const handlePopState = () => {
        handleClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      };
    }
  }, [isOpen]);

  const handleVerifyPin = (e) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('vault_lock_pin') || '1234';
    if (pinInput === savedPin) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinInput('');
      setPinError('Incorrect Vault PIN. Please try again.');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setShareResult(null);
    try {
      const result = await shareService.createShareLink(
        API_URL, token, document.id, selectedHours
      );
      setShareResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareResult) return;
    
    const textToCopy = `${window.location.origin}/shared/${shareResult.share_token}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch((err) => {
          console.error("Clipboard copy failed, using fallback:", err);
          fallbackCopy(textToCopy);
        });
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Prevent screen zoom on focus
      textArea.style.fontSize = "12pt";
      
      // Position offscreen instead of hiding with opacity (Safari blocks hidden elements)
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      
      // Prevent standard mobile keyboard from showing up
      textArea.setAttribute("readonly", "");
      
      document.body.appendChild(textArea);
      
      // Handle iOS Safari range selection specifically
      const isiOS = navigator.userAgent.match(/ipad|iphone|ipod/i);
      if (isiOS) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.select();
      }
      
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      // Always trigger the premium "✓ Copied!" state on the button to give visual feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      
      // Auto-select the visible input text to ensure absolute copying on all devices
      const visibleInput = document.getElementById("share-url-input");
      if (visibleInput) {
        visibleInput.focus();
        visibleInput.select();
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
  };

  const handleClose = () => {
    setShareResult(null);
    setError(null);
    setCopied(false);
    setSelectedHours(24);
    setPinInput('');
    setPinError('');
    onClose();
  };

  if (!isOpen || !document) return null;

  if (!pinVerified) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md glass bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden p-8 space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/5">
                <Shield size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-200">Secure Sharing Verification</h3>
                <p className="text-sm text-slate-400 mt-2 px-4">
                  Sharing highly sensitive <strong>{['Finance', 'Identity', 'Health', 'Legal'].includes(document.category) ? document.category : 'personal'}</strong> documents requires authorization. Enter your 4-digit Vault PIN.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-6">
              <div className="space-y-2">
                <input 
                  type="password" 
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full text-center bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-3xl tracking-widest focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-white font-mono"
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/5 py-2 px-3 border border-red-500/15 rounded-xl justify-center">
                  <AlertCircle size={14} /> {pinError}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600">Verify PIN</Button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Share Document</h3>
                <p className="text-xs text-slate-500 truncate max-w-[220px]">{document.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Document info pill */}
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-white/5">
              <div className="w-9 h-9 bg-primary-600/10 text-primary-500 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{document.name}</p>
                <p className="text-xs text-slate-500">{document.size} · {document.category}</p>
              </div>
            </div>

            {/* Expiry picker */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                <Clock size={12} /> Link Expiry
              </label>
              <div className="grid grid-cols-5 gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    onClick={() => setSelectedHours(opt.hours)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedHours === opt.hours
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                        : 'bg-slate-800 border-white/5 text-slate-400 hover:border-purple-500/50 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Result — copy link */}
            {shareResult ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  ✓ Link Generated — expires {new Date(shareResult.expires_at).toLocaleString()}
                </p>
                <div className="flex items-center gap-2 p-3 bg-slate-800/80 border border-white/5 rounded-2xl">
                  <Link size={14} className="text-slate-500 shrink-0" />
                  <input
                    id="share-url-input"
                    type="text"
                    readOnly
                    value={`${window.location.origin}/shared/${shareResult.share_token}`}
                    onClick={(e) => {
                      e.target.select();
                      handleCopy();
                    }}
                    className="flex-1 text-xs text-slate-300 bg-transparent border-none outline-none cursor-pointer select-all truncate font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-sm"
                  onClick={handleGenerate}
                >
                  Generate New Link
                </Button>
              </div>
            ) : (
              <Button
                className="w-full rounded-2xl py-3 font-bold"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin mr-2 inline" /> Generating...</>
                  : <><Share2 size={16} className="mr-2 inline" /> Generate Share Link</>
                }
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;