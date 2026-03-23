import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';

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

/**
 * Admin Login Page
 * Dark themed login page with email/password and Google OAuth
 */
function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Get redirect path from location state
  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const toastId = toast.loading('Logging in...');

    try {
      const { error: authError } = await signIn(formData.email, formData.password);

      if (authError) {
        throw new Error(authError.message);
      }

      toast.success('Welcome back!', { id: toastId });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      toast.error(err.message || 'Failed to login', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    const toastId = toast.loading('Verifying Google Login...');

    try {
      // Call authService directly for Google login
      const result = await authService.googleLogin(credentialResponse.credential);
      
      // Store tokens and user
      localStorage.setItem('adminAccessToken', result.session.accessToken);
      localStorage.setItem('adminRefreshToken', result.session.refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(result.user));
      
      toast.success('Logged in with Google!', { id: toastId });
      // Force reload to pick up new auth state
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed');
      toast.error(err.message || 'Google login failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google Sign In Failed');
  };

  return (
    <div className="login-page">
      {/* Animated Background Blobs */}
      <div className="login-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Main Container */}
      <motion.div 
        className="login-container"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Glass Card */}
        <motion.div 
          className="login-card"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Section */}
          <div className="login-header">
            <motion.div 
              className="login-logo"
              variants={logoVariants}
              initial="initial"
              animate="animate"
            >
              <Shield size={48} className="logo-icon" />
            </motion.div>
            <motion.h1 variants={itemVariants} className="white">
              Admin Panel
            </motion.h1>
            <motion.p variants={itemVariants}>
              Enter your credentials to access the dashboard
            </motion.p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              className="login-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Input */}
            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  id="email" 
                  name="email"
                  type="email"
                  placeholder="admin@flyup.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  id="password" 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="•••••••••" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="current-password"
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button 
              type="submit"
              className="login-btn"
              disabled={isLoading}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Social Divider */}
          <motion.div className="login-divider" variants={itemVariants}>
            <div className="divider-line"></div>
            <span className="divider-text">Or continue with</span>
            <div className="divider-line"></div>
          </motion.div>

          {/* Google Login */}
          <motion.div 
            className="social-login"
            variants={itemVariants}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signin_with"
              width="100%"
            />
          </motion.div>

          {/* Footer */}
          <motion.div className="login-footer" variants={itemVariants}>
            <p>FlyUp Admin • Secure Access Only</p>
          </motion.div>
        </motion.div>

        {/* Copyright */}
        <motion.div className="login-copyright" variants={itemVariants}>
          © 2025 FlyUp EduTech. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
