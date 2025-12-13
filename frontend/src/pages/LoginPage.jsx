import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    console.log('Login attempt:', formData);
    // Add your login logic here
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
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-400">Enter your details to access your courses.</p>
          </div>

          {/* Login Form */}
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
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                  Password
                </label>
              </div>
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
                <a className="text-xs font-medium text-primary hover:text-purple-400 hover:underline" href="#">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#0a0a14]"
              type="submit"
            >
              <span className="relative z-10 flex items-center gap-2">
                Log In
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </span>
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-8">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a3a]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="glass-card rounded-full px-3 py-1 text-xs font-medium text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-[#2a2a3a] bg-[#1e1e28]/50 px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm transition-all hover:bg-[#1e1e28] hover:text-primary hover:border-primary/50"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z" fill="white" fillOpacity="0.01"></path>
                <path d="M20.1018 10.875h-8.1016v3.2813h4.8633c-.2617 1.6367-1.7461 4.5469-4.8633 4.5469-2.9219 0-5.3086-2.3945-5.3086-5.3516 0-2.957 2.3867-5.3516 5.3086-5.3516 1.6367 0 2.9258.8398 3.5938 1.4883l2.457-2.4609C16.4852 5.5625 14.4266 4.5 12.0002 4.5c-4.3242 0-7.832 3.5078-7.832 7.8516s3.5078 7.8516 7.832 7.8516c3.9609 0 7.4258-2.8242 7.4258-7.8516 0-.6133-.0664-1.1211-.1328-1.4766Z" fill="#DB4437"></path>
              </svg>
              Google
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-[#2a2a3a] bg-[#1e1e28]/50 px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm transition-all hover:bg-[#1e1e28] hover:text-primary hover:border-primary/50"
            >
              <svg aria-hidden="true" className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
              </svg>
              Facebook
            </button>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary transition-colors hover:text-purple-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 text-center text-xs text-gray-600">
          © 2024 FlyUp EduTech. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
