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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const filterOptions = [
    { value: 'ALL', label: 'All Activities' },
    { value: 'UPLOAD', label: 'Uploads Only' },
    { value: 'SHARE', label: 'Shares Only' },
    { value: 'DELETE', label: 'Deletes Only' },
    { value: 'LOGIN', label: 'Login Sessions' },
    { value: 'SECURITY', label: 'Security' }
  ];

  const filteredLogs = logs.filter(log => {
    const config = getActionConfig(log.action);
    const matchesSearch = (
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesFilter = selectedFilter === 'ALL' || log.action?.toUpperCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-600/10 text-primary-500 flex items-center justify-center">
                <History size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display">Activity Log</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Track all actions and changes within your secure vault</p>
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto relative">
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="relative w-full xs:w-auto">
                <Button 
                  variant={selectedFilter !== 'ALL' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="w-full xs:w-auto h-12"
                >
                  <Filter size={18} className="mr-2" /> 
                  {selectedFilter === 'ALL' ? 'Filter' : filterOptions.find(o => o.value === selectedFilter)?.label}
                </Button>

                <AnimatePresence>
                  {isFilterDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setIsFilterDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 top-full w-52 rounded-2xl z-40 bg-slate-950/95 border border-white/10 shadow-2xl p-2 backdrop-blur-md"
                      >
                        {filterOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSelectedFilter(opt.value);
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-between uppercase tracking-wider ${
                              selectedFilter === opt.value
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {selectedFilter === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-4">
            {isLoading ? (
              <Loader variant="dots" size="md" text="Fetching history..." center />
            ) : filteredLogs.length === 0 ? (
              <div className="py-20 text-center glass rounded-3xl border border-dashed border-slate-800">
                <History size={48} className="mx-auto mb-4 text-slate-700" />
                <h3 className="text-xl font-bold text-slate-400">
                  {searchQuery ? "No results found" : "No activity yet"}
                </h3>
                <p className="text-slate-500">
                  {searchQuery ? "Try searching with a different keyword." : "Your actions will appear here once you start using the vault."}
                </p>
              </div>
            ) : (
              filteredLogs.map((log, i) => {
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
