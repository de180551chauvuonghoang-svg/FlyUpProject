import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Register attempt:', formData);
    // Add your registration logic here
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

            {/* Submit Button */}
            <button 
              className="w-full mt-2 flex items-center justify-center rounded-lg h-12 px-4 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all transform hover:-translate-y-0.5"
              type="submit"
            >
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-6 items-center">
            <div className="flex-grow border-t border-[#2a2a3a]"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-[#2a2a3a]"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg h-10 border border-[#2a2a3a] bg-[#1e1e28]/50 hover:bg-[#1e1e28] hover:border-primary/50 transition-colors"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"></path>
                <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"></path>
                <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"></path>
                <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"></path>
              </svg>
              <span className="text-white text-sm font-medium">Google</span>
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg h-10 border border-[#2a2a3a] bg-[#1e1e28]/50 hover:bg-[#1e1e28] hover:border-primary/50 transition-colors"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.0734C24 5.40552 18.6274 0 12 0C5.37258 0 0 5.40552 0 12.0734C0 18.1006 4.38823 23.0945 10.125 24V15.5623H7.07813V12.0734H10.125V9.41249C10.125 6.38722 11.9165 4.71536 14.6576 4.71536C15.9705 4.71536 17.3438 4.95155 17.3438 4.95155V7.9224H15.8306C14.3392 7.9224 13.875 8.85243 13.875 9.80556V12.0734H17.2031L16.6711 15.5623H13.875V24C19.6118 23.0945 24 18.1006 24 12.0734Z" fill="#1877F2"></path>
              </svg>
              <span className="text-white text-sm font-medium">Facebook</span>
            </button>
          </div>

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
