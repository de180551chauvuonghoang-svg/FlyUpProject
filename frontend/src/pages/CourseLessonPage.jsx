import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import Quiz from "../components/Quiz";
import {
  fetchCourseLessons,
  fetchEnrollmentProgress,
} from "../services/lessonService";

// Mock data for demonstration
const MOCK_COURSE = {
  Id: "course-001",
  Title: "Advanced JavaScript Mastery",
  Sections: [
    {
      Id: "section-001",
      Title: "Section 1: Fundamentals",
      Index: 0,
      Lectures: [
        { Id: "lecture-001", Title: "What is JavaScript?" },
        { Id: "lecture-002", Title: "Setup Your Environment" },
        { Id: "lecture-003", Title: "Variables & Data Types" },
      ],
    },
    {
      Id: "section-002",
      Title: "Section 2: Functions",
      Index: 1,
      Lectures: [
        { Id: "lecture-004", Title: "Function Basics" },
        { Id: "lecture-005", Title: "Arrow Functions" },
        { Id: "lecture-006", Title: "Closures & Scope" },
      ],
    },
    {
      Id: "section-003",
      Title: "Section 3: Async Programming",
      Index: 2,
      Lectures: [
        { Id: "lecture-007", Title: "Promises" },
        { Id: "lecture-008", Title: "Async/Await" },
        { Id: "lecture-009", Title: "Error Handling" },
      ],
    },
  ],
  LectureCount: 9,
};

const MOCK_ENROLLMENT = {
  LectureMilestones: JSON.stringify(["lecture-001", "lecture-002"]),
};

const MOCK_CURRENT_LESSON = {
  Id: "lecture-003",
  Title: "Variables & Data Types",
  Content: `In this comprehensive lesson, you'll learn about JavaScript variables and the various data types available. We'll cover:
  
  • var, let, and const declarations
  • The differences between these declarations
  • Primitive data types (string, number, boolean, null, undefined, symbol)
  • Reference data types (objects, arrays)
  • Type coercion and comparison
  • Best practices for variable naming
  
  By the end of this lesson, you'll have a solid understanding of how to properly declare and use variables in your JavaScript applications.`,
};

export default function CourseLessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLessonId, setSelectedLessonId] = useState(
    lessonId || "lecture-003",
  );
  const [isInstructorPreview, setIsInstructorPreview] = useState(false);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [, setIsVideoPlaying] = useState(false);

  const normalizeLectureAssets = (lecture) => {
    const transformedMaterials = Array.isArray(lecture?.Materials)
      ? lecture.Materials
      : [];
    const rawMaterials = Array.isArray(lecture?.LectureMaterial)
      ? lecture.LectureMaterial
      : [];

    const latestRawVideo = rawMaterials
      .filter((m) => (m?.Type || m?.type || "").toLowerCase() === "video")
      .sort((a, b) =>
        Number(a?.Id || a?.id || 0) > Number(b?.Id || b?.id || 0) ? 1 : -1,
      )
      .at(-1);

    const normalizedMaterials =
      transformedMaterials.length > 0
        ? transformedMaterials.map((m, index) => ({
            Id: m?.Id ?? m?.id ?? index,
            Type: (m?.Type || m?.type || "document").toLowerCase(),
            Url: m?.Url || m?.url || "",
            Name: m?.Name || m?.name || null,
          }))
        : rawMaterials
            .filter((m) => (m?.Type || m?.type || "").toLowerCase() !== "video")
            .map((m, index) => ({
              Id: m?.Id ?? m?.id ?? index,
              Type: (m?.Type || m?.type || "document").toLowerCase(),
              Url: m?.Url || m?.url || "",
              Name: m?.Name || m?.name || null,
            }));

    return {
      videoUrl:
        lecture?.VideoUrl ||
        lecture?.videoUrl ||
        latestRawVideo?.Url ||
        latestRawVideo?.url ||
        null,
      materials: normalizedMaterials.filter((m) => m.Url),
    };
  };

  // Check if this is instructor preview mode
  // NEVER use instructor preview in CourseLessonPage - it's for enrolled students only
  // Instructors should use the instructor dashboard to preview their courses
  useEffect(() => {
    const checkInstructorPreview = () => {
      // Always set to false - this page is for enrolled students
      const shouldPreview = false;
      console.log("[CourseLessonPage] Instructor preview check:", {
        user: user?.id,
        isInstructor:
          user?.instructor ||
          user?.instructorId ||
          (user?.role || user?.Role || "").trim().toLowerCase() ===
            "instructor",
        lessonId,
        shouldPreview,
        note: "Always false - use instructor dashboard for preview",
      });
      setIsInstructorPreview(shouldPreview);
    };
    checkInstructorPreview();
  }, [user, lessonId]);

  // Fetch course data
  const {
    data: courseResponse,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ["courseLessons", courseId, isInstructorPreview],
    queryFn: () => {
      console.log(
        "[CourseLessonPage] Fetching course:",
        courseId,
        "isInstructorPreview:",
        isInstructorPreview,
      );
      return fetchCourseLessons(courseId, isInstructorPreview);
    },
    enabled: !!courseId && courseId !== "demo",
    retry: 1,
    onError: (error) => {
      console.error("[CourseLessonPage] Query error:", error);
    },
    onSuccess: (data) => {
      console.log("[CourseLessonPage] Query success:", data);
    },
  });

  // Fetch enrollment progress
  const { data: enrollmentData } = useQuery({
    queryKey: ["enrollmentProgress", courseId, user?.id],
    queryFn: () => fetchEnrollmentProgress(user?.id, courseId),
    enabled: !!courseId && !!user?.id && courseId !== "demo",
  });

  // Use mock data if in demo mode or if no real data
  const course =
    courseId === "demo" ? MOCK_COURSE : courseResponse?.data || courseResponse;
  const enrollment = courseId === "demo" ? MOCK_ENROLLMENT : enrollmentData;
  const currentLessonId = selectedLessonId || lessonId;

  // Debug logging
  useEffect(() => {
    console.log("[CourseLessonPage] Course data:", course);
    console.log("[CourseLessonPage] Enrollment data:", enrollment);
    console.log("[CourseLessonPage] courseId:", courseId);
    console.log("[CourseLessonPage] user:", user);
  }, [course, enrollment, courseId, user]);

  // Find the current lesson from sections
  const findLessonInSections = (sections, lectureId) => {
    if (!sections) return null;
    for (const section of sections) {
      const lecture = section.Lectures?.find((l) => l.Id === lectureId);
      if (lecture) {
        const assets = normalizeLectureAssets(lecture);
        return {
          Id: lecture.Id,
          Title: lecture.Title,
          Content:
            lecture.Content || "No content available for this lesson yet.",
          IsPreviewable: lecture.IsPreviewable,
          SectionTitle: section.Title,
          VideoUrl: assets.videoUrl,
          Materials: assets.materials,
        };
      }
    }
    // Return null if not found instead of mock data
    return null;
  };

  useEffect(() => {
    if (!lessonId && course?.Sections && course.Sections.length > 0) {
      const firstLecture = course.Sections[0]?.Lectures?.[0];
      if (firstLecture?.Id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedLessonId(firstLecture.Id);
      }
    }
  }, [course?.Sections, lessonId]);

  const currentLesson = findLessonInSections(course?.Sections, currentLessonId);

  useEffect(() => {
    // Reset video error state when changing lesson/video URL
    setVideoLoadFailed(false);
  }, [currentLessonId, currentLesson?.VideoUrl]);

  // Calculate progress
  const calculateProgress = () => {
    if (!enrollment) return 0;
    const completedLectures = JSON.parse(
      enrollment.LectureMilestones || "[]",
    ).length;
    const totalLectures = course?.LectureCount || 1;
    return Math.round((completedLectures / totalLectures) * 100);
  };

  // Get material icon based on type
  const getMaterialIcon = (type) => {
    const iconMap = {
      video: "play_circle",
      pdf: "picture_as_pdf",
      docx: "description",
      doc: "description",
      pptx: "slideshow",
      ppt: "slideshow",
      xlsx: "table_chart",
      xls: "table_chart",
      zip: "folder_zip",
      txt: "text_snippet",
    };
    return iconMap[type?.toLowerCase()] || "insert_drive_file";
  };

  // Get material color based on type
  const getMaterialColor = (type) => {
    const colorMap = {
      video: "text-red-400",
      pdf: "text-red-500",
      docx: "text-blue-400",
      doc: "text-blue-400",
      pptx: "text-orange-400",
      ppt: "text-orange-400",
      xlsx: "text-green-400",
      xls: "text-green-400",
      zip: "text-yellow-400",
      txt: "text-slate-400",
    };
    return colorMap[type?.toLowerCase()] || "text-slate-400";
  };

  // Get friendly name for material type
  const getMaterialTypeName = (type) => {
    const nameMap = {
      video: "Video",
      pdf: "PDF Document",
      docx: "Word Document",
      doc: "Word Document",
      pptx: "PowerPoint",
      ppt: "PowerPoint",
      xlsx: "Excel Spreadsheet",
      xls: "Excel Spreadsheet",
      zip: "ZIP Archive",
      txt: "Text File",
    };
    return nameMap[type?.toLowerCase()] || type?.toUpperCase() || "File";
  };

  // Transform sections for the sidebar
  const transformSections = (sections, enrollment) => {
    if (!sections) return [];
    const completedLectures =
      JSON.parse(enrollment?.LectureMilestones || "[]") || [];

    return sections.map((section, idx) => ({
      title: section.Title,
      sectionNumber: idx + 1,
      status: section.Lectures?.every((l) => completedLectures.includes(l.Id))
        ? "completed"
        : section.Lectures?.some((l) => completedLectures.includes(l.Id))
          ? "in-progress"
          : idx > 0
            ? "locked"
            : "in-progress",
      items:
        section.Lectures?.map((lecture, lecIdx) => ({
          id: lecture.Id,
          title: lecture.Title,
          lectureNumber: lecIdx + 1,
          content: lecture.Content,
          isPreviewable: lecture.IsPreviewable,
          status: completedLectures.includes(lecture.Id)
            ? "completed"
            : lecture.Id === currentLessonId
              ? "active"
              : idx > 0
                ? "locked"
                : "pending",
          duration: `${Math.ceil(Math.random() * 15 + 5)} min`,
          type: "Video",
        })) || [],
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "check_circle";
      case "active":
        return "play_circle";
      case "locked":
        return "lock";
      case "pending":
        return "radio_button_unchecked";
      default:
        return "radio_button_unchecked";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "active":
        return "text-primary animate-pulse";
      case "locked":
        return "text-slate-500";
      case "pending":
        return "text-slate-400";
      default:
        return "text-slate-400";
    }
  };

  const getSectionBorderColor = (status) => {
    switch (status) {
      case "in-progress":
        return "border-primary/30 text-primary";
      case "completed":
        return "border-slate-800 text-slate-400";
      case "locked":
        return "border-slate-800 text-slate-500";
      default:
        return "border-slate-800 text-slate-400";
    }
  };

  // Loading state
  if (courseLoading) {
    return (
      <div className="flex h-screen w-full bg-[#0a0a14] items-center justify-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex flex-col items-center gap-6 p-8 relative z-10">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
            <span className="material-symbols-outlined text-primary text-2xl animate-pulse">
              menu_book
            </span>
          </div>
          <div className="flex flex-col items-center text-center max-w-sm">
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              Đang tải bài học...
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Vui lòng đợi trong giây lát, hệ thống đang chuẩn bị nội dung khóa
              học cho bạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="flex h-screen w-full bg-[#0a0a14] items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col items-center gap-6 p-8 bg-[#130d1a]/80 backdrop-blur-xl rounded-3xl border border-red-500/20 max-w-md text-center shadow-2xl relative z-10 w-full mx-4">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-2 ring-8 ring-red-500/5">
            <span className="material-symbols-outlined text-5xl text-red-500">
              error_outline
            </span>
          </div>
          <div>
            <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">
              Không thể tải khóa học
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 px-4">
              Đã xảy ra lỗi khi tải dữ liệu khóa học. Vui lòng thử lại sau hoặc
              quay về trang My Learning.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                refresh
              </span>
              Thử lại
            </button>
            <button
              onClick={() => navigate("/my-learning")}
              className="flex-1 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_back
              </span>
              Quay về
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sections = transformSections(course?.Sections, enrollment);
  const progress = calculateProgress();

  // Debug: Log render state
  console.log("[CourseLessonPage] Render state:", {
    courseLoading,
    courseError,
    course: course?.Title,
    sections: sections?.length,
    courseId,
  });

  // Check if course has no sections
  if (
    !courseLoading &&
    course &&
    (!course.Sections || course.Sections.length === 0)
  ) {
    return (
      <div className="flex h-screen w-full bg-background-light dark:bg-background-dark items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-slate-900/50 rounded-lg border border-amber-500/20 max-w-md">
          <span className="material-symbols-outlined text-4xl text-amber-500">
            info
          </span>
          <p className="text-white font-bold">No lessons yet</p>
          <p className="text-slate-400 text-sm text-center">
            This course doesn't have any sections or lessons yet.
          </p>
          <button
            onClick={() => navigate("/my-learning")}
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-purple-600"
          >
            Back to My Learning
          </button>
        </div>
      </div>
    );
  }

  // Debug: Check if currentLesson exists
  console.log("[CourseLessonPage] currentLesson:", currentLesson);
  console.log(
    "[CourseLessonPage] courseId:",
    courseId,
    "lessonId:",
    lessonId,
    "selectedLessonId:",
    selectedLessonId,
    "currentLessonId:",
    currentLessonId,
  );

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
      {/* Left Sidebar */}
      <aside className="w-[340px] flex-shrink-0 flex flex-col glass-panel border-r border-glass-border h-full relative z-20">
        {/* Header Area */}
        <div className="p-6 border-b border-glass-border bg-[#130d1a]/50">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-8 w-auto">
                <img
                  src="/FlyUpTeam.png"
                  alt="FlyUp Logo"
                  className="h-full w-auto object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <h2 className="text-white text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                FlyUp
              </h2>
            </Link>
            <button
              onClick={() => navigate("/")}
              className="size-8 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Back to Home"
            >
              <span className="material-symbols-outlined text-[18px]">
                home
              </span>
            </button>
          </div>
          <h3 className="text-white text-xl font-bold leading-tight mb-3">
            {course?.Title || "Loading..."}
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-slate-300">
                Course Progress
              </span>
              <span className="text-sm font-bold text-primary">
                {progress}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Scrollable Course Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="group">
              <div
                className={`flex items-center gap-3 px-2 py-2 mb-1 text-xs font-semibold uppercase tracking-wider ${getSectionBorderColor(section.status)}`}
              >
                <span className="text-slate-500 mr-1">
                  {section.sectionNumber}.
                </span>
                {section.title}
              </div>
              <div
                className={`flex flex-col gap-1 relative pl-3 border-l ml-3 ${getSectionBorderColor(section.status)}`}
              >
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    className={`relative flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all ${
                      item.status === "active"
                        ? "bg-primary/10 border border-primary/20 shadow-inner"
                        : item.status === "locked"
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-white/5"
                    }`}
                    onClick={() => {
                      if (item.status !== "locked") {
                        setSelectedLessonId(item.id);
                      }
                    }}
                  >
                    <div
                      className={`absolute -left-[19px] top-1/2 -translate-y-1/2 size-2.5 rounded-full ${
                        item.status === "completed"
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                          : item.status === "active"
                            ? "bg-primary shadow-[0_0_12px_rgba(168,85,247,1)] ring-2 ring-[#0a0a14] size-3"
                            : "bg-slate-700"
                      }`}
                    ></div>

                    <span
                      className={`material-symbols-outlined text-[20px] ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                    </span>

                    <div className="flex-1 flex flex-col">
                      <span
                        className={`text-sm ${
                          item.status === "active"
                            ? "font-medium text-white"
                            : item.status === "completed"
                              ? "text-slate-300 line-through decoration-slate-600"
                              : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        <span className="text-slate-500 text-xs mr-1">
                          {item.lectureNumber}.
                        </span>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {item.duration} • {item.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-glass-border bg-[#130d1a]/50">
          <div className="flex items-center gap-3">
            {user?.Avatar && (
              <div
                className="size-9 rounded-full bg-center bg-cover border border-glass-border"
                style={{ backgroundImage: `url('${user.Avatar}')` }}
              ></div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {user?.FullName || "Student"}
              </span>
              <span className="text-xs text-slate-400">Learner</span>
            </div>
            <button className="ml-auto text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative z-10">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2072&auto=format&fit=crop")',
          }}
        ></div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#0a0a14]/90 z-0"></div>

        <div className="relative z-10 container mx-auto max-w-5xl px-8 py-8 flex flex-col gap-8">
          {/* Breadcrumbs & Nav */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <a
                href="/my-learning"
                className="hover:text-primary transition-colors"
              >
                Courses
              </a>
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
              <a href="#" className="hover:text-primary transition-colors">
                {course?.Title}
              </a>
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
              <span className="text-white font-medium">
                {currentLesson?.Title || "Lesson"}
              </span>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  help
                </span>
                Get Help
              </button>
            </div>
          </div>

          {/* Video Player Container */}
          <div
            className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-primary/10 border border-glass-border relative group cursor-pointer"
            onMouseEnter={() => setIsVideoPlaying(true)}
            onMouseLeave={() => setIsVideoPlaying(false)}
          >
            {currentLesson?.VideoUrl && !videoLoadFailed ? (
              <>
                {/* HTML5 Video Player */}
                <video
                  key={currentLesson.VideoUrl}
                  className="w-full h-full object-cover"
                  controls
                  controlsList="nodownload"
                  preload="auto"
                  autoPlay
                  muted
                  onError={(e) => {
                    console.error("Video error:", e);
                    console.error("Failed URL:", currentLesson.VideoUrl);
                    console.error("Error details:", e.target.error);
                    setVideoLoadFailed(true);
                  }}
                  onLoadedMetadata={() => {
                    console.log(
                      "Video loaded successfully:",
                      currentLesson.VideoUrl,
                    );
                  }}
                  onCanPlay={() => {
                    console.log("Video can play");
                  }}
                >
                  <source src={currentLesson.VideoUrl} />
                  Your browser does not support the video tag.
                </video>
              </>
            ) : (
              <>
                {/* Placeholder when no video */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrH1bYAvV9jkXKrkBtFVsxeovu1Mf50xCnf21UNgs0nVONHxAUGcUXxt1-fEec4DMA9gO0QKwXTPw9FRgmX34EO0Ol_sfhZlh0GPasmaQcPC4ZWoWGhN2tSs_dpVDAfJIw3_rQIX2GD74V7GkH-gVN27NGKs23u_spTgR7IbpkrGd8KXv8JP-rsMhKPwkorNqIwfWy3xDYgSf3bXQzePwg1Loeii9IBT8yQTDO2nx0hSkwChnBdlbGUW8LHTPt2nVE4pOoagc9x94")',
                  }}
                ></div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-all">
                  <div className="size-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300 flex-col">
                    <span className="material-symbols-outlined text-white text-[48px] ml-1">
                      play_arrow
                    </span>
                    <span className="text-white text-xs mt-2 text-center px-4">
                      Video coming soon
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-glass-border">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {currentLesson?.Title || "Lesson"}
              </h1>
              <p className="text-slate-400 text-sm">Last updated 2 days ago</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none h-11 px-6 rounded-lg border border-slate-600 text-white font-medium hover:bg-white/5 hover:border-slate-500 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  check_circle
                </span>
                Mark as Complete
              </button>
              <button className="flex-1 md:flex-none h-11 px-6 rounded-lg bg-primary text-white font-bold hover:bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2">
                Next Lecture
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="flex flex-col gap-6">
            {/* Tabs Navigation */}
            <div className="flex border-b border-glass-border">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "overview"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("resources")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "resources"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Resources{" "}
                <span className="bg-slate-800 text-xs px-1.5 rounded-sm">
                  {currentLesson?.Materials?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("qa")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "qa"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Q&A{" "}
                <span className="bg-slate-800 text-xs px-1.5 rounded-sm">
                  12
                </span>
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${
                  activeTab === "notes"
                    ? "text-primary border-primary"
                    : "text-slate-400 hover:text-white border-transparent"
                }`}
              >
                Notes
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="glass-panel rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">
                  About this lecture
                </h3>
                <div className="prose prose-invert max-w-none">
                  <div className="text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">
                    {currentLesson?.Content || "No description available"}
                  </div>
                </div>

                <h4 className="text-md font-bold text-white mb-3 mt-8">
                  What you'll learn
                </h4>
                <ul className="space-y-3 mb-8">
                  <li className="flex gap-3 items-start text-slate-300">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                      check
                    </span>
                    <span>Master the concepts introduced in this lecture</span>
                  </li>
                  <li className="flex gap-3 items-start text-slate-300">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                      check
                    </span>
                    <span>Apply what you've learned to practical examples</span>
                  </li>
                  <li className="flex gap-3 items-start text-slate-300">
                    <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                      check
                    </span>
                    <span>Build a solid foundation for the next lessons</span>
                  </li>
                </ul>

                {currentLesson?.SectionTitle && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-glass-border flex items-center gap-4 mb-4">
                    <div className="size-12 rounded bg-[#1e1e2e] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-purple-400">
                        folder
                      </span>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white font-medium">Section</h5>
                      <p className="text-slate-400 text-sm">
                        {currentLesson.SectionTitle}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/50 rounded-lg p-4 border border-glass-border flex items-center gap-4">
                  <div className="size-12 rounded bg-[#1e1e2e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-400">
                      folder
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-medium">Lesson Resources</h5>
                    <p className="text-slate-400 text-sm">
                      {currentLesson?.Materials?.length > 0
                        ? `${currentLesson.Materials.length} file(s) available - Videos, PDFs, documents and more`
                        : "No materials available for this lesson"}
                    </p>
                  </div>
                  {currentLesson?.Materials?.length > 0 && (
                    <button
                      onClick={() => setActiveTab("resources")}
                      className="text-sm font-medium text-white hover:text-primary transition-colors flex items-center gap-1"
                    >
                      View All{" "}
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="glass-panel rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">
                  Lecture Resources
                </h3>
                {currentLesson?.Materials &&
                currentLesson.Materials.length > 0 ? (
                  <div className="space-y-3">
                    {currentLesson.Materials.map((material, index) => {
                      const fileName = material.Url.split("/").pop();
                      const fileType = material.Type;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors border border-glass-border"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`${getMaterialColor(fileType)}`}>
                              <span className="material-symbols-outlined text-[32px]">
                                {getMaterialIcon(fileType)}
                              </span>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-white font-medium truncate">
                                {getMaterialTypeName(fileType)}
                              </span>
                              <span className="text-slate-400 text-sm truncate">
                                {fileName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={material.Url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                open_in_new
                              </span>
                              <span className="text-sm font-medium">View</span>
                            </a>
                            <a
                              href={material.Url}
                              download
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-glass-border rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                download
                              </span>
                            </a>
                          </div>
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
                      No resources available
                    </p>
                    <p className="text-slate-500 text-sm">
                      The instructor hasn't uploaded any materials for this
                      lesson yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "qa" && (
              <div className="glass-panel rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Course Quiz
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Test your knowledge with these practice questions
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-purple-500">
                    quiz
                  </span>
                </div>
                <Quiz
                  courseId={courseId}
                  onClose={() => setActiveTab("overview")}
                />
              </div>
            )}

            {activeTab === "notes" && (
              <div className="glass-panel rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">
                  Your Notes
                </h3>
                <textarea
                  className="w-full bg-slate-900/50 border border-glass-border rounded-lg p-4 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Add your notes here..."
                  rows="6"
                ></textarea>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="py-8 text-center text-slate-500 text-sm">
            © 2023 FlyUp Inc. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}
