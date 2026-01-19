import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { fetchCourses } from '../../services/courseService';
import defaultAvatar from '../../assets/default-avatar.png';
import useCart from '../../hooks/useCart';
import { Share2 } from 'lucide-react';
import ShareModal from '../ShareModal';

const Header = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { cartCount } = useCart();

  const handlePrefetchCourses = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['courses', { page: '1', limit: '8' }],
      queryFn: () => fetchCourses({ page: '1', limit: '8' }),
      staleTime: 1000 * 60 * 5, // 5 mins
    });
  }, [queryClient]);

  const dropdownRef = useRef(null);

  // Prefetch courses on mount for instant loading
  useEffect(() => {
    handlePrefetchCourses();
  }, [handlePrefetchCourses]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await signOut();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#2a2a3a] bg-[#0a0a14]/90 backdrop-blur-md">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-3 group" to="/">
              <div className="h-14 w-auto">
                <img 
                  src="/FlyUpTeam.png" 
                  alt="FlyUp Logo" 
                  className="h-full w-auto object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                  FlyUp
                </h2>
                <p className="text-xs font-semibold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent leading-tight tracking-wide">
                  Edu & Tech
                </p>
              </div>
            </Link>
            <label className="hidden md:flex flex-col min-w-40 h-10 w-64 lg:w-80">
              <div className="flex w-full flex-1 items-stretch rounded-full h-full bg-[#16161e] border border-[#2a2a3a] overflow-hidden focus-within:ring-2 ring-primary/50 transition-all">
                <div className="text-gray-500 flex items-center justify-center pl-4 pr-2">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input className="flex w-full bg-transparent border-none text-sm font-medium text-white focus:outline-0 focus:ring-0 placeholder:text-gray-500 h-full" placeholder="Search for courses..."/>
              </div>
            </label>
          </div>
          <div className="flex items-center gap-4 lg:gap-8">
            <nav className="hidden lg:flex items-center gap-6">
              <Link 
                className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" 
                to="/courses"
                onMouseEnter={handlePrefetchCourses}
              >
                Courses
              </Link>
              <Link className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" to="/browse">Browse</Link>
              <Link className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" to="/my-learning">My Learning</Link>
              <Link className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" to="/mentors">Mentors</Link>
              <Link className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" to="/community">Community</Link>
            </nav>
            <div className="flex gap-3 relative">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#16161e] border border-transparent hover:border-[#2a2a3a] text-white transition-all relative"
                title="Share this page"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {user && (
                <Link to="/my-learning?tab=wishlist" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#16161e] border border-transparent hover:border-[#2a2a3a] text-white transition-all relative">
                  <span className="material-symbols-outlined text-[24px]">favorite</span>
                </Link>
              )}
              <Link to="/cart" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#16161e] border border-transparent hover:border-[#2a2a3a] text-white transition-all relative">
                <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-600 text-[10px] font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
              {loading ? (
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
                   <div className="hidden sm:block w-24 h-4 bg-white/10 rounded animate-pulse"></div>
                </div>
              ) : user ? (
                <div ref={dropdownRef} className="relative group">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-[#16161e] p-1.5 pr-4 rounded-full border border-transparent hover:border-[#2a2a3a] transition-all"
                  >
                    <div className="size-8 rounded-full overflow-hidden border border-[#2a2a3a]">
                      <img 
                        src={user.avatarUrl || defaultAvatar} 
                        alt="User Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-white hidden sm:block">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">keyboard_arrow_down</span>
                  </button>
  
                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 top-full mt-2 w-64 bg-[#16161e] border border-[#2a2a3a] rounded-2xl shadow-xl overflow-hidden transition-all duration-200 origin-top-right ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                    <div className="p-4 border-b border-[#2a2a3a] bg-[#0a0a14]/50">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full overflow-hidden border border-[#2a2a3a]">
                          <img 
                            src={user.avatarUrl || defaultAvatar} 
                            alt="User Avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              (user.role || user.Role) === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              (user.role || user.Role) === 'INSTRUCTOR' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {user.role || user.Role || 'LEARNER'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link to="/my-learning?tab=wishlist" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#2a2a3a]/50 text-gray-300 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">favorite</span>
                        <span className="text-sm font-medium">My Wishlist</span>
                      </Link>
                      <Link to="/settings?tab=transactions" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#2a2a3a]/50 text-gray-300 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                        <span className="text-sm font-medium">Transaction History</span>
                      </Link>
                      <Link to="/settings?tab=profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#2a2a3a]/50 text-gray-300 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                        <span className="text-sm font-medium">Information Setting</span>
                      </Link>
                      <Link to="/settings?tab=security" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#2a2a3a]/50 text-gray-300 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">shield</span>
                        <span className="text-sm font-medium">Change Password</span>
                      </Link>
                      <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#2a2a3a]/50 text-gray-300 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                        <span className="text-sm font-medium">Settings</span>
                      </Link>
                    </div>
                    <div className="p-2 border-t border-[#2a2a3a] bg-[#0a0a14]/30">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="text-sm font-bold">Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="h-10 px-5 flex items-center justify-center rounded-full border border-[#2a2a3a] hover:bg-[#16161e] text-white text-sm font-bold transition-all"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register"
                    className="hidden sm:flex h-10 px-5 items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all transform hover:-translate-y-0.5"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </>
  );
};

export default Header;

