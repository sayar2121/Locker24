import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-12"
        >
          <h1 className="text-[12rem] font-black text-slate-200 dark:text-slate-800 leading-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-full shadow-2xl">
              <Search size={80} className="text-primary-600 animate-bounce-subtle" />
            </div>
          </div>
        </motion.div>
        
        <h2 className="text-4xl font-bold mb-4">Lost in the Vault?</h2>
        <p className="text-lg text-muted-foreground mb-10">
          The document or page you are looking for doesn't exist or has been moved to another secure location.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft size={20} className="mr-2" /> Go Back
          </Button>
          <Link to="/dashboard">
            <Button>
              <Home size={20} className="mr-2" /> Return Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
