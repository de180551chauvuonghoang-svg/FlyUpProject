import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  FileText,
  Video,
  X,
  ClipboardList,
  Clock,
  Target,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InstructorEditCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Basic course info
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    intro: "",
    price: "",
    discount: 0,
    level: "Beginner",
  });

  // Curriculum management
  const [sections, setSections] = useState([]);
  const [finalAssignment, setFinalAssignment] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assignmentTarget, setAssignmentTarget] = useState({ type: null, id: null });
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  const fetchCourseData = async () => {
    try {
      // Parallel fetch course details and assignments
      const [courseRes, assignRes] = await Promise.all([
        fetch(`${API_URL}/courses/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${API_URL}/quiz/course/${id}/assignments`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);

      if (!courseRes.ok) throw new Error("Course not found");
      
      const [courseData, assignData] = await Promise.all([
        courseRes.json(),
        assignRes.json()
      ]);

      const course = courseData.data || courseData;
      const allAssignments = assignData.data || [];

      // Set basic info
      setFormData({
        title: course.Title || "",
        description: course.Description || "",
        intro: course.Intro || "",
        price: course.Price ?? "",
        discount: course.Discount ?? 0,
        level: course.Level || "Beginner",
        ThumbUrl: course.ThumbUrl || null,
      });
      setThumbnailPreview(course.ThumbUrl || null);

      // Pre-index assignments for faster lookup
      const assignmentsBySection = {};
      const courseAssignments = [];
      
      allAssignments.forEach(a => {
        if (a.SectionId) {
          if (!assignmentsBySection[a.SectionId]) assignmentsBySection[a.SectionId] = [];
          assignmentsBySection[a.SectionId].push(a);
        } else {
          courseAssignments.push(a);
        }
      });

      // Set sections and lectures
      const sectionsData = (course.Sections || []).map((section) => ({
        id: section.Id,
        title: section.Title,
        isExisting: true,
        assignments: (assignmentsBySection[section.Id] || []).map(a => ({
          id: a.Id,
          name: a.Name,
          duration: a.Duration,
          gradeToPass: a.GradeToPass,
          questions: a.McqQuestions?.map(q => ({
            id: q.Id,
            content: q.Content,
            difficulty: q.Difficulty,
            choices: q.McqChoices?.map(c => ({
              id: c.Id,
              content: c.Content,
              isCorrect: c.IsCorrect
            }))
          })) || [],
          isExisting: true
        })),
        lectures: (section.Lectures || []).map((lecture) => {
          const hasRawMaterial = Array.isArray(lecture.LectureMaterial) && lecture.LectureMaterial.length > 0;
          const videoUrl = hasRawMaterial
            ? lecture.LectureMaterial.find((m) => m.Type === "video")?.Url
            : lecture.VideoUrl || null;
          const materials = hasRawMaterial
            ? lecture.LectureMaterial.filter((m) => m.Type !== "video")
            : lecture.Materials || [];

          return {
            id: lecture.Id,
            title: lecture.Title,
            content: lecture.Content || "",
            isExisting: true,
            videoUrl,
            materials: materials.map((m) => ({
              id: m.Id,
              Name: m.Name || m.Type || "Material",
              Type: m.Type,
              Url: m.Url,
            })),
          };
        }),
      }));

      // Set final course assignment
      const finalAssign = courseAssignments.find(a => a.CourseId === id && !a.SectionId);
      if (finalAssign) {
        setFinalAssignment({
          id: finalAssign.Id,
          name: finalAssign.Name,
          duration: finalAssign.Duration,
          gradeToPass: finalAssign.GradeToPass,
          questions: finalAssign.McqQuestions?.map(q => ({
            id: q.Id,
            content: q.Content,
            difficulty: q.Difficulty,
            choices: q.McqChoices?.map(c => ({
              id: c.Id,
              content: c.Content,
              isCorrect: c.IsCorrect
            }))
          })) || [],
          isExisting: true
        });
      } else {
        setFinalAssignment(null);
      }

      setSections(sectionsData);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load course");
      navigate("/instructor/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleThumbnailUpload = (file) => {
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    toast.success("Thumbnail selected");
  };

  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Section management
  const addSection = () => {
    if (!newSectionTitle.trim()) {
      toast.error("Please enter a section title");
      return;
    }

    const newSection = {
      id: `temp-${Date.now()}`,
      title: newSectionTitle,
      lectures: [],
      isExisting: false,
    };

    setSections([...sections, newSection]);
    setNewSectionTitle("");
    setExpandedSectionId(newSection.id);
    toast.success("Section added!");
  };

  const removeSection = async (sectionId) => {
    triggerConfirm(
      "Delete Section",
      "Are you sure you want to delete this section and all its contents? This action cannot be undone.",
      async () => {
        // If it's an existing section, delete from backend first
        const section = sections.find((s) => s.id === sectionId);
        if (section?.isExisting) {
          try {
            const res = await fetch(`${API_URL}/courses/sections/${sectionId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            if (!res.ok) {
              throw new Error("Failed to delete section");
            }
          } catch (error) {
            console.error("Delete section error:", error);
            toast.error("Failed to delete section from server");
            return;
          }
        }

        setSections(sections.filter((sec) => sec.id !== sectionId));
        toast.success("Section removed");
      }
    );
  };

  const updateSectionTitle = (sectionId, newTitle) => {
    setSections(
      sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, title: newTitle, isModified: true }
          : sec,
      ),
    );
  };

  // Assignment management
  const openAssignmentModal = (targetType, targetId, assignment = null) => {
    setAssignmentTarget({ type: targetType, id: targetId });
    if (assignment) {
      setCurrentAssignment(JSON.parse(JSON.stringify(assignment))); // Deep copy
    } else {
      setCurrentAssignment({
        id: `temp-assign-${Date.now()}`,
        name: "",
        duration: 30,
        gradeToPass: 8,
        questions: [],
        isExisting: false
      });
    }
    setIsAssignmentModalOpen(true);
  };

  const closeAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setCurrentAssignment(null);
  };

  const saveAssignment = (updatedAssignment) => {
    if (assignmentTarget.type === "section") {
      setSections(sections.map(sec => {
        if (sec.id === assignmentTarget.id) {
          const _isNew = !updatedAssignment.isExisting;
          const existingAssignments = sec.assignments || [];
          let newAssignments;
          
          if (existingAssignments.some(a => a.id === updatedAssignment.id)) {
            newAssignments = existingAssignments.map(a => a.id === updatedAssignment.id ? { ...updatedAssignment, isModified: true } : a);
          } else {
            newAssignments = [...existingAssignments, { ...updatedAssignment, isModified: true }];
          }
          
          return { ...sec, assignments: newAssignments, isModified: true };
        }
        return sec;
      }));
    } else if (assignmentTarget.type === "course") {
      setFinalAssignment({ ...updatedAssignment, isModified: true });
    }
    
    closeAssignmentModal();
    toast.success("Assignment updated in curriculum!");
  };

  const removeAssignment = async (targetType, targetId, assignmentId) => {
    triggerConfirm(
      "Delete Assignment",
      "Are you sure you want to delete this assignment?",
      async () => {
        if (assignmentId && !assignmentId.toString().startsWith("temp-")) {
          try {
            const res = await fetch(`${API_URL}/quiz/${assignmentId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!res.ok) throw new Error("Failed to delete assignment from server");
          } catch (err) {
            toast.error(err.message);
            return;
          }
        }

        if (targetType === "section") {
          setSections(sections.map(sec => {
            if (sec.id === targetId) {
              return {
                ...sec,
                assignments: (sec.assignments || []).filter(a => a.id !== assignmentId),
                isModified: true
              };
            }
            return sec;
          }));
        } else {
          setFinalAssignment(null);
        }
        toast.success("Assignment removed");
      }
    );
  };

  // Lecture management
  const addLecture = (sectionId) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lectures: [
              ...section.lectures,
              {
                id: `temp-${Date.now()}`,
                title: "",
                content: "",
                videoUrl: null,
                videoFile: null,
                materials: [],
                isExisting: false,
              },
            ],
          };
        }
        return section;
      }),
    );
    setExpandedSectionId(sectionId);
    toast.success("Lecture box added!");
  };

  const removeLecture = async (sectionId, lectureId) => {
    triggerConfirm(
      "Delete Lecture",
      "Are you sure you want to delete this lecture?",
      async () => {
        // If it's an existing lecture, delete from backend first
        const section = sections.find((s) => s.id === sectionId);
        const lecture = section?.lectures.find((l) => l.id === lectureId);
        if (lecture?.isExisting) {
          try {
            const res = await fetch(`${API_URL}/courses/lectures/${lectureId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            if (!res.ok) {
              throw new Error("Failed to delete lecture");
            }
          } catch (error) {
            console.error("Delete lecture error:", error);
            toast.error("Failed to delete lecture from server");
            return;
          }
        }

        setSections(
          sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                lectures: section.lectures.filter((lec) => lec.id !== lectureId),
              };
            }
            return section;
          }),
        );
        toast.success("Lecture removed");
      }
    );
  };

  const updateLecture = (sectionId, lectureId, field, value) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lectures: section.lectures.map((lec) =>
              lec.id === lectureId
                ? { ...lec, [field]: value, isModified: true }
                : lec,
            ),
          };
        }
        return section;
      }),
    );
  };

  // File upload handlers
  const handleVideoUpload = (sectionId, lectureId, file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    // Limit to 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Video file is too large (max 50MB). Please compress it.");
      return;
    }

    // Capture video duration
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = function () {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.round(video.duration); // in seconds
      
      setSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              lectures: section.lectures.map((lec) =>
                lec.id === lectureId
                  ? {
                      ...lec,
                      videoFile: file,
                      videoUrl: URL.createObjectURL(file),
                      duration: duration,
                      isModified: true,
                    }
                  : lec,
              ),
            };
          }
          return section;
        }),
      );
    };
    video.src = URL.createObjectURL(file);
    
    toast.success("Video selected for upload");
  };

  const handleMaterialUpload = (sectionId, lectureId, file) => {
    if (!file) return;

    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lectures: section.lectures.map((lec) => {
              if (lec.id === lectureId) {
                return {
                  ...lec,
                  materials: [
                    ...(lec.materials || []),
                    {
                      id: `temp-${Date.now()}`,
                      Name: file.name,
                      Type: file.type.split("/")[1] || "file",
                      file: file,
                      isNew: true,
                    },
                  ],
                };
              }
              return lec;
            }),
          };
        }
        return section;
      }),
    );
    toast.success("Material added");
  };

  const removeMaterial = async (sectionId, lectureId, materialId) => {
    triggerConfirm(
      "Delete Material",
      "Are you sure you want to delete this material?",
      async () => {
        // Find the material to check if it's existing or new
        const section = sections.find((s) => s.id === sectionId);
        const lecture = section?.lectures.find((l) => l.id === lectureId);
        const material = lecture?.materials.find((m) => m.id === materialId);

        // If it's an existing material (not new), delete from server
        if (material && !material.isNew && lecture.isExisting) {
          try {
            const res = await fetch(
              `${API_URL}/upload/material/${lectureId}/${materialId}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );

            if (!res.ok) {
              throw new Error("Failed to delete material");
            }
          } catch (error) {
            console.error("Delete material error:", error);
            toast.error("Failed to delete material from server");
            return;
          }
        }

        // Remove from local state
        setSections(
          sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                lectures: section.lectures.map((lec) => {
                  if (lec.id === lectureId) {
                    return {
                      ...lec,
                      materials: lec.materials.filter((m) => m.id !== materialId),
                    };
                  }
                  return lec;
                }),
              };
            }
            return section;
          }),
        );
        toast.success("Material removed");
      }
    );
  };

  // Save all changes
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Course title is required");
      return;
    }

    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }

    setIsSaving(true);

    try {
      // Step 1: Update basic course info
      console.log("📝 Updating course info...");
      const basicInfoRes = await fetch(`${API_URL}/courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          intro: formData.intro,
          price: parseFloat(formData.price) || 0,
          discount: parseFloat(formData.discount) || 0,
          level: formData.level,
        }),
      });

      if (!basicInfoRes.ok) throw new Error("Failed to update basic course info");
      console.log("✅ Course info updated");

      // Step 1.5: Upload Course Thumbnail if changed
      if (thumbnailFile) {
        console.log("🖼️ Uploading course thumbnail...");
        const thumbFormData = new FormData();
        thumbFormData.append("file", thumbnailFile);
        thumbFormData.append("courseId", id);

        const thumbRes = await fetch(`${API_URL}/upload/thumbnail`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: thumbFormData,
        });
        if (!thumbRes.ok) console.error("Thumbnail upload failed");
        else console.log("✅ Thumbnail uploaded");
      }

      // Step 2-5: Process sections, lectures, and assignments
      for (const section of sections) {
        let sectionId = section.id;

        // Create or update section
        if (!section.isExisting) {
          const sectionRes = await fetch(`${API_URL}/courses/${id}/sections`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ title: section.title }),
          });
          if (!sectionRes.ok) throw new Error(`Failed to create section: ${section.title}`);
          const sectionData = await sectionRes.json();
          sectionId = sectionData.data.Id;
        } else if (section.isModified) {
          const updateRes = await fetch(`${API_URL}/courses/sections/${sectionId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ title: section.title }),
          });
          if (!updateRes.ok) throw new Error(`Failed to update section: ${section.title}`);
        }

        // Process lectures
        for (const lecture of section.lectures) {
          let lectureId = lecture.id;
          if (!lecture.isExisting) {
            const lectureRes = await fetch(`${API_URL}/courses/sections/${sectionId}/lectures`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ title: lecture.title, content: lecture.content || "" }),
            });
            if (!lectureRes.ok) throw new Error(`Failed to create lecture: ${lecture.title}`);
            const lectureData = await lectureRes.json();
            lectureId = lectureData.data.Id;
          } else if (lecture.isModified) {
            const updateRes = await fetch(`${API_URL}/courses/lectures/${lectureId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ title: lecture.title, content: lecture.content || "" }),
            });
            if (!updateRes.ok) throw new Error(`Failed to update lecture: ${lecture.title}`);
          }

          // Handle Video Upload
          if (lecture.videoFile) {
            const videoFormData = new FormData();
            videoFormData.append("file", lecture.videoFile);
            videoFormData.append("lectureId", lectureId);
            if (lecture.duration) {
              videoFormData.append("duration", lecture.duration);
            }
            const videoRes = await fetch(`${API_URL}/upload/video`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: videoFormData,
            });
            if (!videoRes.ok) {
              const errorData = await videoRes.json().catch(() => ({}));
              if (videoRes.status === 413) {
                throw new Error(`Video too large (max 50MB) for: ${lecture.title}`);
              }
              throw new Error(errorData.message || `Failed to upload video for: ${lecture.title}`);
            }
          }

          // Handle Materials Upload
          const newMaterials = (lecture.materials || []).filter(m => m.isNew && m.file);
          for (const material of newMaterials) {
            const matFormData = new FormData();
            matFormData.append("file", material.file);
            matFormData.append("lectureId", lectureId);
            const matRes = await fetch(`${API_URL}/upload/document`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: matFormData,
            });
            if (!matRes.ok) throw new Error(`Failed to upload material: ${material.Name}`);
          }
        }

        // Process Section Assignments
        for (const assignment of (section.assignments || [])) {
          if (!assignment.isExisting || assignment.isModified) {
            const isNew = !assignment.isExisting || assignment.id.toString().startsWith("temp-");
            const url = isNew ? `${API_URL}/quiz` : `${API_URL}/quiz/${assignment.id}`;
            const method = isNew ? "POST" : "PUT";
            const res = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                name: assignment.name,
                duration: assignment.duration,
                gradeToPass: assignment.gradeToPass,
                sectionId: sectionId,
                courseId: id,
                questions: assignment.questions
              }),
            });
            if (!res.ok) throw new Error(`Failed to save assignment: ${assignment.name}`);
          }
        }
      }

      // Step 6: Process Final Course Assignment
      if (finalAssignment && (finalAssignment.isModified || !finalAssignment.isExisting)) {
        const isNew = !finalAssignment.isExisting || finalAssignment.id.toString().startsWith("temp-");
        const url = isNew ? `${API_URL}/quiz` : `${API_URL}/quiz/${finalAssignment.id}`;
        const method = isNew ? "POST" : "PUT";
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: finalAssignment.name,
            duration: finalAssignment.duration,
            gradeToPass: finalAssignment.gradeToPass,
            courseId: id,
            sectionId: null,
            questions: finalAssignment.questions
          }),
        });
        if (!res.ok) throw new Error("Failed to save final assignment");
      }

      console.log("✅ All changes saved successfully!");
      toast.success("Course updated successfully!");
      navigate("/instructor/dashboard");
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  const _renderAssignmentModal = () => {
    if (!isAssignmentModalOpen || !currentAssignment) return null;

    const addQuestion = () => {
      setCurrentAssignment({
        ...currentAssignment,
        questions: [
          ...currentAssignment.questions,
          {
            id: `temp-q-${Date.now()}`,
            content: "",
            difficulty: "Medium",
            choices: [
              { id: `temp-c1-${Date.now()}`, content: "", isCorrect: true },
              { id: `temp-c2-${Date.now()}`, content: "", isCorrect: false },
              { id: `temp-c3-${Date.now()}`, content: "", isCorrect: false },
              { id: `temp-c4-${Date.now()}`, content: "", isCorrect: false },
            ]
          }
        ]
      });
    };

    const removeQuestion = (qId) => {
      setCurrentAssignment({
        ...currentAssignment,
        questions: currentAssignment.questions.filter(q => q.id !== qId)
      });
    };

    const updateQuestion = (qId, field, value) => {
      setCurrentAssignment({
        ...currentAssignment,
        questions: currentAssignment.questions.map(q => 
          q.id === qId ? { ...q, [field]: value } : q
        )
      });
    };

    const updateChoice = (qId, cId, field, value) => {
      setCurrentAssignment({
        ...currentAssignment,
        questions: currentAssignment.questions.map(q => {
          if (q.id === qId) {
            return {
              ...q,
              choices: q.choices.map(c => {
                if (c.id === cId) {
                  return { ...c, [field]: value };
                }
                if (field === "isCorrect" && value === true) {
                  return { ...c, isCorrect: false }; // Only one correct answer
                }
                return c;
              })
            };
          }
          return q;
        })
      });
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {currentAssignment.isExisting ? "Edit Assignment" : "Add New Assignment"}
                </h3>
                <p className="text-xs text-slate-400">
                  {assignmentTarget.type === "section" ? "Section Quiz" : "Course Final Exam"}
                </p>
              </div>
            </div>
            <button onClick={closeAssignmentModal} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
              <X size={24} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Assign. Name</label>
                <input
                  type="text"
                  value={currentAssignment.name}
                  onChange={(e) => setCurrentAssignment({...currentAssignment, name: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                  placeholder="e.g., Mid-term Quiz"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <Clock size={14} className="text-purple-400"/> Duration (min)
                </label>
                <input
                  type="number"
                  value={currentAssignment.duration}
                  onChange={(e) => setCurrentAssignment({...currentAssignment, duration: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <Target size={14} className="text-purple-400"/> Grade to Pass
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentAssignment.gradeToPass}
                  onChange={(e) => setCurrentAssignment({...currentAssignment, gradeToPass: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Questions Header */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                Questions ({currentAssignment.questions.length})
              </h4>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all text-sm font-bold"
              >
                <Plus size={16} /> Add Question
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-6 pb-6">
              {currentAssignment.questions.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                  <p className="text-slate-500">No questions added yet. Click "+ Add Question" to start.</p>
                </div>
              ) : (
                currentAssignment.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 relative group">
                    <button 
                      onClick={() => removeQuestion(q.id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="flex items-start gap-4 mb-4">
                      <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                        {qIdx + 1}
                      </span>
                      <div className="flex-1">
                        <textarea
                          value={q.content}
                          onChange={(e) => updateQuestion(q.id, "content", e.target.value)}
                          placeholder="Type your question here..."
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors resize-none"
                          rows="2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                      {q.choices.map((choice, cIdx) => (
                        <div key={choice.id} className="flex items-center gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-800 focus-within:border-purple-500/50 transition-all">
                          <button
                            onClick={() => updateChoice(q.id, choice.id, "isCorrect", true)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${choice.isCorrect ? "bg-green-500 border-green-500 text-white" : "border-slate-600 hover:border-slate-400"}`}
                          >
                            {choice.isCorrect && <span className="text-[10px]">✓</span>}
                          </button>
                          <input
                            type="text"
                            value={choice.content}
                            onChange={(e) => updateChoice(q.id, choice.id, "content", e.target.value)}
                            placeholder={`Choice ${String.fromCharCode(65 + cIdx)}`}
                            className="bg-transparent border-none outline-none text-white text-sm flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50 rounded-b-2xl sticky bottom-0 z-10">
            <button
              onClick={closeAssignmentModal}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!currentAssignment.name) return toast.error("Name is required");
                if (currentAssignment.questions.length === 0) return toast.error("Add at least one question");
                saveAssignment(currentAssignment);
              }}
              className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg shadow-purple-500/20 transition-all"
            >
              Confirm Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading course...</div>
        </div>
      </div>
    );
  }

  const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#1a1a2e] to-[#0a0a14] p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={() => navigate("/instructor/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
        >
          <ChevronLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold text-white mb-2">Edit Course</h1>
        <p className="text-slate-400">Update your course content and details</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Course Details & Curriculum */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-lg">📝</span>
              </div>
              Course Details
            </h2>

            {/* Thumbnail Upload */}
            <div className="mb-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <label className="block text-sm font-semibold text-white mb-4">Course Thumbnail</label>
              <div className="flex items-start gap-6">
                <div className="relative w-64 h-36 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden group">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <Upload size={32} className="mb-2 opacity-20" />
                      <span className="text-xs uppercase tracking-widest font-bold opacity-30">No Image</span>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                      <Upload size={14} /> Change Image
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleThumbnailUpload(e.target.files[0])} />
                  </label>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-white font-bold text-sm">Update course thumbnail</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Set a thumbnail that captures attention. Recommended: 1280x720 pixels (16:9 ratio). 
                    Supported formats: .jpg, .png, .webp
                  </p>
                  {thumbnailFile && (
                    <button 
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview(formData.ThumbUrl || null);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold pt-1"
                    >
                      <Trash2 size={12} /> Reset to Original
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g., Linux Administration Bootcamp"
              />
            </div>

            {/* Intro */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Short Introduction
              </label>
              <textarea
                name="intro"
                value={formData.intro}
                onChange={handleChange}
                rows="2"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="Brief intro for course cards..."
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Full Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="Detailed description of what students will learn..."
              />
            </div>

            {/* Price and Level */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Giá (VNĐ)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Discount %
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Curriculum Card */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              Course Curriculum
            </h2>

            {/* Add Section */}
            <div className="mb-8 p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSection()}
                  placeholder="e.g., Section 1: Introduction to Linux"
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={addSection}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Section
                </button>
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-500 mb-2">📭 No sections yet</div>
                  <p className="text-slate-400 text-sm">
                    Add a section above to get started
                  </p>
                </div>
              ) : (
                sections.map((section) => (
                  <div
                    key={section.id}
                    className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden"
                  >
                    {/* Section Header */}
                    <div
                      className="p-4 bg-slate-800/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
                      onClick={() =>
                        setExpandedSectionId(
                          expandedSectionId === section.id ? null : section.id,
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">📖</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateSectionTitle(section.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent text-white font-semibold text-lg border-none outline-none w-full"
                            />
                            <p className="text-sm text-slate-400">
                              {section.lectures.length} lecture(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addLecture(section.id);
                            }}
                            className="p-2 text-green-500 hover:text-green-400 transition-colors"
                            title="Add lecture"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/instructor/create-assignment-from-bank?courseId=${id}&sectionId=${section.id}`);
                            }}
                            className="p-2 text-purple-500 hover:text-purple-400 transition-colors"
                            title="Add assignment"
                          >
                            <ClipboardList size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSection(section.id);
                            }}
                            className="p-2 text-red-500 hover:text-red-400 transition-colors"
                            title="Delete section"
                          >
                            <Trash2 size={18} />
                          </button>
                          <span className="material-symbols-outlined text-slate-400">
                            {expandedSectionId === section.id
                              ? "expand_less"
                              : "expand_more"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lectures List */}
                    {expandedSectionId === section.id && (
                      <div className="p-4 border-t border-slate-700 space-y-3">
                        {section.lectures.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-sm">
                            No lectures yet. Click + to add one.
                          </div>
                        ) : (
                          section.lectures.map((lecture) => (
                            <div
                              key={lecture.id}
                              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                            >
                              {/* Lecture Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={lecture.title}
                                    onChange={(e) =>
                                      updateLecture(
                                        section.id,
                                        lecture.id,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    className="bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-white font-medium w-full mb-2"
                                    placeholder="Lecture title"
                                  />
                                  <textarea
                                    value={lecture.content}
                                    onChange={(e) =>
                                      updateLecture(
                                        section.id,
                                        lecture.id,
                                        "content",
                                        e.target.value,
                                      )
                                    }
                                    rows="2"
                                    className="bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-white text-sm w-full resize-none"
                                    placeholder="Lecture description..."
                                  />
                                </div>
                                <button
                                  onClick={() =>
                                    removeLecture(section.id, lecture.id)
                                  }
                                  className="ml-3 text-red-500 hover:text-red-400"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              {/* Video Upload */}
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                  Video
                                </label>
                                {lecture.videoUrl ? (
                                  <div className="flex items-center gap-2 bg-slate-800/50 rounded p-2">
                                    <Video
                                      size={16}
                                      className="text-purple-400"
                                    />
                                    <span className="text-sm text-slate-300 flex-1">
                                      {lecture.videoFile?.name ||
                                        "Existing video"}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateLecture(
                                          section.id,
                                          lecture.id,
                                          "videoUrl",
                                          null,
                                        )
                                      }
                                      className="text-red-500 hover:text-red-400"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 border border-dashed border-slate-700 rounded cursor-pointer hover:border-purple-500 transition">
                                    <Upload
                                      size={16}
                                      className="text-slate-400"
                                    />
                                    <span className="text-sm text-slate-400">
                                      Upload Video
                                    </span>
                                    <input
                                      type="file"
                                      accept="video/*"
                                      onChange={(e) =>
                                        handleVideoUpload(
                                          section.id,
                                          lecture.id,
                                          e.target.files[0],
                                        )
                                      }
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>

                              {/* Materials */}
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                  Materials
                                </label>
                                <div className="space-y-2 mb-2">
                                  {(lecture.materials || []).map((material) => (
                                    <div
                                      key={material.id}
                                      className="flex items-center gap-2 bg-slate-800/50 rounded p-2"
                                    >
                                      <FileText
                                        size={16}
                                        className="text-blue-400"
                                      />
                                      <span className="text-sm text-slate-300 flex-1">
                                        {material.Name || material.name}
                                      </span>
                                      <button
                                        onClick={() =>
                                          removeMaterial(
                                            section.id,
                                            lecture.id,
                                            material.id,
                                          )
                                        }
                                        className="text-red-500 hover:text-red-400"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 border border-dashed border-slate-700 rounded cursor-pointer hover:border-blue-500 transition">
                                  <Upload
                                    size={16}
                                    className="text-slate-400"
                                  />
                                  <span className="text-sm text-slate-400">
                                    Add Material
                                  </span>
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
                                    onChange={(e) =>
                                      handleMaterialUpload(
                                        section.id,
                                        lecture.id,
                                        e.target.files[0],
                                      )
                                    }
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          ))
                        )}

                        {/* Assignments List */}
                        {section.assignments && section.assignments.length > 0 && (
                          <div className="pt-2">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Assignments</h5>
                            <div className="space-y-2">
                              {section.assignments.map((assignment) => (
                                <div key={assignment.id} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                      <ClipboardList size={16} />
                                    </div>
                                    <div>
                                      <h6 className="text-white font-medium text-sm">{assignment.name}</h6>
                                      <p className="text-[10px] text-slate-400">{assignment.questions.length} questions • {assignment.duration} min</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => openAssignmentModal("section", section.id, assignment)}
                                      className="p-1.5 text-slate-400 hover:text-white"
                                    >
                                      <Upload size={14} />
                                    </button>
                                    <button 
                                      onClick={() => removeAssignment("section", section.id, assignment.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-500"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Final Assignment Section */}
              <div className="pt-8 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Target size={20} />
                    </div>
                    Final Course Assignment
                  </h3>
                  {!finalAssignment && (
                    <button
                      onClick={() => navigate(`/instructor/create-assignment-from-bank?courseId=${id}`)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all text-sm font-bold flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Final Exam
                    </button>
                  )}
                </div>

                {finalAssignment ? (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                        <ClipboardList size={24} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{finalAssignment.name}</h4>
                        <p className="text-sm text-slate-400">
                          {finalAssignment.questions.length} questions • {finalAssignment.duration} minutes • Pass grade: {finalAssignment.gradeToPass}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => navigate(`/instructor/create-assignment-from-bank?courseId=${id}&assignmentId=${finalAssignment.id}`)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors border border-slate-700"
                      >
                        Edit Exam
                      </button>
                      <button 
                        onClick={() => removeAssignment("course", id, finalAssignment.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 bg-slate-800/10 rounded-xl border border-dashed border-slate-700 text-center">
                    <p className="text-slate-500 text-sm">Add a comprehensive exam that learners must pass to complete the course.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-6 sticky top-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Course Summary
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sections</span>
                <span className="text-white font-semibold">
                  {sections.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Lectures</span>
                <span className="text-white font-semibold">
                  {sections.reduce((sum, s) => sum + s.lectures.length, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Price</span>
                <span className="text-white font-semibold">
                  {(formData.price || 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-green-400 font-semibold">
                    -{formData.discount}%
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
              >
                <Save size={20} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              <button
                onClick={() => navigate("/instructor/dashboard")}
                className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      {_renderAssignmentModal()}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
}
