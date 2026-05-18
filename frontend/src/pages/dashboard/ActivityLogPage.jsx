import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Upload, 
  Share2, 
  Trash2, 
  User, 
  Lock, 
  Eye, 
  Download,
  Filter,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import DocumentViewer from '../../components/dashboard/DocumentViewer';
import ShareModal from '../../components/dashboard/ShareModal';
import ConfirmModal from '../../components/common/ConfirmModal';

const getActionConfig = (action) => {
  switch (action.toUpperCase()) {
    case 'UPLOAD':
      return { icon: Upload, color: 'text-blue-500', bgColor: 'bg-blue-500/10', title: 'Document Uploaded' };
    case 'DELETE':
      return { icon: Trash2, color: 'text-red-500', bgColor: 'bg-red-500/10', title: 'Document Deleted' };
    case 'SHARE':
      return { icon: Share2, color: 'text-purple-500', bgColor: 'bg-purple-500/10', title: 'Document Shared' };
    case 'LOGIN':
      return { icon: User, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', title: 'Login Session' };
    case 'SECURITY':
      return { icon: Lock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', title: 'Security Action' };
    default:
      return { icon: Eye, color: 'text-slate-500', bgColor: 'bg-slate-500/10', title: 'Activity Recorded' };
  }
};

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
};

const ActivityLogPage = () => {
  const { token, API_URL, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reusable document states
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Confirm and Toast states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {}
  });
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const triggerConfirm = (title, message, confirmText, onConfirm) => {
    setConfirmConfig({ title, message, confirmText, onConfirm });
    setIsConfirmOpen(true);
  };

  const openViewer = (doc) => {
    setSelectedDoc(doc);
    setIsViewerOpen(true);
  };

  const openShare = (doc) => {
    setSelectedDoc(doc);
    setIsShareModalOpen(true);
  };

  const fetchDocs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/documents/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        let data = await response.json();
        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
        data = data.filter(doc => !trashed.includes(doc.id) && !archived.includes(doc.id));
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleDeleteDocument = (docId, shouldCloseViewer = false) => {
    triggerConfirm(
      "Move to Trash?",
      "Are you sure you want to move this document to Trash? You can recover or restore it later.",
      "Move to Trash",
      () => {
        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        if (!trashed.includes(docId)) {
          localStorage.setItem('trashed_documents', JSON.stringify([...trashed, docId]));
        }
        fetchDocs();
        if (shouldCloseViewer) setIsViewerOpen(false);
        showToast('Document moved to Trash.');
      }
    );
  };

  const handleLogClick = (log) => {
    if (!['UPLOAD', 'SHARE'].includes(log.action.toUpperCase())) {
      // Not a document action
      return;
    }

    let filename = null;
    if (log.action.toUpperCase() === 'UPLOAD') {
      const match = log.details.match(/Uploaded document:\s*(.+)$/i);
      filename = match ? match[1].trim() : null;
    } else if (log.action.toUpperCase() === 'SHARE') {
      const match = log.details.match(/Shared document:\s*(.+?)(?:\s*\(expires|$)/i);
      filename = match ? match[1].trim() : null;
    }

    if (!filename) {
      showToast('Could not resolve document filename from activity details.', 'error');
      return;
    }

    // Find in documents list
    const foundDoc = documents.find(
      (doc) => doc.name.toLowerCase() === filename.toLowerCase()
    );

    if (foundDoc) {
      openViewer(foundDoc);
    } else {
      showToast(`Document "${filename}" was not found (it may have been deleted).`, 'error');
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/activity/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchLogs();
      fetchDocs();
    }
  }, [token, API_URL]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-600/10 text-primary-500 rounded-xl flex items-center justify-center">
                  <History size={24} />
                </div>
                <h1 className="text-3xl font-bold font-display">Activity Log</h1>
              </div>
              <p className="text-muted-foreground">Track all actions and changes within your secure vault</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter size={18} className="mr-2" /> Filter
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search history..."
                className="w-full bg-transparent border-none py-2 pl-12 pr-4 focus:ring-0 text-sm outline-none"
              />
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-4">
            {isLoading ? (
              <Loader variant="dots" size="md" text="Fetching history..." center />
            ) : logs.length === 0 ? (
              <div className="py-20 text-center glass rounded-3xl border border-dashed border-slate-800">
                <History size={48} className="mx-auto mb-4 text-slate-700" />
                <h3 className="text-xl font-bold text-slate-400">No activity yet</h3>
                <p className="text-slate-500">Your actions will appear here once you start using the vault.</p>
              </div>
            ) : (
              logs.map((log, i) => {
                const config = getActionConfig(log.action);
                const isDocAction = ['UPLOAD', 'SHARE'].includes(log.action.toUpperCase());
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleLogClick(log)}
                    className={`glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl group hover:border-primary-500/50 transition-all ${
                      isDocAction ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${config.bgColor} ${config.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <config.icon size={24} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors truncate">
                            {config.title}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap bg-slate-800 px-2 py-0.5 rounded">
                            {formatTimeAgo(log.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">Action:</span>
                          <span className="text-slate-300 font-medium truncate">{log.details}</span>
                          <span className="text-slate-600 mx-1">•</span>
                          <span className="text-slate-400">By:</span>
                          <span className="text-slate-300 font-medium">{user?.name || 'You'}</span>
                        </div>
                      </div>
                      
                      {isDocAction && (
                        <button className="p-2 text-slate-600 group-hover:text-primary-400 transition-colors">
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 right-6 z-50 glass border py-3 px-6 rounded-2xl shadow-xl font-bold flex items-center gap-2 ${
              toast.type === 'error' 
                ? 'bg-red-950/80 border-red-500/30 text-red-400' 
                : 'bg-primary-950/80 border-primary-500/30 text-primary-400'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <DocumentViewer 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
        onShare={openShare}
        onDelete={(docId) => handleDeleteDocument(docId, true)}
        onUpdate={fetchDocs}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
};

export default ActivityLogPage;
