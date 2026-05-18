import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Cpu, Server } from 'lucide-react';
import logo from '../../assets/logo.png';

const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const ringColorMap = {
    primary: {
      outer: 'border-t-primary-500 border-primary-500/20',
      inner: 'border-b-sky-400 border-sky-400/20'
    },
    accent: {
      outer: 'border-t-accent-500 border-accent-500/20',
      inner: 'border-b-purple-500 border-purple-500/20'
    },
    white: {
      outer: 'border-t-white border-white/20',
      inner: 'border-b-slate-300 border-slate-300/20'
    }
  };

  const rings = ringColorMap[color] || ringColorMap.primary;

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* Outer spinning ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className={`absolute inset-0 rounded-full border-2 border-transparent ${rings.outer} shadow-[0_0_15px_rgba(14,165,233,0.15)]`}
      />
      {/* Inner reverse-spinning ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }}
        className={`absolute inset-1 rounded-full border border-transparent ${rings.inner}`}
      />
      {/* Center glowing dot */}
      <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
    </div>
  );
};

export const FullPageLoader = ({ label = 'Locker 24', sublabel = 'Initializing secure vault...' }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const securityStatuses = [
    'Establishing secure zero-knowledge envelope...',
    'Synchronizing device encryption keyrings...',
    'Decrypting local file system index...',
    'Isolating browser-level sandboxed enclave...',
    'Readying multi-layered AES-256 indices...',
    'Establishing encrypted API handshake...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % securityStatuses.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950 via-slate-950 to-background backdrop-blur-xl">
      {/* Outer ambient security light grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main glassmorphic container card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative p-12 max-w-md w-full mx-4 flex flex-col items-center text-center space-y-8 glass bg-slate-900/30 border border-white/5 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Glow behind the logo */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Top Vault Brand Logo */}
        <div className="relative">
          <motion.div 
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="w-20 h-20 mb-2 relative"
          >
            <img 
              src={logo} 
              alt="Locker 24" 
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]" 
            />
          </motion.div>
        </div>

        {/* Master Cyber Vault Dial Loader */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Dial ticks */}
          <svg className="absolute inset-0 w-full h-full text-slate-800 animate-spin [animation-duration:12s]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 6" />
          </svg>

          {/* Outer glowing orbital */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            className="absolute inset-4 rounded-full border-2 border-dashed border-primary-500/20 border-t-primary-500 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
          />

          {/* Inner counter-rotating orbital */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-6 rounded-full border border-sky-400/10 border-b-sky-400"
          />

          {/* Central locked shield core */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-10 bg-slate-950 border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(14,165,233,0.3)]"
          >
            <ShieldCheck size={36} className="text-primary-400 animate-pulse" />
          </motion.div>
        </div>

        {/* Text descriptions */}
        <div className="space-y-3 w-full">
          <h3 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {label}
          </h3>
          
          {/* Rotating sublabels */}
          <div className="h-6 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-primary-400 font-bold font-sans tracking-wide truncate"
              >
                {securityStatuses[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          
          <p className="text-xs text-slate-500 font-medium pt-1">
            {sublabel}
          </p>
        </div>

        {/* Security badge at bottom of preloader */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Client AES-256 Verified</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Spinner;
