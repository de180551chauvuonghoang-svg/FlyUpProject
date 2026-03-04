import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    // If no token, we might want to redirect or show error, but handled in UI below
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!token) {
            toast.error('Invalid reset token');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Reseting password...');

        try {
            // We need to implement this endpoint/function
            // Assuming useAuth will expose it or we fetch directly
            // For consistency, I'll fetch directly here or implement in useAuth (preferred)
            
            // calling direct fetch for now to ensure speed, or better:
            // await auth.confirmPasswordReset(token, formData.password);
            
            const response = await fetch(`${API_URL}/auth/reset-password-confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token, 
                    newPassword: formData.password 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to reset password');
            }

            toast.success('Password reset successful!', { id: toastId });
            
            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
             <div className="bg-[#0a0a14] min-h-screen flex items-center justify-center text-white">
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
                    <p className="mb-4 text-gray-400">This password reset link is invalid or has expired.</p>
                    <button onClick={() => navigate('/login')} className="bg-primary px-4 py-2 rounded-lg">Return to Login</button>
                </div>
             </div>
        );
    }

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
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Reset Password</h1>
            <p className="text-sm text-gray-400">Enter your new password below.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* New Password */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    className="block w-full rounded-lg border border-[#2a2a3a] bg-[#1e1e28]/50 py-3 pl-10 pr-10 text-sm text-white placeholder-gray-500 shadow-sm backdrop-blur-sm transition-colors focus:border-primary focus:bg-[#1e1e28] focus:ring-1 focus:ring-primary focus:outline-none"
                    id="password" 
                    name="password"
                    placeholder="•••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
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
            </div>

            {/* Confirm Password */}
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                  </div>
                  <input 
                    className="block w-full rounded-lg border border-[#2a2a3a] bg-[#1e1e28]/50 py-3 pl-10 pr-10 text-sm text-white placeholder-gray-500 shadow-sm backdrop-blur-sm transition-colors focus:border-primary focus:bg-[#1e1e28] focus:ring-1 focus:ring-primary focus:outline-none"
                    id="confirmPassword" 
                    name="confirmPassword"
                    placeholder="•••••••••" 
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <button 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
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
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    Set New Password
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">check_circle</span>
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 text-center text-xs text-gray-600">
          © 2024 FlyUp EduTech. All rights reserved.
        </div>
      </div>
    </div>
    );
};

export default ResetPasswordPage;
