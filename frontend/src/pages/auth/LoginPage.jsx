import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, ShieldCheck, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../utils/firebase';
import { FullPageLoader } from '../../components/common/Spinner';

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const location = useLocation();
  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';
  const isResetSuccess = new URLSearchParams(location.search).get('reset') === 'success';

  const [formData, setFormData] = useState({
    email_or_username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

  // Prevent double-triggering of getRedirectResult in React 18 Strict Mode
  const hasTriggeredCheck = useRef(false);

  // Detect if the user is visiting from a mobile browser
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Securely listen for OAuth redirect results (critical for mobile browsers)
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsCheckingRedirect(false);
      return;
    }

    // Skip if already triggered to prevent StrictMode race conditions
    if (hasTriggeredCheck.current) return;
    hasTriggeredCheck.current = true;

    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setIsGoogleLoading(true);
          const idToken = await result.user.getIdToken();
          await loginWithGoogle({
            credential: idToken,
            email: result.user.email || '',
            name: result.user.displayName || '',
            picture: result.user.photoURL || ''
          });
        }
      } catch (err) {
        console.error("Firebase Redirect Auth Error:", err);
        setError(err.message || 'Google Redirect Authentication failed');
      } finally {
        setIsGoogleLoading(false);
        setIsCheckingRedirect(false);
      }
    };

    handleRedirectResult();
  }, [auth, isFirebaseConfigured]);

  // Display high-fidelity loading dial while checking for Google redirect results
  if (isCheckingRedirect) {
    return <FullPageLoader label="Google Authentication" sublabel="Verifying redirect credentials..." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login({
        email_or_username: formData.email_or_username,
        password: formData.password
      });
    } catch (err) {
      setError('wrong password entered or wrong userid entered');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      // Graceful fallback to Developer Simulation Dialog
      setShowGoogleModal(true);
      return;
    }

    setIsGoogleLoading(true);
    setError('');
    try {
      // Try popup sign-in first (works on desktop, and works on mobile if popups are allowed or cookies are partitioned)
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      await loginWithGoogle({
        credential: idToken,
        email: result.user.email || '',
        name: result.user.displayName || '',
        picture: result.user.photoURL || ''
      });
    } catch (err) {
      console.error("Firebase Google Auth Error:", err);
      
      // If the popup was blocked by the browser, fall back to redirect flow!
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        console.log("Popup blocked by browser. Falling back to secure redirect flow...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error("Firebase Redirect Fallback Error:", redirectErr);
          setError(redirectErr.message || 'Google authentication failed');
          setIsGoogleLoading(false);
        }
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign in process cancelled.');
        setIsGoogleLoading(false);
      } else {
        setError(err?.message || 'Google authentication failed');
        setIsGoogleLoading(false);
      }
    }
  };

  const handleSelectGoogleAccount = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle({
        credential: "mock_google_id_token_" + Math.random().toString(36).substring(7),
        email: "google_admin@locker24.com",
        name: "Google Administrator",
        picture: "https://lh3.googleusercontent.com/a/default-user"
      });
    } catch (err) {
      setError(err.message || 'Google authentication failed');
      setShowGoogleModal(false);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100 via-background to-accent-100 dark:from-primary-950 dark:via-background dark:to-accent-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/login" onClick={() => window.location.href = '/login'} className="inline-block hover:scale-105 active:scale-95 transition-all duration-200" title="Restore Website">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <img src={logo} alt="Locker 24 Logo" className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(14,165,233,0.3)]" />
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Secure access to your personal documents</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-8 rounded-[2rem] space-y-6">
          {isResetSuccess && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 justify-center"
            >
              <CheckCircle size={18} className="shrink-0" />
              <span>Security key updated successfully!</span>
            </motion.div>
          )}
          {isExpired && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 justify-center"
            >
              <AlertTriangle size={18} className="shrink-0" />
              <span>Session expired. Please sign in again.</span>
            </motion.div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold text-center">
              wrong password or wrong userid
            </div>
          )}
          <Input 
            label="Email or Username"
            type="text"
            placeholder="admin or name@example.com"
            icon={Mail}
            value={formData.email_or_username}
            onChange={(e) => setFormData({ ...formData, email_or_username: e.target.value })}
            required
          />
          <Input 
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-600" />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <Link to="/forgot-password" title="Forgot password" className="text-primary-600 font-semibold hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-lg animate-glow" 
            isLoading={isLoading}
          >
            Sign In <LogIn size={20} className="ml-2" />
          </Button>

          {/* 
          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 font-bold hover:text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98] rounded-2xl text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Sign in with Google</span>
          </button>
          */}

          {/*
          <p className="text-center text-muted-foreground text-sm">
            Don't have an account? {' '}
            <Link to="/register" className="text-primary-600 font-bold hover:underline">
              Create Account
            </Link>
          </p>
          */}
        </form>
      </motion.div>

      {/* Guaranteed Visible Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowErrorModal(false)}
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-[2rem] p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-display">Access Denied</h3>
                <p className="text-sm font-bold text-red-400 mb-8">
                  wrong password or wrong userid
                </p>
                
                <Button 
                  onClick={() => setShowErrorModal(false)}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 border-none font-bold text-white shadow-lg shadow-red-600/30"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>





      {/* Simulated Google Authentication Dialog */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isGoogleLoading) setShowGoogleModal(false); }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 leading-none">
                  <Info size={12} />
                  <span>Developer Simulation Mode</span>
                </div>
                <svg className="w-10 h-10 mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <h3 className="text-lg font-bold text-white">Sign in with Google</h3>
                <p className="text-xs text-slate-400 mt-1">to continue to Locker 24 Vault</p>
              </div>

              {isGoogleLoading ? (
                <div className="py-8 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold animate-pulse">Establishing secure OAuth handshake...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-left font-bold text-slate-500 uppercase tracking-widest px-1">Choose an Account</p>
                  
                  <button 
                    type="button"
                    onClick={handleSelectGoogleAccount}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-white/5 transition-all text-left active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-primary-600/20">
                      GA
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-200">Google Administrator</div>
                      <div className="text-xs text-slate-400 truncate">google_admin@locker24.com</div>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setIsGoogleLoading(true);
                      setTimeout(async () => {
                        try {
                          await loginWithGoogle({
                            credential: "mock_google_id_token_" + Math.random().toString(36).substring(7),
                            email: "demo_user@locker24.com",
                            name: "Demo Vault User",
                            picture: "https://lh3.googleusercontent.com/a/default-user"
                          });
                        } catch (err) {
                          setError(err.message || 'Google authentication failed');
                          setShowGoogleModal(false);
                          setIsGoogleLoading(false);
                        }
                      }, 1200);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-white/5 transition-all text-left active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-emerald-600/20">
                      DU
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-200">Demo Vault User</div>
                      <div className="text-xs text-slate-400 truncate">demo_user@locker24.com</div>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="w-full text-xs font-semibold py-3 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
