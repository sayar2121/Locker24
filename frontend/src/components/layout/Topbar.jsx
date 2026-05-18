import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Topbar = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, token, API_URL } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = React.useState([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchNotifications = React.useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/activity/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.slice(0, 5).map((act, idx) => {
          let title = "System Notification";
          let color = "text-blue-400 bg-blue-500/10";
          if (act.action === "UPLOAD") {
            title = "Document Uploaded";
            color = "text-emerald-400 bg-emerald-500/10";
          } else if (act.action === "SHARE") {
            title = "Secure Link Generated";
            color = "text-purple-400 bg-purple-500/10";
          } else if (act.action === "LOGIN") {
            title = "Authentication Event";
            color = "text-sky-400 bg-sky-500/10";
          } else if (act.action === "PIN_CHANGE" || act.action === "PIN_UPDATE") {
            title = "Security PIN Configured";
            color = "text-amber-400 bg-amber-500/10";
          }
          
          return {
            id: act.id || idx,
            title,
            details: act.details,
            time: new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            color,
            read: false
          };
        });
        
        setNotifications(mapped);
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const unreads = mapped.filter(n => !readIds.includes(n.id));
        setUnreadCount(unreads.length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [API_URL, token]);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
    setUnreadCount(0);
  };

  return (
    <header className="h-20 border-b border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 sticky top-0 z-40 px-8 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
        >
          <Menu size={24} />
        </button>
        <div className="relative w-full group hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search your documents..." 
            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-primary-600/20 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl transition-all text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowNotifications(false)} 
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl z-40 bg-slate-950 border border-white/5 shadow-2xl p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">Security Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-primary-400 font-bold hover:underline uppercase tracking-wider"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs font-semibold">
                        No recent activity alerts.
                      </div>
                    ) : (
                      notifications.map(notification => {
                        const isRead = JSON.parse(localStorage.getItem('read_notifications') || '[]').includes(notification.id);
                        return (
                          <div 
                            key={notification.id}
                            className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${isRead ? 'bg-slate-900/10 border-white/5 opacity-50' : 'bg-white/5 border-white/10'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${notification.color}`}>
                              💡
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-xs font-bold text-slate-200 truncate">{notification.title}</p>
                                <span className="text-[10px] text-slate-500 font-medium shrink-0">{notification.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium leading-relaxed break-words">{notification.details}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl transition-all group"
        >
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-bold group-hover:text-primary-600 transition-colors">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-muted-foreground leading-none">
              @{user?.username || 'username'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
