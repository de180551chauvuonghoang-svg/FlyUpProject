import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { fetchInstructors } from '../services/instructorService';
import { Mail, Phone, BookOpen, MessageSquare, Star, Award, ShieldCheck } from 'lucide-react';
import defaultAvatar from '../assets/default-avatar.png';

const MentorsPage = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const data = await fetchInstructors();
        setMentors(data);
      } catch (err) {
        setError('Failed to load mentors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadMentors();
  }, []);

  const handleContact = (email) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
            Our Expert Mentors
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Learn from industry leaders and experts who are passionate about sharing their knowledge and helping you reach your full potential.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#16161e] border border-[#2a2a3a] rounded-3xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
                <div className="mt-6 pt-6 border-t border-[#2a2a3a] flex gap-2">
                  <div className="h-10 bg-gray-700 rounded-full flex-1" />
                  <div className="h-10 bg-gray-700 rounded-full flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-[#16161e] border border-[#2a2a3a] rounded-3xl">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary rounded-full font-bold">Try Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="group relative bg-[#16161e] border border-[#2a2a3a] hover:border-violet-500/50 rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] overflow-hidden"
              >
                {/* Background patterns */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-all duration-500" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-violet-500/20 group-hover:border-violet-500/50 transition-colors">
                          <img
                            src={mentor.user.AvatarUrl || defaultAvatar}
                            alt={mentor.user.FullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-lg p-1 border-2 border-[#16161e]">
                          <ShieldCheck className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors">
                          {mentor.user.FullName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-0.5">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Expert Instructor</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-2">
                        <Star className="w-3 h-3 text-violet-400" />
                        Introduction
                      </h4>
                      <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                        {mentor.intro || mentor.user.Bio || "Experienced professional dedicated to student success."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-4 border-t border-[#2a2a3a]">
                      <div className="flex items-center gap-2 text-gray-400">
                        <BookOpen className="w-4 h-4 text-sky-400" />
                        <span className="text-sm">
                          <strong className="text-white">{mentor.courseCount}</strong> Courses
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MessageSquare className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-sm">Highly Active</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleContact(mentor.user.Email)}
                        className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white h-11 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-violet-900/20"
                      >
                        <Mail className="w-4 h-4" />
                        Contact
                      </button>
                      <button
                        className="w-11 h-11 flex items-center justify-center bg-[#2a2a3a] hover:bg-[#323242] text-gray-300 rounded-xl transition-all"
                        title="View Profile"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MentorsPage;
export default MentorsPage;
