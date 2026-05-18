import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, notifications }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`px-4 py-2 rounded-lg shadow-lg text-white transition-all duration-300 animate-slide-up ${
              n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
