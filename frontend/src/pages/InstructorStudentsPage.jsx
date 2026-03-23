import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import InstructorLayout from "../components/InstructorLayout";

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
    <InstructorLayout
      title="Students"
      subtitle="Manage and track your students' progress"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 mb-8">
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <span className="material-symbols-outlined text-cyan-400">people</span>
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Students</span>
          </div>
          <p className="text-3xl font-black text-white">{students.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <span className="material-symbols-outlined text-purple-400">school</span>
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Courses</span>
          </div>
          <p className="text-3xl font-black text-white">{courses.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <span className="material-symbols-outlined text-emerald-400">trending_up</span>
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Completion</span>
          </div>
          <p className="text-3xl font-black text-white">
            {students.length > 0
              ? Math.round(
                  students.reduce((sum, s) => sum + (s.completionPercent || 0), 0) /
                    students.length
                )
              : 0}%
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Loading roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-6xl text-slate-700 block mb-4">person_off</span>
            <h3 className="text-xl font-bold text-white mb-2">No students found</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              {selectedCourse !== "all"
                ? "There are no students currently enrolled in this specific course."
                : "You don't have any students enrolled in your courses yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Student</th>
                  <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Email</th>
                  <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Course</th>
                  <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled</th>
                  <th className="text-left px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student, idx) => (
                  <tr
                    key={`${student.userId}-${student.courseId}-${idx}`}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={student.avatar || "https://via.placeholder.com/40?text=U"}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/5 group-hover:border-purple-500/50 transition-all"
                        />
                        <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-400">{student.email}</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1.5 bg-purple-500/10 text-purple-300 text-xs font-black rounded-lg border border-purple-500/20">
                        {student.courseTitle}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-400 font-medium">
                      {new Date(student.enrolledAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-1000"
                            style={{ width: `${student.completionPercent || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-slate-300">
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
    </InstructorLayout>
  );
}
