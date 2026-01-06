import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const logoVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LoginPage = () => {
  const { signIn } = useAuth(); 
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    const toastId = toast.loading('Verifying Google Login...');
    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ credential: credentialResponse.credential })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.details || data.error || 'Google login failed');
        
        localStorage.setItem('accessToken', data.session.accessToken);
        localStorage.setItem('refreshToken', data.session.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast.success('Logged in with Google!', { id: toastId });
        window.location.href = '/'; 
        
    } catch (error) {
        console.error('Google login error', error);
        toast.error(error.message, { id: toastId });
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Logging in...');

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Welcome back!', { id: toastId });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-display bg-[#0a0a14] text-white antialiased overflow-x-hidden min-h-screen relative selection:bg-primary selection:text-white">

      {/* Custom Styles */}
      <style>{`
        .glass-card {
          background: rgba(22, 22, 30, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }

        .blob {
          position: absolute;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.3;
        }

        .blob-1 {
          top: -10%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: #9333ea;
          border-radius: 50%;
          animation: float 8s infinite ease-in-out alternate;
        }
        
        .blob-2 {
          bottom: -10%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: #7c3aed;
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          animation: float 10s infinite ease-in-out alternate-reverse;
        }

        .blob-3 {
          top: 40%;
          left: 40%;
          width: 300px;
          height: 300px;
          background: #a855f7;
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: float 12s infinite ease-in-out alternate;
        }

        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(30px, 50px) rotate(10deg); }
        }
      `}</style>

      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Main Container */}
      <motion.div 
        className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Back to Home Button */}
        <motion.div variants={itemVariants}>
          <Link 
            to="/" 
            className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </motion.div>

        {/* Glass Card */}
        <motion.div 
          className="glass-card w-full max-w-[480px] rounded-2xl p-8 sm:p-10"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Section */}
          <div className="mb-8 flex flex-col items-center text-center">
            <motion.div 
              className="mb-6"
              variants={logoVariants}
              initial="initial"
              animate="animate"
            >
              <img 
                src="/FlyUpLogin.png" 
                alt="FlyUp Logo" 
                className="w-32 h-32 object-contain"
              />
            </motion.div>
            <motion.h1 
              className="text-4xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Welcome back
            </motion.h1>
            <motion.p 
              className="mt-2 text-sm text-gray-400"
              variants={itemVariants}
            >
              Enter your details to access your courses.
            </motion.p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Input */}
            <motion.div className="space-y-2" variants={itemVariants}>
              <label className="text-sm font-medium text-gray-300" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <motion.input 
                  className="block w-full rounded-lg border border-[#2a2a3a] bg-[#1e1e28]/50 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 shadow-sm backdrop-blur-sm transition-all focus:border-primary focus:bg-[#1e1e28] focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  id="email" 
                  name="email"
                  placeholder="student@example.com" 
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div className="space-y-2" variants={itemVariants}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <motion.input 
                  className="block w-full rounded-lg border border-[#2a2a3a] bg-[#1e1e28]/50 py-3 pl-10 pr-10 text-sm text-white placeholder-gray-500 shadow-sm backdrop-blur-sm transition-all focus:border-primary focus:bg-[#1e1e28] focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  id="password" 
                  name="password"
                  placeholder="•••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  whileFocus={{ scale: 1.01 }}
                />
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-purple-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button 
              className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#0a0a14] disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    Log In
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Social Divider */}
          <motion.div className="relative my-8" variants={itemVariants}>
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a3a]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="glass-card rounded-full px-3 py-1 text-xs font-medium text-gray-400">Or continue with</span>
            </div>
          </motion.div>

          {/* Social Buttons */}
          <motion.div 
            className="flex justify-center gap-6"
            variants={itemVariants}
          >
            <motion.div 
              className="flex justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
               <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error('Google Sign In Failed');
                  }}
                  useOneTap
                  type="icon"
                  theme="filled_black"
                  shape="circle"
               />
            </motion.div>
            
            {/* Facebook button */}
            <motion.button 
              type="button"
              className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-[#2a2a3a] bg-[#1e1e28]/50 text-gray-300 shadow-sm transition-all hover:bg-[#1e1e28] hover:text-primary hover:border-primary/50"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg aria-hidden="true" className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
              </svg>
            </motion.button>
            
            {/* GitHub button */}
            <motion.button 
              type="button"
              className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-[#2a2a3a] bg-[#1e1e28]/50 text-gray-300 shadow-sm transition-all hover:bg-[#1e1e28] hover:text-primary hover:border-primary/50"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
              </svg>
            </motion.button>
          </motion.div>

          {/* Footer */}
          <motion.p 
            className="mt-8 text-center text-sm text-gray-400"
            variants={itemVariants}
          >
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary transition-colors hover:text-purple-400 hover:underline">
              Sign Up
            </Link>
          </motion.p>
        </motion.div>

        {/* Bottom copyright */}
        <motion.div 
          className="mt-8 text-center text-xs text-gray-600"
          variants={itemVariants}
        >
          © 2024 FlyUp EduTech. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
