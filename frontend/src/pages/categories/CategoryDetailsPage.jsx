import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Lock, 
  Shield,
  GraduationCap,
  Wallet,
  Activity,
  Car,
  Gavel,
  Briefcase,
  User,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  Archive,
  Share2,
  Star,
  Trash2
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import UploadModal from '../../components/dashboard/UploadModal';
import DocumentViewer from '../../components/dashboard/DocumentViewer';
import ShareModal from '../../components/dashboard/ShareModal';
import ConfirmModal from '../../components/common/ConfirmModal';

const categoryConfig = {
  identity: { name: 'Identity', icon: Shield, theme: 'blue' },
  education: { name: 'Education', icon: GraduationCap, theme: 'indigo' },
  finance: { name: 'Finance', icon: Wallet, theme: 'emerald' },
  health: { name: 'Health', icon: Activity, theme: 'red' },
  vehicle: { name: 'Vehicle', icon: Car, theme: 'orange' },
  legal: { name: 'Legal', icon: Gavel, theme: 'slate' },
  employment: { name: 'Employment', icon: Briefcase, theme: 'cyan' },
  personal: { name: 'Personal', icon: User, theme: 'pink' },
  other: { name: 'Other', icon: Archive, theme: 'slate' },
  shared: { name: 'Shared', icon: Share2, theme: 'purple' },
  favorites: { name: 'Favorites', icon: Star, theme: 'amber' },
  archived: { name: 'Archived', icon: Archive, theme: 'slate' },
  trash: { name: 'Trash', icon: Trash2, theme: 'red' }
};

const CategoryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, API_URL } = useAuth();
  
  const config = categoryConfig[id] || categoryConfig.personal;
  
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(['Finance', 'Identity', 'Health', 'Legal'].includes(config.name));
  const [pin, setPin] = useState('');
  
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

  const fetchCategoryDocuments = async () => {
    setIsLoading(true);
    try {
      const isSystemOrOther = ['other', 'shared', 'favorites', 'archived', 'trash'].includes(id);
      
      const url = isSystemOrOther
        ? `${API_URL}/api/documents/`
        : `${API_URL}/api/documents/?category=${config.name}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        let data = await response.json();
        
        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
        const starred = JSON.parse(localStorage.getItem('starred_documents') || '[]');
        
        if (id === 'other') {
          const standardCategories = ['Identity', 'Education', 'Finance', 'Health', 'Vehicle', 'Legal', 'Employment', 'Personal'];
          data = data.filter(doc => 
            !standardCategories.includes(doc.category) && 
            !trashed.includes(doc.id) && 
            !archived.includes(doc.id)
          );
        } else if (id === 'shared') {
          const shareRes = await fetch(`${API_URL}/api/share/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (shareRes.ok) {
            const shares = await shareRes.json();
            const sharedDocIds = shares.map(s => s.document_id);
            data = data.filter(doc => sharedDocIds.includes(doc.id) && !trashed.includes(doc.id));
          } else {
            data = [];
          }
        } else if (id === 'favorites') {
          data = data.filter(doc => starred.includes(doc.id) && !trashed.includes(doc.id));
        } else if (id === 'archived') {
          data = data.filter(doc => archived.includes(doc.id) && !trashed.includes(doc.id));
        } else if (id === 'trash') {
          data = data.filter(doc => trashed.includes(doc.id));
        } else {
          // Standard categories
          data = data.filter(doc => !trashed.includes(doc.id) && !archived.includes(doc.id));
        }
        
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && !isLocked) {
      fetchCategoryDocuments();
    }
  }, [token, id, isLocked]);

  const handleUnlock = () => {
    const savedPin = localStorage.getItem('vault_lock_pin') || '1234';
    if (pin === savedPin) {
      setIsLocked(false);
    } else {
      setPin('');
      alert("Incorrect PIN");
    }
  };

  const handleDeleteDocument = (docId, shouldCloseViewer = false) => {
    if (id === 'trash') {
      triggerConfirm(
        "Permanently Delete?",
        "Are you sure you want to permanently delete this document? This action cannot be undone.",
        "Permanently Delete",
        async () => {
          try {
            const response = await fetch(`${API_URL}/api/documents/${docId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              fetchCategoryDocuments(); // Refresh the list
              if (shouldCloseViewer) setIsViewerOpen(false);
            } else {
              alert('Failed to delete document');
            }
          } catch (error) {
            console.error('Delete failed:', error);
            alert('Error connecting to server');
          }
        }
      );
    } else {
      triggerConfirm(
        "Move to Trash?",
        "Are you sure you want to move this document to Trash? You can recover or restore it later.",
        "Move to Trash",
        () => {
          const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
          if (!trashed.includes(docId)) {
            localStorage.setItem('trashed_documents', JSON.stringify([...trashed, docId]));
          }
          fetchCategoryDocuments();
          if (shouldCloseViewer) setIsViewerOpen(false);
        }
      );
    }
  };

  const handleRestoreDocument = (e, docId) => {
    e.stopPropagation();
    const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
    const updated = trashed.filter(id => id !== docId);
    localStorage.setItem('trashed_documents', JSON.stringify(updated));
    fetchCategoryDocuments();
  };

  if (isLocked) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] max-w-md w-full"
          >
            <div className="w-20 h-20 bg-amber-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/40">
              <Lock size={36} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Locked Category</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This category contains highly sensitive financial information. Enter your PIN to view.
            </p>
            <div className="space-y-4">
              <input 
                type="password" 
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-2xl tracking-widest focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
              <Button onClick={handleUnlock} className="w-full bg-amber-500 hover:bg-amber-600 py-3">Unlock Vault</Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const themeClasses = {
    blue: 'bg-blue-600/10 text-blue-500 shadow-blue-500/10',
    indigo: 'bg-indigo-600/10 text-indigo-500 shadow-indigo-500/10',
    emerald: 'bg-emerald-600/10 text-emerald-500 shadow-emerald-500/10',
    red: 'bg-red-600/10 text-red-500 shadow-red-500/10',
    orange: 'bg-orange-600/10 text-orange-500 shadow-orange-500/10',
    slate: 'bg-slate-600/10 text-slate-500 shadow-slate-500/10',
    cyan: 'bg-cyan-600/10 text-cyan-500 shadow-cyan-500/10',
    pink: 'bg-pink-600/10 text-pink-500 shadow-pink-500/10',
    purple: 'bg-purple-600/10 text-purple-500 shadow-purple-500/10',
    amber: 'bg-amber-600/10 text-amber-500 shadow-amber-500/10'
  };

  const themeClass = themeClasses[config.theme] || themeClasses.slate;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/categories')}
                className="w-10 h-10 p-0 rounded-full flex items-center justify-center"
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${themeClass.split(' ')[0]} ${themeClass.split(' ')[1]}`}>
                  <config.icon size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold font-display">{config.name} Documents</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">Secure personal vault storage</p>
                </div>
              </div>
            </div>
            
            {/* Don't show Upload button in System Folders (Shared, Favorites, Archived, Trash) */}
            {!['shared', 'favorites', 'archived', 'trash'].includes(id) && (
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Plus size={18} className="mr-2" /> Add Document
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder={`Search in ${config.name}...`}
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary-600/20 outline-none"
              />
            </div>
          </div>

          {/* Documents Content */}
          <div className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border">
                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Name</th>
                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Size</th>
                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">Fetching documents...</p>
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                          <FileText size={40} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No documents yet</h3>
                        <p className="text-muted-foreground mb-8">
                          {id === 'trash' ? 'Your trash folder is empty.' : 'Start by uploading your first document.'}
                        </p>
                        {!['shared', 'favorites', 'archived', 'trash'].includes(id) && (
                          <Button onClick={() => setIsUploadModalOpen(true)}>
                            <Plus size={18} className="mr-2" /> Upload Document
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc, i) => (
                      <motion.tr 
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => openViewer(doc)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <FileText size={24} />
                            </div>
                            <div>
                              <div className="font-bold group-hover:text-primary-600 transition-colors">{doc.name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-medium text-slate-500">{doc.size}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {id === 'trash' ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => handleRestoreDocument(e, doc.id)}
                                  className="font-bold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl px-3"
                                >
                                  Restore
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="w-10 h-10 p-0 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openViewer(doc)}
                                  className="font-bold text-primary-500 hover:text-primary-400 rounded-xl px-3"
                                >
                                  View
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openShare(doc)}
                                  className="w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                                >
                                  <Share2 size={18} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchCategoryDocuments}
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
        onUpdate={fetchCategoryDocuments}
        bypassPin={true}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
        bypassPin={true}
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

export default CategoryDetailsPage;
