import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import InstructorLayout from "../components/InstructorLayout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InstructorCommunicationPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("comments");
  const [data, setData] = useState({ comments: [], reviews: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("Please login as an instructor");
      navigate("/login?role=instructor");
      return;
    }
    const roleValue = (user.role || user.Role || "").trim().toLowerCase();
    if (!user.instructor && !user.instructorId && roleValue !== "instructor") {
      toast.error("You do not have instructor privileges");
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Fetch communication data
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/courses/instructor/communication`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(result.data || { comments: [], reviews: [] });
        } else {
          toast.error("Failed to fetch communication data");
        }
      } catch (error) {
        console.error("Failed to fetch communication:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const tabs = [
    { key: "comments", label: "Comments", icon: "chat_bubble", count: data.comments?.length || 0 },
    { key: "reviews", label: "Reviews", icon: "star", count: data.reviews?.length || 0 },
    { key: "qa", label: "Q&A", icon: "help", count: data.comments?.filter(c => c.content?.includes("?")).length || 0 },
  ];

  const getFilteredItems = () => {
    if (activeTab === "reviews") return data.reviews || [];
    if (activeTab === "qa") return (data.comments || []).filter(c => c.content?.includes("?"));
    return data.comments || [];
  };

  const items = getFilteredItems();

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`material-symbols-outlined text-sm ${
          i < rating ? "text-yellow-400" : "text-slate-600"
        }`}
      >
        star
      </span>
    ));
  };

  return (
    <InstructorLayout
      title="Communication"
      subtitle="View comments, reviews, and Q&A from your students"
    >
      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-3 mb-10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black tracking-wide transition-all ${
              activeTab === tab.key
                ? "bg-purple-500 text-white shadow-xl shadow-purple-500/20"
                : "bg-white/5 text-slate-400 border border-white/10 hover:border-purple-500/50 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === tab.key
                ? "bg-white/20"
                : "bg-white/10"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading feedback...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
          <span className="material-symbols-outlined text-6xl text-slate-700 block mb-4">
            {activeTab === "reviews" ? "star_border" : activeTab === "qa" ? "help_outline" : "chat_bubble_outline"}
          </span>
          <h3 className="text-xl font-bold text-white mb-2">
            No {activeTab === "qa" ? "Q&A" : activeTab} yet
          </h3>
          <p className="text-slate-400 max-w-xs mx-auto text-sm">
            Your students haven't left any {activeTab === "qa" ? "questions" : activeTab} for your courses yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-white/[0.07] transition-all"
            >
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <img
                  src={item.user?.avatar || item.user?.AvatarUrl || "https://via.placeholder.com/40?text=U"}
                  alt={item.user?.name || item.user?.FullName || "User"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/5 group-hover:border-purple-500/40 transition-all flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                      {item.user?.name || item.user?.FullName || "Anonymous Student"}
                    </span>
                    {activeTab === "reviews" && item.Rating && (
                      <div className="flex items-center gap-0.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                        {renderStars(item.Rating)}
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(item.createdAt || item.CreationTime).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <span className="absolute -left-3 top-0 text-3xl text-white/5 font-serif">"</span>
                    <p className="text-[15px] text-slate-300 leading-relaxed font-medium">
                      {item.content || item.Content}
                    </p>
                  </div>

                  {/* Context badge */}
                  {(item.courseTitle || item.lectureTitle) && (
                    <div className="flex flex-wrap items-center gap-2 mt-5">
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-purple-500/20">
                        {item.courseTitle}
                      </span>
                      {item.lectureTitle && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20">
                          {item.lectureTitle}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </InstructorLayout>
  );
}
