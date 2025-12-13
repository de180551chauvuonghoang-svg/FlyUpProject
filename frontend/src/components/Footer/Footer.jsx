import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-[#2a2a3a] bg-[#0a0a14] pt-16 pb-8">
      <div className="px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="size-6 text-primary">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-white">FlyUp</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Empowering learners worldwide with accessible, high-quality education. Start your journey with us today.
            </p>
            <div className="flex gap-4 mt-2">
              <a className="w-8 h-8 rounded-full bg-[#16161e] flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors" href="#">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
              </a>
              <a className="w-8 h-8 rounded-full bg-[#16161e] flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors" href="#">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.072 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-white">Learn</h4>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">Browse Courses</a>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">Categories</a>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">Mentorship</a>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">Pricing</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-white">Company</h4>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">About Us</a>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">Careers</a>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">Blog</a>
            <a className="text-sm text-gray-400 hover:text-primary transition-colors" href="#">Contact</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-white">Subscribe</h4>
            <p className="text-sm text-gray-400">Get the latest news and course updates.</p>
            <form className="flex flex-col gap-3">
              <input className="w-full px-4 py-3 rounded-lg bg-[#16161e] border border-[#2a2a3a] text-sm focus:ring-2 focus:ring-primary/50 text-white placeholder:text-gray-500" placeholder="Enter your email" type="email"/>
              <button className="w-full py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors" type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="pt-8 border-t border-[#2a2a3a] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2024 FlyUp EduTech. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="hover:text-primary" href="#">Privacy Policy</a>
            <a className="hover:text-primary" href="#">Terms of Service</a>
            <a className="hover:text-primary" href="#">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
