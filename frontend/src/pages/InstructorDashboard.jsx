import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import InstructorLayout from "../components/InstructorLayout";
import ConfirmModal from "../components/ConfirmModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatVND = (amount) => {
  return (amount || 0).toLocaleString('vi-VN') + '₫';
};

export default function InstructorDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("my"); // "my" or "all"
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ... (auth and fetch logic kept same)
  // Check if user is logged in and is an instructor
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
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const statsRes = await fetch(`${API_URL}/courses/instructor/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
        let coursesRes;
        if (viewMode === "my") {
          coursesRes = await fetch(
            `${API_URL}/courses/instructor/courses?status=${statusFilter}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
        } else {
          coursesRes = await fetch(`${API_URL}/courses?limit=1000`);
        }
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          let coursesArray = viewMode === "all" ? (coursesData.data?.courses || coursesData.data || []) : (coursesData.data || []);
          setCourses(coursesArray);
        }
      } catch (error) {
        console.error("Failed to fetch instructor data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, statusFilter, viewMode]);

  const dashboardStats = stats
    ? {
        totalStudents: stats.totalStudents.toLocaleString(),
        studentsTrend: "+12.5%",
        totalRevenue: formatVND(stats.totalRevenue),
        revenueTrend: "+8.2%",
        totalCourses: stats.totalCourses.toString(),
        coursesTrend: "Stable",
        topCourse: {
          title: courses[0]?.title || "N/A",
          rating: courses[0]?.rating || 0,
          learners: courses[0]?.studentCount?.toLocaleString() || "0",
        },
      }
    : {
        totalStudents: "0",
        studentsTrend: "+0%",
        totalRevenue: "0₫",
        revenueTrend: "+0%",
        totalCourses: "0",
        coursesTrend: "Loading...",
        topCourse: { title: "Loading...", rating: 0, learners: "0" },
      };


  const handlePublish = async (courseId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const course = courses.find((c) => c.id === courseId);
      const isPublished = course?.status === "Ongoing" || course?.status === "published";
      const endpoint = isPublished ? "unpublish" : "publish";
      const response = await fetch(`${API_URL}/courses/${courseId}/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update course");
      }
      const data = await response.json();
      setCourses(courses.map((c) => c.id === courseId ? { ...c, status: isPublished ? "Draft" : "Ongoing" } : c));
      toast.success(data.message || (isPublished ? "Course unpublished" : "Course published successfully!"));
    } catch (error) {
      toast.error(error.message || "Failed to update course");
    }
  };

  const handleEdit = (id) => navigate(`/edit-course/${id}`);
  const handleView = (id) => navigate(`/instructor/preview/${id}`);
  const handleDelete = (courseId) => {
    triggerConfirm(
      "Delete Course",
      "Are you sure you want to delete this course? This action cannot be undone.",
      async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(`${API_URL}/courses/${courseId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to delete course");
          setCourses(courses.filter((c) => c.id !== courseId));
          toast.success("Course deleted successfully");
        } catch {
          toast.error("Failed to delete course");
        }
      }
    );
  };
  const handleCreateCourse = () => navigate("/instructor/create-course");

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase().trim();
    return courses.filter((course) => {
      const title = (course.title || course.Title || "").toLowerCase();
      const description = (course.description || course.Description || "").toLowerCase();
      const categoryName = (course.categoryName || course.CategoryName || "").toLowerCase();
      return title.includes(query) || description.includes(query) || categoryName.includes(query);
    });
  }, [courses, searchQuery]);

  return (
    <>
      <InstructorLayout
      title="Teaching Dashboard"
      subtitle="Manage your courses and student progress"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      placeholder="Search courses..."
    >
      <div className="space-y-8">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Total Students */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <span className="text-green-400 text-xs font-bold">+12.5%</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Total Students
              </p>
              <h3 className="text-white text-3xl font-bold">
                {dashboardStats.totalStudents}
              </h3>
            </div>


            {/* Total Courses */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-pink-500/20 rounded-lg text-pink-400">
                  <span className="material-symbols-outlined">
                    auto_stories
                  </span>
                </div>
                <span className="text-slate-400 text-xs font-bold">Stable</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Total Courses
              </p>
              <h3 className="text-white text-3xl font-bold">
                {dashboardStats.totalCourses}
              </h3>
            </div>

            {/* Top Course */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-400">
                  <span className="material-symbols-outlined">star_half</span>
                </div>
                <span className="text-green-400 text-xs font-bold">+0.1%</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Top Course
              </p>
              <div className="flex items-center gap-2 text-yellow-400">
                <span className="material-symbols-outlined text-sm">star</span>
                <span className="text-sm font-bold">
                  {Number(dashboardStats.topCourse.rating || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </section>


          {/* Course Management Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {viewMode === "my" ? "Your Courses" : "All Courses"}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {searchQuery
                    ? `Found ${filteredCourses.length} course${filteredCourses.length !== 1 ? "s" : ""} matching "${searchQuery}"`
                    : viewMode === "my"
                      ? `Manage and monitor your published content ${courses.length > 0 ? `(${courses.length} total)` : ""}`
                      : `Browse and edit any course in the system ${courses.length > 0 ? `(${courses.length} total)` : ""}`}
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => setViewMode("my")}
                    className={`px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                      viewMode === "my"
                        ? "bg-purple-500 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    My Courses
                  </button>
                  <button
                    onClick={() => setViewMode("all")}
                    className={`px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                      viewMode === "all"
                        ? "bg-purple-500 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All Courses
                  </button>
                </div>
                <button
                  onClick={handleCreateCourse}
                  className="px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2 justify-center whitespace-nowrap"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span className="hidden sm:inline">Create New</span>
                </button>
              </div>
            </div>

            {/* Status Filter - Only show for "My Courses" */}
            {viewMode === "my" && (
              <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                {["all", "published", "draft", "archived"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                      statusFilter === status
                        ? "bg-purple-500 text-white"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:border-purple-500/50"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Course Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading courses...</p>
                </div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-700 block mb-4">
                  {searchQuery ? "search_off" : "inbox"}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">
                  {searchQuery
                    ? "No matching courses found"
                    : "No courses found"}
                </h3>
                <p className="text-slate-400">
                  {searchQuery
                    ? `No courses match "${searchQuery}". Try a different search term.`
                    : "Create your first course to get started"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all"
                  >
                    {/* Course Image */}
                    <div className="relative h-48 overflow-hidden bg-linear-to-br from-purple-900 to-blue-900">
                      <img
                        src={
                          course.thumbUrl ||
                            course.ThumbUrl ||
                            course.thumbnail ||
                            course.thumbnailUrl ||
                            "https://placehold.co/400x300?text=No+Image"
                        }
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60"></div>

                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                            course.status === "Ongoing" ||
                            course.status === "published"
                              ? "bg-green-500/30 text-green-300 border-green-500/50"
                              : course.status === "Draft" ||
                                  course.status === "draft"
                                ? "bg-yellow-500/30 text-yellow-300 border-yellow-500/50"
                                : "bg-slate-500/30 text-slate-300 border-slate-500/50"
                          }`}
                        >
                          {course.status}
                        </span>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                          {course.shortDescription}
                        </p>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            people
                          </span>
                          {course.students || course.studentCount || 0} Learners
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            video_library
                          </span>
                          {course.lectures || course.lectureCount || 0} Lectures
                        </span>
                      </div>

                      {/* Price and Rating */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-lg font-bold text-purple-400">
                          {formatVND(course.discountPrice || course.price || 0)}
                        </span>
                        {course.rating > 0 && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <span className="material-symbols-outlined text-sm">
                              star
                            </span>
                            <span className="font-bold">
                              {Number(course.rating || 0).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4">
                        <button
                          onClick={() => handleView(course.id)}
                          className="flex-1 min-w-[80px] px-3 py-2 bg-white/5 hover:bg-purple-500/20 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2"
                        >
                          <span className="material-symbols-outlined text-sm sm:text-base">
                            visibility
                          </span>
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(course.id)}
                          className="flex-1 min-w-[80px] px-3 py-2 bg-white/5 hover:bg-green-500/20 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2"
                        >
                          <span className="material-symbols-outlined text-sm sm:text-base">
                            edit
                          </span>
                          Edit
                        </button>
                        <button
                          onClick={() => handlePublish(course.id)}
                          className="flex-1 min-w-[80px] px-3 py-2 bg-white/5 hover:bg-blue-500/20 text-white text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2"
                        >
                          <span className="material-symbols-outlined text-sm sm:text-base">
                            {course.status === "Ongoing" ||
                            course.status === "published"
                              ? "unpublished"
                              : "publish"}
                          </span>
                          {course.status === "Ongoing" ||
                          course.status === "published"
                            ? "Unpub"
                            : "Pub"}
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center"
                          title="Delete Course"
                        >
                          <span className="material-symbols-outlined text-sm sm:text-base">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
    </InstructorLayout>
    <ConfirmModal
      isOpen={confirmConfig.isOpen}
      onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      onConfirm={confirmConfig.onConfirm}
      title={confirmConfig.title}
      message={confirmConfig.message}
    />
    </>
  );
}
