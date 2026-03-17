import { useParams, useNavigate } from "react-router-dom";
import { CourseUpdateForm } from "../components/CourseUpdateForm";

export default function EditCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to dashboard after successful update
    setTimeout(() => {
      navigate("/instructor-dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-display">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-slate-950/40">
        <div className="px-6 lg:px-10 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/instructor-dashboard")}
              className="p-2 hover:bg-white/5 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Course</h1>
              <p className="text-slate-400 text-sm mt-1">
                Update course content and add new lectures
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            <CourseUpdateForm courseId={courseId} onSuccess={handleSuccess} />
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  );
}
