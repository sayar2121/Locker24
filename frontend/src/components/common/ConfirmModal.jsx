import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import Button from './Button';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Delete", 
  cancelText = "Cancel",
  variant = "danger" // danger, warning, primary
}) => {
  if (!isOpen) return null;

  const iconColors = {
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    primary: 'bg-primary-500/10 text-primary-500 border-primary-500/20'
  };

  const confirmColors = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    primary: 'bg-primary-500 hover:bg-primary-600 text-white'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal body */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md glass bg-slate-900/90 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mb-6 ${iconColors[variant]}`}>
            {variant === 'danger' ? <Trash2 size={28} /> : <AlertTriangle size={28} />}
          </div>

          {/* Typography */}
          <h3 className="text-2xl font-bold text-white mb-3 font-display">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">{message}</p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border-white/10 hover:bg-white/5 text-slate-300 h-12 text-sm font-bold"
            >
              {cancelText}
            </Button>
            <Button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3.5 rounded-2xl h-12 text-sm font-bold shadow-xl ${confirmColors[variant]}`}
            >
              {confirmText}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
