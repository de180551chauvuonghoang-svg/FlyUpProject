import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import InstructorSidebar from "../components/InstructorSidebar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InstructorStudentsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

  // Fetch instructor's courses for filter dropdown
  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/courses/instructor/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };
    fetchCourses();
  }, [user]);

  // Fetch students
  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const params = selectedCourse !== "all" ? `?courseId=${selectedCourse}` : "";
        const res = await fetch(`${API_URL}/courses/instructor/students${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStudents(data.data || []);
        } else {
          toast.error("Failed to fetch students");
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast.error("Failed to load students");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [user, selectedCourse]);

  // Export Excel
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const params = selectedCourse !== "all" ? `?courseId=${selectedCourse}` : "";
      const res = await fetch(`${API_URL}/courses/instructor/students/export${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `students_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Excel exported successfully!");
      } else {
        toast.error("Failed to export");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-display overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 blur-3xl"></div>
      </div>

      <InstructorSidebar />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-950/40">
          <div className="px-6 lg:px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-400">group</span>
                Students
              </h1>
              <p className="text-slate-400 mt-1">
                Manage and track your students' progress
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Course Filter */}
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="bg-slate-900">
                    {course.title}
                  </option>
                ))}
              </select>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                <span className="material-symbols-outlined text-sm">
                  {isExporting ? "hourglass_empty" : "download"}
                </span>
                {isExporting ? "Exporting..." : "Export Excel"}
              </button>
            </div>
          </div>
        </header>

        {/* Students Table */}
        <div className="px-6 lg:px-10 py-8">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <span className="material-symbols-outlined text-cyan-400">people</span>
                </div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Students</span>
              </div>
              <p className="text-3xl font-bold text-white">{students.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <span className="material-symbols-outlined text-purple-400">school</span>
                </div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Courses</span>
              </div>
              <p className="text-3xl font-bold text-white">{courses.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <span className="material-symbols-outlined text-emerald-400">trending_up</span>
                </div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Completion</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {students.length > 0
                  ? Math.round(
                      students.reduce((sum, s) => sum + (s.completionPercent || 0), 0) /
                        students.length
                    )
                  : 0}%
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading students...</p>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-700 block mb-4">person_off</span>
                <h3 className="text-xl font-bold text-white mb-2">No students found</h3>
                <p className="text-slate-400">
                  {selectedCourse !== "all"
                    ? "No students enrolled in this course yet."
                    : "You don't have any students yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Student</th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Email</th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Course</th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled</th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr
                        key={`${student.userId}-${student.courseId}-${idx}`}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar || "https://via.placeholder.com/40?text=U"}
                              alt={student.name}
                              className="w-9 h-9 rounded-full object-cover border border-white/10"
                            />
                            <span className="text-sm font-semibold text-white">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{student.email}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-purple-300 font-medium">{student.courseTitle}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(student.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all"
                                style={{ width: `${student.completionPercent || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                              {student.completionPercent || 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
