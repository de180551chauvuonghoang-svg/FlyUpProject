import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: verify OTP + Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // 180 seconds = 3 mins

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'learner',
    otp: ''
  });

  // Countdown timer effect
  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.fullName) {
        toast.error('Please enter your full name and email first.');
        return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Sending verification code...');

    try {
        const response = await fetch(`${API_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle rate limit specifically
             if (response.status === 429) {
                 throw new Error(data.error);
             }
            throw new Error(data.error || 'Failed to send OTP');
        }

        toast.success(`Code sent to ${formData.email}`, { id: toastId });
        setStep(2);
        setCountdown(180); // Start 3 min countdown
    } catch (error) {
        console.error('Send OTP error:', error);
        toast.error(error.message, { id: toastId });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
        toast.error('Password must be at least 8 characters, include uppercase, lowercase, number, and special symbol.');
        return;
    }

    if (formData.otp.length !== 6) {
        toast.error('Please enter a valid 6-digit verification code.');
        return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Verifying & Creating account...');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          otp: formData.otp
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      toast.success('Account created successfully!', { id: toastId });
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to create account', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Render Step 1: Info (Name, Email, Role)
  const renderStep1 = () => (
    <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5"
    >
        {/* Full Name */}
        <motion.label className="flex flex-col w-full" variants={itemVariants}>
            <p className="text-white text-sm font-medium leading-normal pb-2 ml-1">Full Name</p>
            <div className="relative">
            <motion.input 
                className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 text-base font-normal leading-normal transition-all"
                placeholder="John Doe" 
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                whileFocus={{ scale: 1.01 }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <span className="material-symbols-outlined text-xl">person</span>
            </div>
            </div>
        </motion.label>

        {/* Email */}
        <motion.label className="flex flex-col w-full" variants={itemVariants}>
            <p className="text-white text-sm font-medium leading-normal pb-2 ml-1">Email</p>
            <div className="relative">
            <motion.input 
                className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 text-base font-normal leading-normal transition-all"
                placeholder="student@example.com" 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                whileFocus={{ scale: 1.01 }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <span className="material-symbols-outlined text-xl">mail</span>
            </div>
            </div>
        </motion.label>

        {/* Role Selector */}
        <motion.div className="flex flex-col w-full" variants={itemVariants}>
            <p className="text-white text-sm font-medium leading-normal pb-2 ml-1">I want to join as</p>
            <div className="grid grid-cols-2 gap-3">
            <motion.button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'learner' }))}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                formData.role === 'learner'
                    ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                    : 'border-[#2a2a3a] bg-[#1e1e28]/50 text-gray-400 hover:border-primary/50 hover:bg-[#1e1e28]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className={`material-symbols-outlined text-3xl ${formData.role === 'learner' ? 'text-primary' : ''}`}>
                school
                </span>
                <span className="font-semibold text-sm">Learner</span>
                <span className="text-xs text-gray-500">Browse & enroll courses</span>
            </motion.button>
            <motion.button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'instructor' }))}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                formData.role === 'instructor'
                    ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                    : 'border-[#2a2a3a] bg-[#1e1e28]/50 text-gray-400 hover:border-primary/50 hover:bg-[#1e1e28]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className={`material-symbols-outlined text-3xl ${formData.role === 'instructor' ? 'text-primary' : ''}`}>
                cast_for_education
                </span>
                <span className="font-semibold text-sm">Instructor</span>
                <span className="text-xs text-gray-500">Create & sell courses</span>
            </motion.button>
            </div>
        </motion.div>
        
        <motion.button 
            className="w-full mt-2 flex items-center justify-center rounded-lg h-12 px-4 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSendOtp}
            type="button" // Use type button to prevent form default submit validation triggering early
            disabled={isLoading}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
        >
            {isLoading ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending Code...</span>
            </div>
            ) : (
                'Send Verification Code'
            )}
        </motion.button>
    </motion.div>
  );

  // Render Step 2: OTP + Password
  const renderStep2 = () => (
    <motion.div 
        variants={itemVariants} 
        initial="hidden" 
        animate="visible"
        className="flex flex-col gap-5"
    >
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center mb-2">
            <p className="text-sm text-gray-300">
                Code sent to <span className="text-white font-bold">{formData.email}</span>
            </p>
            <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-xs text-primary underline mt-1 hover:text-white"
            >
                Change Email
            </button>
        </div>

        {/* OTP Input */}
        <motion.label className="flex flex-col w-full" variants={itemVariants}>
            <div className="flex justify-between items-center pb-2 ml-1">
                <p className="text-white text-sm font-medium leading-normal">Verification Code</p>
                <span className={`text-xs ${countdown > 0 ? 'text-primary' : 'text-red-500'}`}>
                    {countdown > 0 ? `Expires in ${formatTime(countdown)}` : 'Code Expired'}
                </span>
            </div>
            <div className="relative">
            <motion.input 
                className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 text-base font-normal leading-normal transition-all tracking-[0.5em] text-center font-mono"
                placeholder="000000" 
                type="text"
                maxLength={6}
                name="otp"
                value={formData.otp}
                onChange={(e) => {
                    // Only allow numbers
                    if (/^\d*$/.test(e.target.value)) {
                        handleInputChange(e);
                    }
                }}
                required
                whileFocus={{ scale: 1.01 }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <span className="material-symbols-outlined text-xl">key</span>
            </div>
            {countdown === 0 && (
                 <button 
                    type="button"
                    onClick={handleSendOtp}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary text-sm font-bold cursor-pointer hover:underline"
                 >
                    Resend
                 </button>
            )}
            </div>
        </motion.label>

        {/* Password */}
        <motion.label className="flex flex-col w-full" variants={itemVariants}>
            <div className="flex justify-between items-center pb-2 ml-1">
            <p className="text-white text-sm font-medium leading-normal">Create Password</p>
            </div>
            <div className="relative w-full">
            <motion.input 
                className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 pr-10 text-base font-normal leading-normal transition-all"
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                whileFocus={{ scale: 1.01 }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <span className="material-symbols-outlined text-xl">lock</span>
            </div>
            <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary cursor-pointer transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
            >
                <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
                </span>
            </button>
            </div>

            {/* Password Strength Meter & Checklist */}
            <div className="mt-4 space-y-3">
                {/* Strength Bar */}
                <div className="w-full bg-[#1e1e28] rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${
                            (() => {
                                const p = formData.password;
                                let score = 0;
                                if (p.length >= 8) score++;
                                if (/[A-Z]/.test(p)) score++;
                                if (/[a-z]/.test(p)) score++;
                                if (/[0-9]/.test(p)) score++;
                                if (/[@$!%*?&]/.test(p)) score++;
                                
                                switch(score) {
                                    case 1: return 'bg-red-500 w-1/5';
                                    case 2: return 'bg-orange-500 w-2/5';
                                    case 3: return 'bg-yellow-500 w-3/5';
                                    case 4: return 'bg-blue-400 w-4/5';
                                    case 5: return 'bg-green-500 w-full';
                                    default: return 'bg-transparent w-0';
                                }
                            })()
                        }`}
                    ></div>
                </div>

                {/* Validation Checklist */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div className={`flex items-center gap-1.5 transition-colors ${formData.password.length >= 8 ? 'text-green-400' : ''}`}>
                        <span className="material-symbols-outlined text-[14px]">
                            {formData.password.length >= 8 ? 'check_circle' : 'circle'}
                        </span>
                        <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(formData.password) ? 'text-green-400' : ''}`}>
                         <span className="material-symbols-outlined text-[14px]">
                            {/[A-Z]/.test(formData.password) ? 'check_circle' : 'circle'}
                        </span>
                        <span>Uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors ${/[a-z]/.test(formData.password) ? 'text-green-400' : ''}`}>
                         <span className="material-symbols-outlined text-[14px]">
                            {/[a-z]/.test(formData.password) ? 'check_circle' : 'circle'}
                        </span>
                        <span>Lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors ${/[0-9]/.test(formData.password) ? 'text-green-400' : ''}`}>
                         <span className="material-symbols-outlined text-[14px]">
                            {/[0-9]/.test(formData.password) ? 'check_circle' : 'circle'}
                        </span>
                        <span>Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors ${/[@$!%*?&]/.test(formData.password) ? 'text-green-400' : ''}`}>
                         <span className="material-symbols-outlined text-[14px]">
                            {/[@$!%*?&]/.test(formData.password) ? 'check_circle' : 'circle'}
                        </span>
                        <span>Special char (@$!%*?&)</span>
                    </div>
                </div>
            </div>
        </motion.label>

        {/* Confirm Password */}
        <motion.label className="flex flex-col w-full" variants={itemVariants}>
            <div className="flex justify-between items-center pb-2 ml-1">
            <p className="text-white text-sm font-medium leading-normal">Confirm Password</p>
            </div>
            <div className="relative w-full">
            <motion.input 
                className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 pr-10 text-base font-normal leading-normal transition-all"
                placeholder="••••••••" 
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                whileFocus={{ scale: 1.01 }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <span className="material-symbols-outlined text-xl">lock</span>
            </div>
            <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary cursor-pointer transition-colors"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
                <span className="material-symbols-outlined text-xl">
                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
            </button>
            </div>
        </motion.label>

        <motion.button 
            className="w-full mt-2 flex items-center justify-center rounded-lg h-12 px-4 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
        >
            {isLoading ? (
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Account...</span>
            </div>
            ) : (
            'Complete Registration'
            )}
        </motion.button>
    </motion.div>
  );

  return (
    <div className="bg-[#0a0a14] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Custom Styles */}
      <style>{`
        .glass-panel {
          background: rgba(22, 22, 30, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.3;
          animation: move 10s infinite alternate;
        }

        .blob-1 {
          background: #9942f0;
          width: 300px;
          height: 300px;
          top: -50px;
          left: -50px;
        }

        .blob-2 {
          background: #7c3aed;
          width: 350px;
          height: 350px;
          bottom: -50px;
          right: -50px;
          animation-duration: 15s;
        }

        .blob-3 {
          background: #a855f7;
          width: 200px;
          height: 200px;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.2;
          animation-duration: 20s;
        }

        @keyframes move {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, -30px) scale(1.1); }
        }
      `}</style>

      {/* Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* Main Content */}
      <motion.main 
        className="w-full max-w-[480px] z-10 my-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="glass-panel w-full rounded-2xl p-8 sm:p-12"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              className="mb-4"
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
            <motion.h2 
              className="text-4xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent text-center"
              variants={itemVariants}
            >
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </motion.h2>
            <motion.p 
              className="text-gray-400 text-base font-normal leading-normal pt-2 text-center"
              variants={itemVariants}
            >
              {step === 1 ? 'Start your learning journey today.' : 'Enter the code sent to your email.'}
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </form>

          {/* Login Link */}
          <motion.div className="mt-8 text-center" variants={itemVariants}>
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline hover:text-purple-400 transition-colors">
                Log In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default RegisterPage;
