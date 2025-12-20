import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'learner'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Creating your account...');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      toast.success('Account created successfully!', { id: toastId });
      
      // Navigate to login after a short delay
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
      <main className="w-full max-w-[480px] z-10 my-8">
        <div className="glass-panel w-full rounded-2xl p-8 sm:p-12 transition-all">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <img 
                src="/FlyUpLogin.png" 
                alt="FlyUp Logo" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <h2 className="text-white text-[28px] font-bold leading-tight tracking-[-0.015em] text-center">
              Create Account
            </h2>
            <p className="text-gray-400 text-base font-normal leading-normal pt-2 text-center">
              Start your learning journey today.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name */}
            <label className="flex flex-col w-full">
              <p className="text-white text-sm font-medium leading-normal pb-2 ml-1">Full Name</p>
              <div className="relative">
                <input 
                  className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 text-base font-normal leading-normal transition-all"
                  placeholder="John Doe" 
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
              </div>
            </label>

            {/* Email */}
            <label className="flex flex-col w-full">
              <p className="text-white text-sm font-medium leading-normal pb-2 ml-1">Email</p>
              <div className="relative">
                <input 
                  className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 text-base font-normal leading-normal transition-all"
                  placeholder="student@example.com" 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </div>
              </div>
            </label>

            {/* Password */}
            <label className="flex flex-col w-full">
              <div className="flex justify-between items-center pb-2 ml-1">
                <p className="text-white text-sm font-medium leading-normal">Password</p>
              </div>
              <div className="relative w-full">
                <input 
                  className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 pr-10 text-base font-normal leading-normal transition-all"
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
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
            </label>

            {/* Confirm Password */}
            <label className="flex flex-col w-full">
              <div className="flex justify-between items-center pb-2 ml-1">
                <p className="text-white text-sm font-medium leading-normal">Confirm Password</p>
              </div>
              <div className="relative w-full">
                <input 
                  className="flex w-full rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-[#2a2a3a] bg-[#1e1e28]/50 focus:border-primary h-12 placeholder:text-gray-500 px-4 pl-11 pr-10 text-base font-normal leading-normal transition-all"
                  placeholder="••••••••" 
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
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
            </label>

            {/* Role Selector */}
            <div className="flex flex-col w-full">
              <p className="text-white text-sm font-medium leading-normal pb-2 ml-1">I want to join as</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'learner' }))}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'learner'
                      ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                      : 'border-[#2a2a3a] bg-[#1e1e28]/50 text-gray-400 hover:border-primary/50 hover:bg-[#1e1e28]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-3xl ${formData.role === 'learner' ? 'text-primary' : ''}`}>
                    school
                  </span>
                  <span className="font-semibold text-sm">Learner</span>
                  <span className="text-xs text-gray-500">Browse & enroll courses</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'instructor' }))}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'instructor'
                      ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/20'
                      : 'border-[#2a2a3a] bg-[#1e1e28]/50 text-gray-400 hover:border-primary/50 hover:bg-[#1e1e28]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-3xl ${formData.role === 'instructor' ? 'text-primary' : ''}`}>
                    cast_for_education
                  </span>
                  <span className="font-semibold text-sm">Instructor</span>
                  <span className="text-xs text-gray-500">Create & sell courses</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full mt-2 flex items-center justify-center rounded-lg h-12 px-4 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

        
         
          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline hover:text-purple-400 transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
