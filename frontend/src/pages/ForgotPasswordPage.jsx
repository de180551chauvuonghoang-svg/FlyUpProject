import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Sending reset link...');

    try {
      const { error } = await resetPassword(email);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Reset link sent!', { id: toastId });
      setIsSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to send reset link', { id: toastId });
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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Back to Home Button */}
        <Link 
          to="/" 
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Glass Card */}
        <div className="glass-card w-full max-w-[480px] rounded-2xl p-8 sm:p-10 transition-all duration-300">
          {/* Header Section */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6">
              <img 
                src="/FlyUpLogin.png" 
                alt="FlyUp Logo" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Forgot Password?</h1>
            <p className="text-sm text-gray-400">
              {isSent 
                ? "We've sent a password reset link to your email address." 
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>
          </div>

          {!isSent ? (
            /* Forgot Password Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input 
                    className="block w-full rounded-lg border border-[#2a2a3a] bg-[#1e1e28]/50 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 shadow-sm backdrop-blur-sm transition-colors focus:border-primary focus:bg-[#1e1e28] focus:ring-1 focus:ring-primary focus:outline-none"
                    id="email" 
                    name="email"
                    placeholder="student@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#0a0a14] disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </>
                  )}
                </span>
              </button>
            </form>
          ) : (
            /* Success State Actions */
            <div className="flex flex-col gap-4">
              <Link 
                to="/login"
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40"
              >
                Back to Login
              </Link>
              <button 
                onClick={() => setIsSent(false)}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Use a different email address
              </button>
            </div>
          )}

          {/* Footer - Back to Login */}
          {!isSent && (
            <p className="mt-8 text-center text-sm text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="font-semibold text-primary transition-colors hover:text-purple-400 hover:underline">
                Back to Login
              </Link>
            </p>
          )}
          
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 text-center text-xs text-gray-600">
          © 2024 FlyUp EduTech. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
