import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import Quiz from "../components/Quiz";
import toast from "react-hot-toast";
import { apiCall } from "../config/apiConfig";
import { sendMessage } from "../services/chatbotService";
import {
  fetchCourseLessons,
  fetchEnrollmentProgress,
  markLectureComplete,
  finishCourse,
  debugCompleteCourse,
} from "../services/lessonService";
import { fetchAssignmentsByCourse } from "../services/quizService";
import QuizPreTestPage from "./QuizPreTestPage";
import QuizPage from "./QuizPage";
import QuizResultPage from "./QuizResultPage";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export default function CourseLessonPage({ isPreview }) {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLessonId, setSelectedLessonId] = useState(
    lessonId || "lecture-003",
  );
  const [isInstructorPreview, setIsInstructorPreview] = useState(false);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [, setIsVideoPlaying] = useState(false);

  // Quiz overlay state
  const [activeOverlay, setActiveOverlay] = useState(null); // null | 'pretest' | 'quiz' | 'result'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState(50);
  const [quizResult, setQuizResult] = useState(null);

  // AI Assistant states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLang, setSummaryLang] = useState("en");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cloudAudioRef = useRef(null);

  const [customFileText, setCustomFileText] = useState("");
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // AI Quiz states
  const [isGeneratingAIQuiz, setIsGeneratingAIQuiz] = useState(false);
  const [quizRefreshTrigger, setQuizRefreshTrigger] = useState(0);
  const [hasGeneratedQuiz, setHasGeneratedQuiz] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);

  // Video tracking & UI states
  const maxTimePlayed = useRef(0);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [lastUpdateText, setLastUpdateText] = useState("Last updated recently");

  // Understand Prompt & AI Chat states
  const [showUnderstandPrompt, setShowUnderstandPrompt] = useState(false);
  const hasShownUnderstandPrompt = useRef(false);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello! I'm your AI Learning Assistant for this lesson. Do you have any questions about what you just watched?", sender: 'bot' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Review & Debug states
  const [showReviewModal, setShowReviewModal] = useState(false);



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
      // Set to true if isPreview prop is true OR URL is specifically for instructor preview
      const isPreviewPath = window.location.pathname.includes('/instructor/preview/');
      const shouldPreview = !!isPreview || isPreviewPath;
      
      console.log("[CourseLessonPage] Instructor preview check:", {
        user: user?.id,
        isInstructor:
          user?.instructor ||
          user?.instructorId ||
          (user?.role || user?.Role || "").trim().toLowerCase() ===
          "instructor",
        lessonId,
        shouldPreview,
        note: shouldPreview ? "Active - instructor preview mode" : "Always false - use instructor dashboard for preview",
      });
      setIsInstructorPreview(shouldPreview);
    };
    checkInstructorPreview();
  }, [user, lessonId, isPreview]);

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

  // Fetch assignments for this course
  const { data: assignments = [] } = useQuery({
    queryKey: ["courseAssignments", courseId],
    queryFn: () => fetchAssignmentsByCourse(courseId),
    enabled: !!courseId && courseId !== "demo",
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

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setCustomFileText("");

    try {
      const fileType = file.name.split(".").pop().toLowerCase();

      if (fileType === "txt") {
        const reader = new FileReader();
        reader.onload = (event) => setCustomFileText(event.target.result);
        reader.readAsText(file);
      } else if (fileType === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setCustomFileText(result.value);
      } else if (fileType === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item) => item.str).join(" ") + " ";
        }
        setCustomFileText(text);
        toast.success("Trích xuất PDF thành công.");
      } else {
        toast.error("Vui lòng tải lên file định dạng: txt, docx, pdf");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Có lỗi xảy ra khi đọc file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // AI Function handlers
  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      let contentToSummarize = customFileText || "";

      // If no custom file is uploaded, we combine video transcript + materials + description
      if (!customFileText) {
        contentToSummarize = currentLesson?.Content ? `Lesson Description:\n${currentLesson.Content}\n\n` : "";

        // 1. Extract materials
        if (currentLesson?.Materials?.length > 0) {
          toast.success("Đang đọc và trích xuất tài liệu đính kèm...");
          for (const material of currentLesson.Materials) {
            try {
              const res = await fetch(material.Url);
              const arrayBuffer = await res.arrayBuffer();
              const fileType = material.Type?.toLowerCase();

              let text = "";
              if (fileType === "txt") {
                const decoder = new TextDecoder();
                text = decoder.decode(arrayBuffer);
              } else if (fileType === "docx" || fileType === "doc") {
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
              } else if (fileType === "pdf") {
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const textContent = await page.getTextContent();
                  text += textContent.items.map((item) => item.str).join(" ") + " ";
                }
              }

              if (text) {
                contentToSummarize += `--- Document: ${material.Name || material.Url.split('/').pop()} ---\n${text}\n\n`;
              }
            } catch (err) {
              console.error("Failed to extract material:", material.Url, err);
            }
          }
        }

        // 2. Extract video transcript via backend
        if (currentLesson?.VideoUrl) {
          toast.success("Đang nghe và trích xuất giọng nói từ video...");
          try {
            const token = localStorage.getItem("accessToken");
            const transcribeRes = await fetch(`${API_URL}/chatbot/transcribe`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ videoUrl: currentLesson.VideoUrl }),
            });
            if (transcribeRes.ok) {
              const { text } = await transcribeRes.json();
              if (text && text.text) {
                contentToSummarize += `--- Video Transcript ---\n${text.text}\n\n`;
              } else if (typeof text === 'string') {
                contentToSummarize += `--- Video Transcript ---\n${text}\n\n`;
              }
            } else {
              console.warn("Transcription API returned error");
            }
          } catch (err) {
            console.error("Failed to transcribe video", err);
          }
        }
      }

      if (!contentToSummarize || contentToSummarize.trim() === "") {
        toast.error("Không có nội dung bài học hoặc file để tóm tắt");
        setIsSummarizing(false);
        return;
      }

      toast.success("Đang tạo bản tóm tắt...");
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: `Please provide a concise summary of the following text. The summary MUST be in ${summaryLang === 'vi' ? 'Vietnamese' : 'English'}. Focus on the key points and main ideas:\n\n${contentToSummarize}`,
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.response || "Không có tóm tắt nào.");
        toast.success("Tóm tắt thành công!");
      } else {
        toast.error("Không thể tóm tắt bài học");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối bộ AI");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSpeak = async () => {
    const textToSpeak = aiSummary || customFileText || currentLesson?.Content;
    if (!textToSpeak) return;

    if (cloudAudioRef.current) {
      cloudAudioRef.current.pause();
      cloudAudioRef.current = null;
    }

    setIsSpeaking(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/chatbot/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: textToSpeak, lang: summaryLang })
      });
      if (!res.ok) throw new Error("API error");
      const { urls } = await res.json();

      if (!urls || urls.length === 0) {
        setIsSpeaking(false);
        return;
      }

      let index = 0;
      const playNext = () => {
        if (index >= urls.length) {
          setIsSpeaking(false);
          cloudAudioRef.current = null;
          return;
        }
        const chunk = urls[index];
        const audio = new Audio("data:audio/mp3;base64," + (chunk.base64 || chunk.url));
        cloudAudioRef.current = audio;
        audio.onended = () => {
          index++;
          playNext();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          cloudAudioRef.current = null;
        };
        audio.play().catch((e) => {
          console.error(e);
          setIsSpeaking(false);
        });
      };
      playNext();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối bộ đọc Cloud TTS");
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    if (cloudAudioRef.current) {
      cloudAudioRef.current.pause();
      cloudAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleGenerateAIQuiz = async () => {
    setIsGeneratingAIQuiz(true);
    try {
      toast.loading("Đang tạo bộ câu hỏi từ bài giảng...", { id: "ai-quiz-gen" });
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/ai/quiz/generate-instant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          lessonId: selectedLessonId,
          count: 5,
          difficulty: "Mixed",
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Invalidate Quiz queries so the new questions are fetched from the backend pool
        queryClient.invalidateQueries({ queryKey: ["courseAssignments", courseId] });
        
        // Switch to the Q&A tab to view the questions
        setActiveTab("qa");
        // Trigger Quiz component refetch
        setQuizRefreshTrigger(prev => prev + 1);
        setHasGeneratedQuiz(true);
        setCurrentAssignmentId(result.data.assignmentId);

        toast.success("Đã tạo xong 5 câu hỏi thực hành và lưu vào ngân hàng đề!", { id: "ai-quiz-gen" });
      } else {
        toast.error(result.message || "Không thể tạo câu hỏi AI", { id: "ai-quiz-gen" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi tạo câu hỏi", { id: "ai-quiz-gen" });
    } finally {
      setIsGeneratingAIQuiz(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Provide lesson context to the chatbot
      const context = `Context: The student is watching the lesson "${currentLesson?.Title}". Content summary: ${currentLesson?.Content?.substring(0, 500)}... 
      Please answer their question based on this lesson.
      
      Question: ${userMessage}`;

      const response = await sendMessage(context);
      setChatMessages(prev => [...prev, { text: response.response, sender: 'bot' }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("AI Assistant is currently busy. Please try again.");
      setChatMessages(prev => [...prev, { text: "Xin lỗi, tôi gặp sự cố kết nối. Bạn vui lòng thử lại sau nhé!", sender: 'bot' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAskAI = () => {
    setShowUnderstandPrompt(false);
    setActiveTab("ai");
    // Small delay to ensure tab is rendered before scrolling or focusing
    setTimeout(() => {
      document.getElementById('ai-chat-input')?.focus();
      document.getElementById('ai-assistant-tab')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    return () => handleStop();
  }, []);

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
        setSelectedLessonId(firstLecture.Id);
      }
    }
  }, [course?.Sections, lessonId]);

  const currentLesson = findLessonInSections(course?.Sections, currentLessonId);

  useEffect(() => {
    let completed = false;
    if (enrollment) {
      try {
        const completedLectures = JSON.parse(enrollment.LectureMilestones || "[]");
        completed = Array.isArray(completedLectures) ? completedLectures.includes(currentLessonId) : false;
      } catch {
        completed = false;
      }
    }
    setIsLessonCompleted(completed);
    maxTimePlayed.current = 0;
  }, [currentLessonId, enrollment]);

  useEffect(() => {
    const dateToUse = currentLesson?.LastModificationTime || course?.LastModificationTime;
    if (dateToUse) {
      const date = new Date(dateToUse);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) setLastUpdateText("Last updated today");
      else if (diffDays === 1) setLastUpdateText("Last updated yesterday");
      else if (diffDays < 30) setLastUpdateText(`Last updated ${diffDays} days ago`);
      else setLastUpdateText(`Last updated ${date.toLocaleDateString('vi-VN')}`);
    }
  }, [currentLesson, course]);

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
    return Math.min(Math.round((completedLectures / totalLectures) * 100), 100);
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

    const formatTime = (seconds) => {
      if (!seconds || seconds <= 0) return "";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

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
          duration: formatTime(lecture.Duration),
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

  const handleNextLecture = () => {
    if (!isLessonCompleted) {
      toast.error("Vui lòng xem hết video để qua bài tiếp theo!");
      return;
    }

    let foundCurrent = false;
    for (const section of sections) {
      for (const item of section.items) {
        if (foundCurrent) {
          if (item.status === 'locked' && !isLessonCompleted) {
            toast.warning("Bài giảng tiếp theo chưa được mở khóa!");
            return;
          }
          setSelectedLessonId(item.id);
          return;
        }
        if (item.id === currentLessonId) {
          foundCurrent = true;
        }
      }
    }
    toast.success("Bạn đã hoàn thành bài giảng cuối cùng!");
  };

  const handleDebugComplete = async () => {
    if (!isInstructorPreview) return;
    const toastId = toast.loading("Debug: Hoàn thành nhanh khóa học...");
    try {
      await debugCompleteCourse(courseId);
      toast.success("Debug: Đã mở khóa toàn bộ bài học!", { id: toastId });
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["enrollmentProgress", courseId, user?.id] });
      window.location.reload(); // Quick refresh to update tree
    } catch (error) {
      console.error("Debug complete error:", error);
      toast.error("Lỗi debug", { id: toastId });
    }
  };


  const handleFinishCourse = async () => {
    console.log("[CourseLessonPage] handleFinishCourse triggered, progress:", progress);
    
    if (Math.round(progress) < 100) {
      toast.error("Vui lòng hoàn thành tất cả các bài học để nhận chứng chỉ!");
      return;
    }

    const toastId = toast.loading("Đang xử lý hoàn thành khóa học...");
    try {
      console.log("[CourseLessonPage] Calling finishCourse API for:", courseId);
      const result = await finishCourse(courseId);
      console.log("[CourseLessonPage] finishCourse API result:", result);
      
      toast.success("Chúc mừng! Bạn đã hoàn thành khóa học.", { id: toastId });
      
      // Invalidate queries to refresh enrollment status
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["enrollmentProgress", courseId, user.id] });
        queryClient.invalidateQueries({ queryKey: ["userEnrollments", user.id] });
      }

      // Show review modal instead of direct redirect
      setShowReviewModal(true);
      console.log("[CourseLessonPage] showReviewModal set to true");
    } catch (error) {
      console.error("Failed to finish course:", error);
      toast.error(`Lỗi: ${error.message || "Có lỗi xảy ra khi hoàn thành khóa học."}`, { id: toastId });
      
      // Fallback: If it's already completed or close enough, show the modal anyway
      if (error.message?.includes("completed") || progress >= 100) {
        setShowReviewModal(true);
      }
    }
  };

  const handleCompleteLesson = async () => {
    if (isInstructorPreview) {
      toast.success("Preview: Lesson marked as complete (no data saved).");
      setIsLessonCompleted(true);
      return;
    }

    if (isLessonCompleted || courseId === "demo") {
      setIsLessonCompleted(true);
      return;
    }

    try {
      await markLectureComplete(currentLessonId);
      setIsLessonCompleted(true);

      // Invalidate queries to trigger real-time updates!
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["enrollmentProgress", courseId, user.id] });
        queryClient.invalidateQueries({ queryKey: ["userEnrollments", user.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["enrollmentProgress"] });
        queryClient.invalidateQueries({ queryKey: ["userEnrollments"] });
      }

      toast.success("Tiến trình học đã được tự động lưu!", { id: "progress-saved" });
    } catch (error) {
      console.error("Failed to mark complete:", error);
      // Fallback visually if offline/error
      setIsLessonCompleted(true);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark relative">
      {isInstructorPreview && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-600 to-orange-600 text-white text-center py-2 px-4 shadow-xl flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            PREVIEW MODE — Experience your course as a student would
          </div>
          <button 
            onClick={() => navigate("/instructor/dashboard")}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-all flex items-center gap-1 border border-white/10"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            Exit Preview
          </button>
        </div>
      )}
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
          
          {/* Finish Course Button */}
          {progress >= 100 && enrollment?.Status !== 'Completed' && (
            <button
              onClick={handleFinishCourse}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl text-white font-bold shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">
                emoji_events
              </span>
              Finish Course
            </button>
          )}

          {/* Instructor Debug Tool */}
          {isInstructorPreview && (
            <button
              onClick={handleDebugComplete}
              className="mt-3 w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-500 text-xs font-bold transition-all flex items-center justify-center gap-2"
              title="Only visible in Preview Mode"
            >
              <span className="material-symbols-outlined text-[16px]">bug_report</span>
              DEBUG: Quick Complete
            </button>
          )}
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
                    className={`relative flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all ${item.status === "active"
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
                      className={`absolute -left-[19px] top-1/2 -translate-y-1/2 size-2.5 rounded-full ${item.status === "completed"
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
                        className={`text-sm ${item.status === "active"
                          ? "font-medium text-white"
                          : item.status === "completed"
                            ? "text-slate-300"
                            : "text-slate-300 group-hover:text-white"
                          }`}
                      >
                        <span className="text-slate-500 text-xs mr-1">
                          {item.lectureNumber}.
                        </span>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {item.duration ? `${item.duration} • ` : ""}{item.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Assignments Section */}
          {assignments.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 px-2 py-2 mb-1 text-xs font-semibold uppercase tracking-wider text-violet-400">
                <span className="material-symbols-outlined text-[16px]">assignment</span>
                Assignments
              </div>
              <div className="flex flex-col gap-1 pl-3 border-l border-violet-500/30 ml-3">
                {assignments.map((assignment) => (
                  <button
                    key={assignment.Id}
                    className="relative flex items-center gap-3 w-full p-2.5 rounded-lg text-left hover:bg-violet-500/10 transition-all group/asgn"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setActiveOverlay('pretest');
                    }}
                  >
                    <div className="absolute -left-[19px] top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-violet-500/50"></div>
                    <span className="material-symbols-outlined text-[20px] text-violet-400" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-sm text-slate-300 group-hover/asgn:text-white truncate">{assignment.Name}</span>
                      <span className="text-[10px] text-slate-500">{assignment.QuestionCount} câu · Pass: {assignment.GradeToPass}/10</span>
                    </div>
                    <span className="material-symbols-outlined text-[14px] text-slate-600 group-hover/asgn:text-violet-400 transition-colors">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
                  onTimeUpdate={(e) => {
                    const video = e.target;
                    if (!video.seeking && video.currentTime > maxTimePlayed.current) {
                      maxTimePlayed.current = video.currentTime;
                    }
                    if (!isInstructorPreview && user?.id && currentLessonId) {
                      const cacheKey = `flyup_video_progress_${user.id}_${currentLessonId}`;
                      localStorage.setItem(cacheKey, JSON.stringify({
                        currentTime: video.currentTime,
                        maxTime: maxTimePlayed.current
                      }));
                    }

                    // 50% Understand Prompt Trigger
                    if (video.duration > 0 && 
                        video.currentTime / video.duration > 0.5 && 
                        !hasShownUnderstandPrompt.current && 
                        !isLessonCompleted) {
                      setShowUnderstandPrompt(true);
                      hasShownUnderstandPrompt.current = true;
                    }
                  }}
                  onSeeking={(e) => {
                    if (isLessonCompleted) return;
                    if (e.target.currentTime > maxTimePlayed.current + 1) {
                      e.target.currentTime = maxTimePlayed.current;
                      toast.error("Bạn không thể tua qua phần chưa xem!", { id: 'seek-warning' });
                    }
                  }}
                  onEnded={() => {
                    handleCompleteLesson();
                  }}
                  onError={(e) => {
                    console.error("Video error:", e);
                    console.error("Failed URL:", currentLesson.VideoUrl);
                    console.error("Error details:", e.target.error);
                    setVideoLoadFailed(true);
                  }}
                  onLoadedMetadata={(e) => {
                    console.log(
                      "Video loaded successfully:",
                      currentLesson.VideoUrl,
                    );
                    const video = e.target;
                    if (user?.id && currentLessonId) {
                      const cacheKey = `flyup_video_progress_${user.id}_${currentLessonId}`;
                      const savedData = localStorage.getItem(cacheKey);
                      if (savedData) {
                        try {
                          const { currentTime, maxTime } = JSON.parse(savedData);
                          // Only restore if valid
                          if (currentTime > 0 && currentTime < video.duration) {
                            video.currentTime = currentTime;
                            maxTimePlayed.current = maxTime || currentTime;
                            toast("Khôi phục tiến độ học...", { icon: "⏱️", id: "resume-toast" });
                          }
                        } catch {
                          console.warn("Could not parse saved video progress");
                        }
                      }
                    }
                  }}
                  onCanPlay={() => {
                    console.log("Video can play");
                  }}
                >
                  <source src={currentLesson.VideoUrl} type="video/mp4" />
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

            {/* Understand Prompt Overlay */}
            {showUnderstandPrompt && (
              <div className="absolute inset-x-0 bottom-0 p-6 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass-panel border-primary/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl shadow-primary/20 bg-[#130d1a]/95 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary animate-bounce">psychology</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm sm:text-base">Do you understand the content so far?</h4>
                      <p className="text-slate-400 text-xs sm:text-sm">Let me know if you need the AI to explain anything!</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowUnderstandPrompt(false)}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border border-white/10"
                    >
                      I understand
                    </button>
                    <button 
                      onClick={handleAskAI}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white text-sm font-bold transition-all shadow-neon flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      Ask AI
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-glass-border">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {currentLesson?.Title || "Lesson"}
              </h1>
              <p className="text-slate-400 text-sm">{lastUpdateText}</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {isInstructorPreview && (
                <button
                  onClick={() => navigate(`/edit-course/${courseId}`)}
                  className="flex-1 md:flex-none h-11 px-6 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-white text-sm font-bold border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                  Edit This Lecture
                </button>
              )}
              {(!currentLesson?.VideoUrl || isLessonCompleted) && (
                <button
                  onClick={() => {
                    if (!isLessonCompleted) handleCompleteLesson();
                  }}
                  className={`flex-1 md:flex-none h-11 px-6 rounded-lg border transition-all flex items-center justify-center gap-2 font-medium ${isLessonCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : "border-slate-600 text-white hover:bg-white/5 hover:border-slate-500"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    check_circle
                  </span>
                  {isLessonCompleted ? "Completed" : "Mark as Complete"}
                </button>
              )}
              <button
                onClick={handleNextLecture}
                className={`flex-1 md:flex-none h-11 px-6 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isLessonCompleted
                    ? "bg-primary text-white hover:bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
              >
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
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === "overview"
                  ? "text-primary border-primary"
                  : "text-slate-400 hover:text-white border-transparent"
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("resources")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === "resources"
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
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === "qa"
                  ? "text-primary border-primary"
                  : "text-slate-400 hover:text-white border-transparent"
                  }`}
              >
                Q&A{" "}
                <span className="bg-slate-800 text-xs px-1.5 rounded-sm">
                  {assignments?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === "notes"
                  ? "text-primary border-primary"
                  : "text-slate-400 hover:text-white border-transparent"
                  }`}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === "ai"
                    ? "text-purple-400 border-purple-400"
                    : "text-slate-400 hover:text-purple-300 border-transparent"
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                AI Assistant
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
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Course Quiz & Q&A
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Test your knowledge with practice questions from the lecturer or generate new ones using AI
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateAIQuiz}
                      disabled={isGeneratingAIQuiz || (!currentLesson?.Content && !customFileText)}
                      className="px-6 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        psychology
                      </span>
                      {isGeneratingAIQuiz ? "Đang tạo..." : "Luyện tập (5 câu AI)"}
                    </button>
                    <span className="material-symbols-outlined text-4xl text-purple-500 hidden sm:block">
                      quiz
                    </span>
                  </div>
                </div>
                <div className="space-y-6">
                  {hasGeneratedQuiz ? (
                    <Quiz
                      courseId={courseId}
                      assignmentId={currentAssignmentId}
                      onClose={() => setActiveTab("overview")}
                      refreshTrigger={quizRefreshTrigger}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center glass-panel rounded-3xl border-dashed border-2 border-white/10">
                      <div className="size-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 animate-bounce">
                        <span className="material-symbols-outlined text-4xl text-purple-400">psychology</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Sẵn sàng luyện tập?</h3>
                      <p className="text-slate-400 max-w-md mb-8">
                        AI sẽ dựa trên nội dung bài giảng này để tạo ra bộ câu hỏi trắc nghiệm giúp bạn củng cố kiến thức ngay lập tức.
                      </p>
                      <button
                        onClick={handleGenerateAIQuiz}
                        disabled={isGeneratingAIQuiz}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isGeneratingAIQuiz ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                            <span>Đang tạo câu hỏi...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">magic_button</span>
                            <span>Bắt đầu Sinh câu hỏi AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
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

            {activeTab === "ai" && (
              <div className="glass-panel rounded-xl p-8 relative overflow-hidden flex flex-col min-h-[500px]" id="ai-assistant-tab">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400">auto_awesome</span>
                      AI Learning Assistant
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Ask anything about the lesson or use our support tools
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-glass-border">
                    <button
                      onClick={() => setSummaryLang("vi")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${summaryLang === "vi" ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-white"
                        }`}
                    >
                      Tiếng Việt
                    </button>
                    <button
                      onClick={() => setSummaryLang("en")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${summaryLang === "en" ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-white"
                        }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="flex flex-col flex-1 gap-6 relative z-10">
                  {/* Tools Strip */}
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-white text-xs font-bold border border-glass-border flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      {isUploading ? "Reading..." : "Custom Docs"}
                    </button>

                    <button
                      onClick={handleSummarize}
                      disabled={isSummarizing || (!currentLesson?.Content && !customFileText)}
                      className="px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">{isSummarizing ? "hourglass_empty" : "summarize"}</span>
                      {isSummarizing ? "Summarizing..." : "Summarize Lesson"}
                    </button>

                    {!isSpeaking ? (
                      <button
                        onClick={handleSpeak}
                        disabled={!currentLesson?.Content && !customFileText && !aiSummary}
                        className="px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">volume_up</span>
                        Listen
                      </button>
                    ) : (
                      <button
                        onClick={handleStop}
                        className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-2 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                        Stop
                      </button>
                    )}
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px] custom-scrollbar">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                            msg.sender === 'user' 
                              ? 'bg-primary text-white rounded-br-none shadow-lg shadow-primary/10' 
                              : 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none shadow-sm'
                          }`}>
                            <div className="markdown-content">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef}></div>
                    </div>

                    <div className="p-3 bg-[#13131a] border-t border-white/5">
                      <div className="flex gap-2">
                        <input
                          id="ai-chat-input"
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                          placeholder="What would you like to ask about this lesson?"
                          className="flex-1 bg-slate-900 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary border border-white/10 placeholder:text-slate-500"
                        />
                        <button
                          onClick={handleChatSend}
                          disabled={!chatInput.trim() || isChatLoading}
                          className="size-10 rounded-xl bg-primary hover:bg-purple-600 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                          <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Result (if any) */}
                  {aiSummary && (
                    <div className="mt-2 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 animate-in zoom-in duration-300">
                      <div className="flex items-center justify-between mb-2">
                         <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">summarize</span>
                          Lesson Summary
                        </h4>
                        <button onClick={() => setAiSummary("")} className="text-slate-500 hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                      <div className="text-slate-300 text-xs leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar markdown-content">
                        <ReactMarkdown>{aiSummary}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.pdf,.docx"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="py-8 text-center text-slate-500 text-sm">
            © 2023 FlyUp Inc. All rights reserved.
          </footer>
        </div>
      </main>

      {/* Quiz Overlays */}
      {activeOverlay === 'pretest' && selectedAssignment && (
        <QuizPreTestPage
          assignment={selectedAssignment}
          userId={user?.Id || user?.id}
          courseId={courseId}
          onStart={(questionCount) => {
            setQuizQuestionCount(questionCount);
            setActiveOverlay('quiz');
          }}
          onBack={() => setActiveOverlay(null)}
        />
      )}
      {activeOverlay === 'quiz' && selectedAssignment && (
        <QuizPage
          assignmentId={selectedAssignment.Id}
          courseId={courseId}
          userId={user?.Id || user?.id}
          questionCount={quizQuestionCount}
          onFinish={(result) => {
            setQuizResult(result);
            setActiveOverlay('result');
          }}
          onBack={() => setActiveOverlay('pretest')}
        />
      )}
      {activeOverlay === 'result' && quizResult && (
        <QuizResultPage
          result={quizResult}
          assignmentId={selectedAssignment?.Id}
          onClose={() => setActiveOverlay(null)}
        />
      )}

      {/* Course Finish / Review Prompt Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#130d1a] border border-glass-border rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute -top-24 -right-24 size-48 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all duration-700"></div>
            
            <div className="relative z-10 text-center space-y-6">
              <div className="size-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20 animate-bounce">
                <span className="material-symbols-outlined text-4xl text-white">emoji_events</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Congratulations!</h2>
                <p className="text-slate-400 text-sm">You have successfully completed the course. Please leave a comment and rating for the course, afterwards you will receive your certificate.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    navigate(`/certificate/${courseId}`);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all text-sm"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    navigate(`/courses/${courseId}?completed=true`);
                  }}
                  className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2 text-sm"
                >
                  Rate & Comment
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


