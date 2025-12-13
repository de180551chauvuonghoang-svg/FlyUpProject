import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="px-4 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a className="flex items-center gap-2 group" href="#">
            <div className="size-8 text-primary">
              <svg className="w-full h-full transition-transform group-hover:scale-110" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CoursePlatform</h2>
          </a>
          <label className="hidden md:flex flex-col min-w-40 h-10 w-64 lg:w-80">
            <div className="flex w-full flex-1 items-stretch rounded-full h-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden focus-within:ring-2 ring-primary/50 transition-all">
              <div className="text-gray-400 dark:text-gray-500 flex items-center justify-center pl-4 pr-2">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input className="flex w-full bg-transparent border-none text-sm font-medium text-slate-900 dark:text-white focus:outline-0 focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 h-full" placeholder="Search for courses..."/>
            </div>
          </label>
        </div>
        <div className="flex items-center gap-4 lg:gap-8">
          <nav className="hidden lg:flex items-center gap-6">
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Browse</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">My Learning</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Mentors</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Community</a>
          </nav>
          <div className="flex gap-3">
            <button className="hidden sm:flex h-10 px-5 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-bold transition-all">
              Log In
            </button>
            <button className="h-10 px-5 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all transform hover:-translate-y-0.5">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
