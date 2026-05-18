import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Lock
} from 'lucide-react';
import shareService from '../../services/shareService';
import Button from '../../components/common/Button';

// Mock/Config
const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

const SharedDocumentPage = () => {
  const { token } = useParams();
  const [docInfo, setDocInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await shareService.getShareInfo(API_URL, token);
        setDocInfo(info);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token]);

  const handleDownload = () => {
    const viewUrl = shareService.getViewUrl(API_URL, token);
    window.open(viewUrl, '_blank');
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-purple-500/30 selection:text-purple-200 flex flex-col items-center justify-center p-6 font-['Inter',_sans-serif]">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl relative"
      >
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-900/20 mb-4 rotate-3">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Locker 24
          </h1>
          <p className="text-slate-500 text-sm font-medium">Secure File Transfer</p>
        </div>

        {/* Content Card */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle noise pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">Decrypting access link...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-400 mb-8">{error}</p>
              <Link to="/">
                <Button variant="outline" className="rounded-2xl px-8">
                  Back to Locker
                </Button>
              </Link>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-xl mb-6 group transition-all hover:scale-105">
                  <FileText className="text-purple-400 group-hover:text-purple-300 transition-colors" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 break-all line-clamp-2 px-4">
                  {docInfo.name}
                </h2>
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5 font-semibold uppercase tracking-wider text-[10px]">
                    {docInfo.category || 'General'}
                  </span>
                  <span>•</span>
                  <span className="font-medium">{formatSize(docInfo.size)}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expires</p>
                    <p className="text-xs font-semibold text-slate-200">
                      {new Date(docInfo.expires_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security</p>
                    <p className="text-xs font-semibold text-slate-200">End-to-End Encryption</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={handleDownload}
                className="w-full py-4 rounded-3xl text-lg font-bold flex items-center justify-center gap-3 group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-xl shadow-purple-900/40 transition-all hover:-translate-y-1 active:translate-y-0"
              >
                <Download size={22} className="group-hover:translate-y-0.5 transition-transform" />
                Download Document
              </Button>
              
              <p className="text-center text-[11px] text-slate-500 mt-6 font-medium">
                Protected by Locker 24 Advanced Security Protocol
              </p>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium group">
            Create your own vault 
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SharedDocumentPage;
