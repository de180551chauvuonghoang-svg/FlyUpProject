import React from "react";
import InstructorSidebar from "./InstructorSidebar";

/**
 * InstructorLayout - A premium layout wrapper for all instructor pages.
 * Includes the animated background, the sidebar, and a standardized scroll area.
 */
export default function InstructorLayout({ 
  children, 
  title, 
  subtitle,
  actions, // Optional action buttons for the header
  showSearch = true,
  searchQuery = "",
  setSearchQuery = () => {},
  placeholder = "Search..."
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-display overflow-x-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 blur-3xl opacity-50"></div>
      </div>

      {/* Sidebar */}
      <InstructorSidebar />

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen flex flex-col">
        {/* Standardized Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-950/40">
          <div className="px-6 lg:px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-3xl md:text-4xl font-bold text-white truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-slate-400 mt-1 truncate">
                  {subtitle}
                </p>
              )}

              {/* Mobile Search - only shown if showSearch is true */}
              {showSearch && (
                <div className="relative md:hidden mt-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Desktop Search */}
              {showSearch && (
                <div className="relative hidden md:block">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all w-64"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {actions && (
                <div className="flex items-center gap-3">
                  {actions}
                </div>
              )}

              {/* Notifications */}
              <button className="p-2 hover:bg-white/5 rounded-lg transition-all relative shrink-0">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 px-6 lg:px-10 py-8">
          {children}
        </div>

        {/* Professional Footer */}
        <footer className="px-6 lg:px-10 py-8 border-t border-white/5 text-center">
             <p className="text-slate-500 text-sm">© {new Date().getFullYear()} FlyUp Edu & Tech. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
