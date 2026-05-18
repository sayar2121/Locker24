import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText,
  AlertCircle,
  Shield,
  Share2,
  Trash2,
  Star,
  Archive
} from 'lucide-react';
import Button from '../common/Button';
import Loader from '../common/Loader';

const DocumentViewer = ({ isOpen, onClose, document, token, API_URL, onShare, onDelete, onUpdate, bypassPin }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [isStarred, setIsStarred] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Secure Vault PIN states
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (document) {
      const isSensitive = ['Finance', 'Identity', 'Health', 'Legal'].includes(document.category);
      setPinVerified(!isSensitive || !!bypassPin);
      setPinInput('');
      setPinError('');
    }
  }, [document, bypassPin, isOpen]);

  useEffect(() => {
    if (!isOpen || !document || !pinVerified) return;

    setLoading(true);
    setError(false);

    // Set secure preview URL with token as fallback query param
    const secureUrl = `${API_URL}/api/documents/${document.id}/preview?token=${token}`;
    setPreviewUrl(secureUrl);

    // Initialise System Folder states
    const starred = JSON.parse(localStorage.getItem('starred_documents') || '[]');
    const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
    setIsStarred(starred.includes(document.id));
    setIsArchived(archived.includes(document.id));
  }, [isOpen, document?.id, pinVerified]);

  const toggleStar = () => {
    const starred = JSON.parse(localStorage.getItem('starred_documents') || '[]');
    let updated;
    if (starred.includes(document.id)) {
      updated = starred.filter(id => id !== document.id);
      setIsStarred(false);
    } else {
      updated = [...starred, document.id];
      setIsStarred(true);
    }
    localStorage.setItem('starred_documents', JSON.stringify(updated));
    if (onUpdate) onUpdate();
  };

  const toggleArchive = () => {
    const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
    let updated;
    if (archived.includes(document.id)) {
      updated = archived.filter(id => id !== document.id);
      setIsArchived(false);
    } else {
      updated = [...archived, document.id];
      setIsArchived(true);
    }
    localStorage.setItem('archived_documents', JSON.stringify(updated));
    if (onUpdate) onUpdate();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_URL}/api/documents/${document.id}/download?token=${token}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

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

  if (!isOpen || !document) return null;

  if (!pinVerified) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md glass bg-slate-900 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/5">
                <Shield size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-200">Secure Verification</h3>
                <p className="text-sm text-slate-400 mt-2 px-4">
                  This document contains highly sensitive <strong>{document.category}</strong> information. Please enter your 4-digit Vault PIN to view.
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
                <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600">Verify PIN</Button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const isImage = document.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = document.name.match(/\.(pdf)$/i);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-5xl h-[85vh] bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600/10 text-primary-500 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white truncate max-w-md">{document.name}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Uploaded on {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStar}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${
                  isStarred 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-500'
                }`}
                title={isStarred ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Star size={18} fill={isStarred ? "currentColor" : "none"} />
              </button>
              
              <button
                onClick={toggleArchive}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${
                  isArchived 
                    ? 'bg-slate-500/20 border-slate-500/30 text-slate-300' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
                }`}
                title={isArchived ? "Unarchive Document" : "Archive Document"}
              >
                <Archive size={18} />
              </button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onShare(document)} 
                className="rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-10"
              >
                <Share2 size={18} className="mr-2" /> Share
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  const success = await onDelete(document.id);
                  if (success) onClose();
                }} 
                className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 h-10"
              >
                <Trash2 size={18} className="mr-2" /> Delete
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-xl h-10">
                <Download size={18} className="mr-2" /> Download
              </Button>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative bg-slate-950/50 overflow-hidden flex items-center justify-center p-4 sm:p-10">
            {loading && (
              <Loader variant="vault" size="lg" text="Securing connection..." center />
            )}
            
            <div className={`w-full h-full flex items-center justify-center overflow-auto rounded-xl ${loading ? 'hidden' : ''}`}>
              {error ? (
                <div className="text-center">
                  <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Failed to load preview</h4>
                  <p className="text-slate-500 mb-6">This file type might not support in-app preview.</p>
                  <Button onClick={handleDownload}>Download Instead</Button>
                </div>
              ) : isImage ? (
                <img 
                  src={previewUrl} 
                  alt={document.name} 
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setError(true);
                    setLoading(false);
                  }}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                />
              ) : isPDF ? (
                <iframe
                  src={previewUrl}
                  title={document.name}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setError(true);
                    setLoading(false);
                  }}
                  className="w-full h-full rounded-lg border-0"
                />
              ) : (
                <div className="text-center p-12 glass rounded-3xl">
                  <FileText size={64} className="text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-300 font-bold mb-4">No preview available for this file type</p>
                  <Button onClick={handleDownload}>Download to View</Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-8 py-4 bg-slate-900/50 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>Size: {document.size}</span>
            <span>Category: {document.category}</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <Shield size={12} /> Encrypted Session
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentViewer;