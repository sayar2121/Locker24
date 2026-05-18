import React, { useState, useEffect, useRef } from 'react';
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
  Archive,
  ExternalLink, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  FileVideo
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Button from '../common/Button';
import Loader from '../common/Loader';

// Use dynamic unpkg CDN to guarantee worker and API version match exactly
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DocumentViewer = ({ isOpen, onClose, document, token, API_URL, onShare, onDelete, onUpdate, bypassPin }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const pdfContainerRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Measure container width for responsive PDF rendering
  useEffect(() => {
    const measure = () => {
      if (pdfContainerRef.current) {
        setPdfContainerWidth(pdfContainerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [isStarred, setIsStarred] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Micro-toast notifications
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // Secure Vault PIN states
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Capture back button press / swipe-to-back gestures on mobile
      window.history.pushState({ modalOpen: true }, '');

      const handlePopState = () => {
        onClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (document) {
      const isSensitive = ['Finance', 'Identity', 'Health', 'Legal'].includes(document.category) || document.is_sensitive;
      setPinVerified(!isSensitive || !!bypassPin);
      setPinInput('');
      setPinError('');
    }
  }, [document, bypassPin, isOpen]);

  useEffect(() => {
    if (!isOpen || !document || !pinVerified) return;

    setLoading(true);
    setError(false);
    setNumPages(null);
    setPageNumber(1);
    setPdfBlobUrl(null);

    // Revoke previous blob URL to free memory
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    const secureUrl = `${API_URL}/api/documents/${document.id}/preview?token=${token}`;
    setPreviewUrl(secureUrl);

    // Initialise System Folder states
    const starred = JSON.parse(localStorage.getItem('starred_documents') || '[]');
    const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
    setIsStarred(starred.includes(document.id));
    setIsArchived(archived.includes(document.id));

    // For PDFs: fetch as blob so react-pdf gets data directly (no CORS/auth issues in worker)
    const isPdfFile = document.name.match(/\.pdf$/i);
    if (isPdfFile) {
      fetch(secureUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          console.log('[PDF] Fetch OK, content-type:', res.headers.get('content-type'));
          return res.arrayBuffer();
        })
        .then(buffer => {
          // Force application/pdf MIME type — some servers return octet-stream
          const blob = new Blob([buffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          console.log('[PDF] Blob URL created:', url, 'size:', blob.size);
          blobUrlRef.current = url;
          setPdfBlobUrl(url);
        })
        .catch(err => {
          console.error('[PDF] Fetch failed:', err);
          setError(true);
          setLoading(false);
        });
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [isOpen, document?.id, pinVerified]);

  const toggleStar = () => {
    const starred = JSON.parse(localStorage.getItem('starred_documents') || '[]');
    let updated;
    if (starred.includes(document.id)) {
      updated = starred.filter(id => id !== document.id);
      setIsStarred(false);
      showToast("Removed from Starred");
    } else {
      updated = [...starred, document.id];
      setIsStarred(true);
      showToast("Added to Starred");
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
      showToast("Restored from Archive");
    } else {
      updated = [...archived, document.id];
      setIsArchived(true);
      showToast("Document Archived");
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
                  This document contains highly sensitive <strong>{['Finance', 'Identity', 'Health', 'Legal'].includes(document.category) ? document.category : 'personal'}</strong> information. Please enter your 4-digit Vault PIN to view.
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
  const isVideo = document.name.match(/\.(mp4|webm|ogg|mov|mkv|avi)$/i);

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
          {/* Beautiful Floating Success Toast Banner nested inside the modal card */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-950/95 border border-white/10 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
              >
                <CheckCircle2 size={12} className="text-emerald-400 sm:w-[14px] sm:h-[14px]" />
                <span>{toastMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Header */}
          <div className="p-5 sm:p-6 bg-slate-900 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600/10 text-primary-500 rounded-2xl flex items-center justify-center shrink-0">
                <FileText size={20} className="sm:w-[24px] sm:h-[24px]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-white truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-md" title={document.name}>
                  {document.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">
                  Uploaded on {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end w-full sm:w-auto">
              {/*
              <button
                onClick={toggleStar}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all border shrink-0 ${
                  isStarred 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-500'
                }`}
                title={isStarred ? "Remove from Starred" : "Add to Starred"}
              >
                <Star size={16} className="sm:w-[18px] sm:h-[18px]" fill={isStarred ? "currentColor" : "none"} />
              </button>
              
              <button
                onClick={toggleArchive}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all border shrink-0 ${
                  isArchived 
                    ? 'bg-slate-500/20 border-slate-500/30 text-slate-300' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
                }`}
                title={isArchived ? "Unarchive Document" : "Archive Document"}
              >
                <Archive size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              
              <div className="h-6 w-px bg-white/10 mx-0.5 hidden sm:block"></div>
              */}

              {/*
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onShare(document)} 
                className="rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-9 sm:h-10 px-2.5 sm:px-4"
              >
                <Share2 size={16} className="sm:w-[18px] sm:h-[18px] sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              */}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  const success = await onDelete(document.id);
                  if (success) onClose();
                }} 
                className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 h-9 sm:h-10 px-2.5 sm:px-4"
              >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload} 
                className="rounded-xl h-9 sm:h-10 px-2.5 sm:px-4 text-slate-300 border-white/10 hover:bg-white/5"
              >
                <Download size={16} className="sm:w-[18px] sm:h-[18px] sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              
              <button 
                onClick={onClose}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors shrink-0 ml-auto sm:ml-0"
              >
                <X size={18} className="sm:w-[20px] sm:h-[20px]" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative bg-slate-950/50 overflow-hidden flex items-center justify-center">

            {/* PDF renderer — uses blob URL so auth/CORS is pre-handled */}
            {isPDF ? (
              <div ref={pdfContainerRef} className="w-full h-full flex flex-col items-center overflow-y-auto p-2 sm:p-6">
                {/* Overlay loader while blob is fetching or PDF is parsing */}
                {(loading || !pdfBlobUrl) && !error && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80">
                    <Loader variant="vault" size="lg" text="Loading PDF..." center />
                  </div>
                )}

                {error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-5 px-4">
                    <AlertCircle size={44} className="text-red-500" />
                    <div>
                      <h4 className="text-lg font-bold text-white">PDF Render Failed</h4>
                      <p className="text-slate-500 text-sm mt-1">The PDF renderer encountered an error.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold transition-all"
                      >
                        <ExternalLink size={16} /> Open in Browser
                      </a>
                      <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-all"
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  </div>
                ) : pdfBlobUrl ? (
                  <Document
                    file={pdfBlobUrl}
                    onLoadSuccess={({ numPages }) => {
                      setNumPages(numPages);
                      setPageNumber(1);
                      setLoading(false);
                    }}
                    onLoadError={(err) => {
                      console.error('react-pdf error:', err);
                      setError(true);
                      setLoading(false);
                    }}
                    loading={null}
                    className="flex flex-col items-center gap-4 py-2 w-full"
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={pdfContainerWidth
                        ? Math.min(pdfContainerWidth - 24, 900)
                        : Math.min(window.innerWidth - 48, 900)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="shadow-2xl rounded-xl overflow-hidden"
                    />
                   </Document>
                ) : null}

                {/* Page navigation */}
                {numPages && numPages > 1 && (
                  <div className="sticky bottom-4 flex items-center gap-3 bg-slate-900/95 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-2xl mt-3 mb-4">
                    <button
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs font-bold text-slate-300 min-w-[80px] text-center">
                      Page {pageNumber} of {numPages}
                    </span>
                    <button
                      onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                      disabled={pageNumber >= numPages}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

            ) : (
              /* Image & other file types */
              <>
                {loading && (
                  <Loader variant="vault" size="lg" text="Securing connection..." center />
                )}
                <div className={`w-full h-full flex items-center justify-center overflow-auto rounded-xl p-4 sm:p-10 ${loading ? 'hidden' : ''}`}>
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
                      onError={() => { setError(true); setLoading(false); }}
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                    />
                  ) : isVideo ? (
                    <video
                      src={previewUrl}
                      controls
                      controlsList="nodownload"
                      onLoadedData={() => setLoading(false)}
                      onError={(e) => { 
                        console.error('Video error:', e);
                        setError(true); 
                        setLoading(false); 
                      }}
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-3xl border border-white/10 outline-none"
                      autoPlay
                      muted
                    />
                  ) : (
                    <div className="text-center p-12 glass rounded-3xl">
                      <FileText size={64} className="text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-300 font-bold mb-4">No preview available for this file type</p>
                      <Button onClick={handleDownload}>Download to View</Button>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

          {/* Footer Info */}
          <div className="px-4 sm:px-8 py-3.5 bg-slate-900/50 border-t border-white/5 flex flex-wrap items-center justify-center sm:justify-between gap-y-2 gap-x-4 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">
            <span className="whitespace-nowrap">Size: {document.size}</span>
            <span className="whitespace-nowrap">Category: {document.category}</span>
            <span className="text-emerald-500 flex items-center gap-1 whitespace-nowrap">
              <Shield size={12} /> Encrypted Session
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentViewer;