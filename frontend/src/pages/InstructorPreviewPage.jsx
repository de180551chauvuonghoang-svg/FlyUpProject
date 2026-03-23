import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InstructorPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_URL}/courses/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error("Course not found");

        const data = await res.json();
        const courseData = data.data || data;
        setCourse(courseData);

        // Auto-select first lecture
        if (courseData.Sections?.length > 0) {
          const firstLecture = courseData.Sections[0]?.Lectures?.[0];
          if (firstLecture) {
            setSelectedLessonId(firstLecture.Id);
          }
        }
      } catch (err) {
        console.error("Failed to load course:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id, accessToken]);

  // Reset video error when changing lesson
  useEffect(() => {
    setVideoLoadFailed(false);
  }, [selectedLessonId]);

  // Find current lesson from sections
  const findCurrentLesson = () => {
    if (!course?.Sections || !selectedLessonId) return null;
    for (const section of course.Sections) {
      const lecture = section.Lectures?.find((l) => l.Id === selectedLessonId);
      if (lecture) {
        // Normalize video URL and materials
        const rawMaterials = lecture.LectureMaterial || [];
        const videoMaterial = rawMaterials.find(
          (m) => (m.Type || "").toLowerCase() === "video"
        );
        const docMaterials = rawMaterials.filter(
          (m) => (m.Type || "").toLowerCase() !== "video"
        );

        return {
          Id: lecture.Id,
          Title: lecture.Title,
          Content: lecture.Content || "No content available for this lesson.",
          SectionTitle: section.Title,
          VideoUrl:
            lecture.VideoUrl || lecture.videoUrl || videoMaterial?.Url || null,
          Materials:
            lecture.Materials ||
            docMaterials.map((m) => ({
              Id: m.Id,
              Type: m.Type,
              Url: m.Url,
              Name: m.Name || m.Type || "Material",
            })),
        };
      }
    }
    return null;
  };

  const currentLesson = findCurrentLesson();

  // Helper functions
  const getMaterialIcon = (type) => {
    const map = {
      pdf: "picture_as_pdf",
      docx: "description",
      doc: "description",
      pptx: "slideshow",
      ppt: "slideshow",
      xlsx: "table_chart",
      xls: "table_chart",
      zip: "folder_zip",
      txt: "text_snippet",
      document: "description",
    };
    return map[type?.toLowerCase()] || "insert_drive_file";
  };

  const getMaterialColor = (type) => {
    const map = {
      pdf: "text-red-500",
      docx: "text-blue-400",
      doc: "text-blue-400",
      pptx: "text-orange-400",
      ppt: "text-orange-400",
      xlsx: "text-green-400",
      xls: "text-green-400",
      document: "text-blue-400",
    };
    return map[type?.toLowerCase()] || "text-slate-400";
  };

  const totalLectures = course?.Sections?.reduce(
    (sum, s) => sum + (s.Lectures?.length || 0),
    0
  ) || 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-[#0a0a14] items-center justify-center">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="material-symbols-outlined text-purple-500 text-2xl animate-pulse">
              preview
            </span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Loading Preview...</h3>
            <p className="text-slate-400 text-sm">Preparing course content</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="flex h-screen w-full bg-[#0a0a14] items-center justify-center">
        <div className="flex flex-col items-center gap-6 p-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/20 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          </div>
          <h3 className="text-xl font-bold text-white">Cannot Load Course</h3>
          <p className="text-slate-400 text-sm">{error || "Course not found"}</p>
          <button
            onClick={() => navigate("/instructor/dashboard")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No sections
  if (!course.Sections || course.Sections.length === 0) {
    return (
      <div className="flex h-screen w-full bg-[#0a0a14] items-center justify-center">
        <div className="flex flex-col items-center gap-6 p-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-amber-500/20 max-w-md text-center">
          <span className="material-symbols-outlined text-5xl text-amber-500">info</span>
          <h3 className="text-xl font-bold text-white">No Content Yet</h3>
          <p className="text-slate-400 text-sm">
            This course doesn't have any sections or lectures yet. Add content in the edit page.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/edit-course/${id}`)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all"
            >
              Edit Course
            </button>
            <button
              onClick={() => navigate("/instructor/dashboard")}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a14]">
      {/* Preview Mode Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-center py-2 px-4 font-bold text-sm flex items-center justify-center gap-3 shadow-lg">
        <span className="material-symbols-outlined text-lg">visibility</span>
        PREVIEW MODE — This is how students will see your course
        <button
          onClick={() => navigate("/instructor/dashboard")}
          className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-xs font-bold transition-all"
        >
          ✕ Exit Preview
        </button>
      </div>

      {/* Left Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-[340px]" : "w-0"} flex-shrink-0 flex flex-col bg-[#0d0d1a]/95 backdrop-blur-xl border-r border-white/5 h-full pt-10 transition-all overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[#130d1a]/50">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-8 w-auto">
                <img
                  src="/FlyUpTeam.png"
                  alt="FlyUp Logo"
                  className="h-full w-auto object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <h2 className="text-white text-xl font-bold tracking-tight group-hover:text-purple-400 transition-colors">
                FlyUp
              </h2>
            </Link>
            <button
              onClick={() => navigate("/instructor/dashboard")}
              className="size-8 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
          </div>

          <h3 className="text-white text-lg font-bold leading-tight mb-2">
            {course.Title}
          </h3>

          {/* Course Info */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">school</span>
              {course.Sections.length} sections
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">video_library</span>
              {totalLectures} lectures
            </span>
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                course.Status === "Ongoing"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {course.Status === "Ongoing" ? "check_circle" : "edit"}
              </span>
              {course.Status || "Draft"}
            </span>
          </div>
        </div>

        {/* Scrollable Section/Lecture Tree */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
          {course.Sections.map((section, sIdx) => (
            <div key={section.Id} className="group">
              {/* Section Header */}
              <div className="flex items-center gap-2 px-2 py-2 mb-1 text-xs font-semibold uppercase tracking-wider text-purple-400">
                <span className="text-slate-500 mr-1">{sIdx + 1}.</span>
                {section.Title}
              </div>

              {/* Lectures */}
              <div className="flex flex-col gap-1 relative pl-3 border-l border-purple-500/20 ml-3">
                {(section.Lectures || []).length === 0 ? (
                  <div className="text-xs text-slate-600 py-2 pl-3 italic">
                    No lectures in this section
                  </div>
                ) : (
                  section.Lectures.map((lecture, lIdx) => {
                    const isActive = lecture.Id === selectedLessonId;
                    return (
                      <button
                        key={lecture.Id}
                        className={`relative flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all ${
                          isActive
                            ? "bg-purple-500/10 border border-purple-500/20"
                            : "hover:bg-white/5"
                        }`}
                        onClick={() => setSelectedLessonId(lecture.Id)}
                      >
                        {/* Dot indicator on the border line */}
                        <div
                          className={`absolute -left-[19px] top-1/2 -translate-y-1/2 size-2.5 rounded-full ${
                            isActive
                              ? "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,1)] ring-2 ring-[#0a0a14] size-3"
                              : "bg-slate-700"
                          }`}
                        ></div>

                        <span
                          className={`material-symbols-outlined text-[20px] ${
                            isActive
                              ? "text-purple-500 animate-pulse"
                              : "text-slate-400"
                          }`}
                        >
                          {isActive ? "play_circle" : "radio_button_unchecked"}
                        </span>

                        <div className="flex-1 flex flex-col">
                          <span
                            className={`text-sm ${
                              isActive
                                ? "font-medium text-white"
                                : "text-slate-300"
                            }`}
                          >
                            <span className="text-slate-500 text-xs mr-1">
                              {lIdx + 1}.
                            </span>
                            {lecture.Title}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Lecture
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#130d1a]/50">
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/edit-course/${id}`)}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Course
            </button>
            <button
              onClick={() => navigate("/instructor/dashboard")}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              Dashboard
            </button>
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-slate-800/80 hover:bg-purple-600 text-white p-1.5 rounded-r-lg transition-all"
        style={{ left: sidebarOpen ? "340px" : "0" }}
      >
        <span className="material-symbols-outlined text-sm">
          {sidebarOpen ? "chevron_left" : "chevron_right"}
        </span>
      </button>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pt-10 relative" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0a14]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]"></div>

        <div className="relative z-10 container mx-auto max-w-5xl px-8 py-8 flex flex-col gap-8">
          {/* Breadcrumbs */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <button
                onClick={() => navigate("/instructor/dashboard")}
                className="hover:text-purple-400 transition-colors"
              >
                Dashboard
              </button>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-slate-300">{course.Title}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-white font-medium">
                {currentLesson?.Title || "Select a lecture"}
              </span>
            </div>
          </div>

          {/* Video Player */}
          <div
            className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-white/10 relative group"
          >
            {currentLesson?.VideoUrl && !videoLoadFailed ? (
              <video
                key={currentLesson.VideoUrl}
                className="w-full h-full object-cover"
                controls
                controlsList="nodownload"
                preload="auto"
                onError={() => setVideoLoadFailed(true)}
              >
                <source src={currentLesson.VideoUrl} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="size-20 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 mb-4">
                  <span className="material-symbols-outlined text-slate-400 text-[48px]">
                    {currentLesson ? "videocam_off" : "touch_app"}
                  </span>
                </div>
                <p className="text-slate-400 text-lg font-medium">
                  {currentLesson
                    ? "No video uploaded for this lecture"
                    : "Select a lecture from the sidebar"}
                </p>
                {currentLesson && (
                  <p className="text-slate-500 text-sm mt-2">
                    Upload a video in the Edit Course page
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lesson Title & Actions */}
          {currentLesson && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {currentLesson.Title}
                </h1>
                <p className="text-slate-400 text-sm">
                  Section: {currentLesson.SectionTitle}
                </p>
              </div>
              <button
                onClick={() => navigate(`/edit-course/${id}`)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-white/10"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit This Lecture
              </button>
            </div>
          )}

          {/* Tabs */}
          {currentLesson && (
            <div className="flex flex-col gap-6">
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === "overview"
                      ? "text-purple-400 border-purple-500"
                      : "text-slate-400 hover:text-white border-transparent"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === "resources"
                      ? "text-purple-400 border-purple-500"
                      : "text-slate-400 hover:text-white border-transparent"
                  }`}
                >
                  Resources
                  <span className="bg-slate-800 text-xs px-1.5 rounded-sm">
                    {currentLesson.Materials?.length || 0}
                  </span>
                </button>
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-8 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">
                    About this lecture
                  </h3>
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {currentLesson.Content}
                  </div>

                  {currentLesson.SectionTitle && (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-white/10 flex items-center gap-4 mt-6">
                      <div className="size-12 rounded bg-[#1e1e2e] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-purple-400">folder</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white font-medium">Section</h5>
                        <p className="text-slate-400 text-sm">{currentLesson.SectionTitle}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/50 rounded-lg p-4 border border-white/10 flex items-center gap-4 mt-3">
                    <div className="size-12 rounded bg-[#1e1e2e] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-blue-400">folder</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white font-medium">Lesson Resources</h5>
                      <p className="text-slate-400 text-sm">
                        {currentLesson.Materials?.length > 0
                          ? `${currentLesson.Materials.length} file(s) available`
                          : "No materials uploaded for this lesson"}
                      </p>
                    </div>
                    {currentLesson.Materials?.length > 0 && (
                      <button
                        onClick={() => setActiveTab("resources")}
                        className="text-sm font-medium text-white hover:text-purple-400 transition-colors flex items-center gap-1"
                      >
                        View All
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === "resources" && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-8 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Lecture Resources
                  </h3>
                  {currentLesson.Materials && currentLesson.Materials.length > 0 ? (
                    <div className="space-y-3">
                      {currentLesson.Materials.map((material, index) => {
                        const fileName = material.Url?.split("/").pop() || "File";
                        return (
                          <div
                            key={material.Id || index}
                            className="flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={getMaterialColor(material.Type)}>
                                <span className="material-symbols-outlined text-[32px]">
                                  {getMaterialIcon(material.Type)}
                                </span>
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-white font-medium truncate">
                                  {material.Name || material.Type || "Material"}
                                </span>
                                <span className="text-slate-400 text-sm truncate">
                                  {fileName}
                                </span>
                              </div>
                            </div>
                            <a
                              href={material.Url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                              <span className="text-sm font-medium">View</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">
                        folder_open
                      </span>
                      <p className="text-slate-400 text-lg font-medium mb-2">
                        No resources uploaded
                      </p>
                      <p className="text-slate-500 text-sm">
                        Upload materials in the Edit Course page
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No lesson selected */}
          {!currentLesson && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-7xl text-slate-700 mb-4">
                touch_app
              </span>
              <h3 className="text-xl font-bold text-white mb-2">
                Select a Lecture
              </h3>
              <p className="text-slate-400">
                Choose a lecture from the sidebar to preview its content
              </p>
            </div>
          )}

          {/* Footer */}
          <footer className="py-8 text-center text-slate-500 text-sm">
            © 2025 FlyUp Inc. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}
