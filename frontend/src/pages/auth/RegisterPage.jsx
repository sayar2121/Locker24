import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, ShieldCheck, ArrowRight, AtSign } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const RegisterPage = () => {
  const { API_URL } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    username: '',
    password: '', 
    confirmPassword: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('Registration is disabled. Only the designated administrator account (admin) is authorized.');
    return;

    /* Commented out original registration fetch to enforce admin-only restriction:
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }

      // Success! Redirect to login
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
    */
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary-100 via-background to-accent-100 dark:from-primary-950 dark:via-background dark:to-accent-950">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-20 h-20 bg-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-accent-500/40"
          >
            <UserPlus className="text-white" size={40} />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join thousands of users securing their future</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-10 rounded-[2.5rem] space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Full Name"
              placeholder="John Doe"
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input 
              label="Username"
              placeholder="johndoe"
              icon={AtSign}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <Input 
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <Input 
              label="Confirm"
              type="password"
              placeholder="••••••••"
              icon={ShieldCheck}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="flex items-start gap-3 px-2">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-600" required />
            <p className="text-sm text-muted-foreground font-medium">
              I agree to the <Link to="/terms" className="text-primary-600 hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary-600 hover:underline">Privacy</Link>
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-lg" 
            isLoading={isLoading}
          >
            Get Started <ArrowRight size={20} className="ml-2" />
          </Button>

          <p className="text-center text-muted-foreground">
            Already have an account? {' '}
            <Link to="/login" className="text-primary-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
