import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Share2, 
  Trash2, 
  ExternalLink,
  Shield,
  Eye,
  Loader2,
  Calendar,
  Layers,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import UploadModal from '../../components/dashboard/UploadModal';
import DocumentViewer from '../../components/dashboard/DocumentViewer';
import ShareModal from '../../components/dashboard/ShareModal';
import ConfirmModal from '../../components/common/ConfirmModal';

const AllDocumentsPage = () => {
  const { token, API_URL } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {}
  });

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

  const handleDownloadDirect = async (doc) => {
    const isSensitive = ['Finance', 'Identity', 'Health', 'Legal'].includes(doc.category);
    if (isSensitive) {
      openViewer(doc);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/documents/${doc.id}/download?token=${token}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
        fetchDocuments();
        if (shouldCloseViewer) setIsViewerOpen(false);
      }
    );
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  const getStatusStyles = (isSensitive) => {
    if (isSensitive) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold">All Documents</h1>
              <p className="text-muted-foreground mt-1">Total of {documents.length} secure documents stored</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search vault..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 w-72 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Plus size={18} className="mr-2" /> Upload File
              </Button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-32 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Accessing Secured Vault</h3>
                <p className="text-muted-foreground text-sm">Decrypting metadata records...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                <FileText size={64} className="text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  {searchQuery ? "No metadata records matched your search terms." : "Start populating your vault by uploading your first document."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsUploadModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Upload Document
                  </Button>
                )}
              </div>
            ) : (
              filteredDocuments.map((doc, i) => (
                <motion.div 
                  key={doc.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="glass bg-white dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-primary-500/30 p-6 rounded-[2.5rem] transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FileText size={26} />
                    </div>
                    
                    {/* Tag badge */}
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize bg-primary-500/5 text-primary-500 border border-primary-500/10">
                      {doc.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-foreground mb-1 truncate leading-snug group-hover:text-primary-500 transition-colors duration-300">
                    {doc.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Calendar size={12} /> {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Layers size={12} /> {doc.size}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openViewer(doc)}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-primary-500/10 hover:text-primary-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400"
                        title="Quick View"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownloadDirect(doc)}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400"
                        title="Secure Download"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => openShare(doc)}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-purple-500/10 hover:text-purple-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400"
                        title="Secure Share Link"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400"
                        title="Move to Trash"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchDocuments}
        token={token}
        API_URL={API_URL}
      />

      <DocumentViewer 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
        onShare={openShare}
        onDelete={(docId) => handleDeleteDocument(docId, true)}
        onUpdate={fetchDocuments}
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

export default AllDocumentsPage;
