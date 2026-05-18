import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Shield, 
  CheckCircle2,
  Save,
  Trash2,
  Loader2
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { user, token, API_URL } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '+91 98765 43210',
    bio: 'Securing my documents in Locker 24.',
    location: 'India'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFormData({
            ...formData,
            fullName: data.name,
            email: data.email,
            username: data.username
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token, API_URL]);

  const handleSave = () => {
    // Simulate save logic for now
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-600/10 text-primary-500 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display">Account Profile</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Manage your personal information and security settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Avatar & Quick Info */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] text-center"
              >
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 p-1">
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                      <div className="text-4xl font-bold text-primary-500">{formData.fullName.charAt(0)}</div>
                    </div>
                  </div>
                  {/*
                  <button className="absolute bottom-1 right-1 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 hover:scale-110 transition-transform">
                    <Camera size={18} />
                  </button>
                  */}
                </div>
                
                <h2 className="text-xl font-bold">{formData.fullName}</h2>
                <p className="text-sm text-primary-600 font-semibold mb-6">@{formData.username}</p>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified Account
                  </span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-4"
              >
                <h3 className="font-bold flex items-center gap-2">
                  <Shield size={18} className="text-primary-600" /> Security Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Encryption Status</span>
                    <span className="text-emerald-500 font-bold">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Auth Level</span>
                    <span className="text-primary-500 font-bold">Level 2</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Personal Information</h3>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">
                        Cancel
                      </Button>
                      <Button onClick={handleSave} size="sm">
                        <Save size={16} className="mr-2" /> Save Changes
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground ml-1">Full Name</label>
                    <Input 
                      disabled={!isEditing}
                      icon={User}
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground ml-1">Email Address</label>
                    <Input 
                      disabled={!isEditing}
                      icon={Mail}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground ml-1">Username</label>
                    <Input 
                      disabled={true} // Username shouldn't be edited easily
                      icon={User}
                      value={formData.username}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground ml-1">Location</label>
                    <Input 
                      disabled={!isEditing}
                      icon={MapPin}
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground ml-1">Bio / Description</label>
                  <textarea 
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-border focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
