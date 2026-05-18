import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowLeft, Key, CheckCircle, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

const ResetPasswordPage = () => {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: formData.new_password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login?reset=success';
      }, 2500);
    } catch (err) {
      setError(err.message || 'An error occurred. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100 via-background to-accent-100 dark:from-primary-950 dark:via-background dark:to-accent-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo and Brand */}
        <div className="text-center mb-10">
          <Link to="/login" className="inline-block hover:scale-105 active:scale-95 transition-all duration-200" title="Restore Website">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <img src={logo} alt="Locker 24 Logo" className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(14,165,233,0.3)]" />
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold mb-2 font-display">New Credentials</h1>
          <p className="text-muted-foreground">Re-initialize secure vault password key</p>
        </div>

        {/* Content Box */}
        <div className="glass p-8 rounded-[2rem] space-y-6">
          <AnimatePresence mode="wait">
            {!token ? (
              <motion.div 
                key="token-missing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Missing Authorization</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed px-4">
                    No secure password recovery token was found in the URL. Please request a new recovery link.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm text-primary-500 font-bold hover:underline">
                    Go to Recovery Page
                  </Link>
                </div>
              </motion.div>
            ) : !success ? (
              <motion.form 
                key="reset-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <p className="text-sm text-slate-400 text-center leading-relaxed">
                  Establish a secure, strong security key to encrypt and unlock your vault.
                </p>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold text-center flex items-center gap-2 justify-center"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Input 
                  label="New Password Key"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  required
                />

                <Input 
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  required
                />

                <Button 
                  type="submit" 
                  className="w-full py-4 text-lg" 
                  isLoading={isLoading}
                >
                  Update Security Key <Key size={18} className="ml-2" />
                </Button>
              </motion.form>
            ) : (
              <motion.div 
                key="success-redirect"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                  <CheckCircle size={32} />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Security Key Reset</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Your password was successfully updated in our secure directory.
                  </p>
                  <p className="text-[10px] text-primary-500 font-bold mt-4 animate-pulse">
                    Redirecting to the login console...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to Login Footer */}
          {!success && (
            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 font-bold hover:text-slate-200 transition-colors">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
