import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Target
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InstructorCreateCoursePage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Basic course info
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    intro: "",
    price: "",
    discount: 0,
    level: "Beginner",
    category: "", // Backend will use default if empty
  });

  // Curriculum management
  const [sections, setSections] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Assignment states
  const [finalAssignment, setFinalAssignment] = useState(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

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
    };

    setSections([...sections, newSection]);
    setNewSectionTitle("");
    setExpandedSectionId(newSection.id);
    toast.success("Section added!");
  };

  const removeSection = (sectionId) => {
    triggerConfirm(
      "Delete Section",
      "Are you sure you want to delete this section and all its contents?",
      () => {
        setSections(sections.filter((sec) => sec.id !== sectionId));
        toast.success("Section removed");
      }
    );
  };

  const updateSectionTitle = (sectionId, newTitle) => {
    setSections(
      sections.map((sec) =>
        sec.id === sectionId ? { ...sec, title: newTitle } : sec,
      ),
    );
  };

  const handleThumbnailUpload = (file) => {
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    toast.success("Thumbnail selected");
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

  const removeLecture = (sectionId, lectureId) => {
    triggerConfirm(
      "Delete Lecture",
      "Are you sure you want to delete this lecture?",
      () => {
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
              lec.id === lectureId ? { ...lec, [field]: value } : lec,
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

    toast.success("Video selected");
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
                      file: file,
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

  const removeMaterial = (sectionId, lectureId, materialId) => {
    triggerConfirm(
      "Delete Material",
      "Are you sure you want to delete this material?",
      () => {
        setSections(
          sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                lectures: section.lectures.map((lec) => {
                  if (lec.id === lectureId) {
                    return {
                      ...lec,
                      materials: (lec.materials || []).filter((m) => m.id !== materialId),
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

  // Assignment management
  const openAssignmentModal = (type, parentId, existingAssignment = null) => {
    if (existingAssignment) {
      setCurrentAssignment(JSON.parse(JSON.stringify(existingAssignment)));
    } else {
      setCurrentAssignment({
        id: `temp-asg-${Date.now()}`,
        name: "",
        duration: 30,
        gradeToPass: 8,
        questions: [],
        type,
        parentId,
        isExisting: false,
      });
    }
    setIsAssignmentModalOpen(true);
  };

  const closeAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setCurrentAssignment(null);
  };

  const saveAssignment = (assignmentData) => {
    if (assignmentData.type === "course") {
      setFinalAssignment({ ...assignmentData, isModified: true });
    } else {
      setSections(prev => prev.map(s => {
        if (s.id === assignmentData.parentId) {
          const assignments = s.assignments || [];
          const exists = assignments.find(a => a.id === assignmentData.id);
          return {
            ...s,
            assignments: exists 
              ? assignments.map(a => a.id === assignmentData.id ? { ...assignmentData, isModified: true } : a)
              : [...assignments, { ...assignmentData, isModified: true }]
          };
        }
        return s;
      }));
    }
    closeAssignmentModal();
    toast.success("Assignment updated locally");
  };

  const removeAssignment = (type, parentId, assignmentId) => {
    triggerConfirm(
      "Delete Assignment",
      "Are you sure you want to remove this assignment?",
      () => {
        if (type === "course") {
          setFinalAssignment(null);
        } else {
          setSections(prev => prev.map(s => {
            if (s.id === parentId) {
              return {
                ...s,
                assignments: (s.assignments || []).filter(a => a.id !== assignmentId)
              };
            }
            return s;
          }));
        }
        toast.success("Assignment removed");
      }
    );
  };

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
    const toastId = toast.loading("Creating course and uploading files...");

    try {
      // Step 1: Create basic course shell
      const res = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          intro: formData.intro || formData.description.substring(0, 500),
          price: parseFloat(formData.price) || 0,
          discount: parseFloat(formData.discount) || 0,
          level: formData.level,
        }),
      });

      if (!res.ok) throw new Error("Failed to create course basics");
      const { data: newCourse } = await res.json();
      const courseId = newCourse.id;

      // Step 1.5: Upload Course Thumbnail if exists
      if (thumbnailFile) {
        toast.loading("Uploading course thumbnail...", { id: toastId });
        const thumbFormData = new FormData();
        thumbFormData.append("file", thumbnailFile);
        thumbFormData.append("courseId", courseId);

        const thumbRes = await fetch(`${API_URL}/upload/thumbnail`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: thumbFormData,
        });
        if (!thumbRes.ok) console.error("Thumbnail upload failed");
      }

      // Step 2: Create sections and lectures sequentially
      for (const section of sections) {
        toast.loading(`Creating section: ${section.title}...`, { id: toastId });
        const secRes = await fetch(`${API_URL}/courses/${courseId}/sections`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ title: section.title }),
        });
        if (!secRes.ok) throw new Error(`Failed to create section: ${section.title}`);
        const { data: newSection } = await secRes.json();
        const sectionId = newSection.Id;

        for (const lecture of section.lectures) {
          toast.loading(`Creating lecture: ${lecture.title}...`, { id: toastId });
          const lecRes = await fetch(`${API_URL}/courses/sections/${sectionId}/lectures`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              title: lecture.title,
              content: lecture.content || "",
            }),
          });
          if (!lecRes.ok) throw new Error(`Failed to create lecture: ${lecture.title}`);
          const { data: newLecture } = await lecRes.json();
          const lectureId = newLecture.Id;

          // Step 3: Upload files for this lecture
          if (lecture.videoFile) {
            toast.loading(`Uploading video for: ${lecture.title}...`, { id: toastId });
            const videoFormData = new FormData();
            videoFormData.append("file", lecture.videoFile);
            videoFormData.append("lectureId", lectureId);
            if (lecture.duration) {
              videoFormData.append("duration", lecture.duration);
            }

            const vRes = await fetch(`${API_URL}/upload/video`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: videoFormData,
            });
            if (!vRes.ok) console.error(`Video upload failed for ${lecture.title}`);
          }

          for (const material of lecture.materials) {
            if (material.file) {
              toast.loading(`Uploading material: ${material.Name}...`, { id: toastId });
              const matFormData = new FormData();
              matFormData.append("file", material.file);
              matFormData.append("lectureId", lectureId);

              const mRes = await fetch(`${API_URL}/upload/document`, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: matFormData,
              });
              if (!mRes.ok) console.error(`Material upload failed: ${material.Name}`);
            }
          }
        }

        // Step 2.5: Create assignments for this section
        for (const assignment of (section.assignments || [])) {
          toast.loading(`Creating assignment: ${assignment.name}...`, { id: toastId });
          const assignRes = await fetch(`${API_URL}/quiz`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              name: assignment.name,
              duration: assignment.duration,
              gradeToPass: assignment.gradeToPass,
              sectionId: sectionId,
              courseId: courseId,
              questions: assignment.questions
            }),
          });
          if (!assignRes.ok) throw new Error(`Failed to create assignment: ${assignment.name}`);
        }
      }

      // Step 6: Create Final Course Assignment
      if (finalAssignment) {
        toast.loading(`Creating final exam: ${finalAssignment.name}...`, { id: toastId });
        const finalRes = await fetch(`${API_URL}/quiz`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: finalAssignment.name,
            duration: finalAssignment.duration,
            gradeToPass: finalAssignment.gradeToPass,
            courseId: courseId,
            sectionId: null,
            questions: finalAssignment.questions
          }),
        });
        if (!finalRes.ok) throw new Error("Failed to create final exam");
      }

      toast.success("Course created successfully!", { id: toastId });
      navigate("/instructor/dashboard");
    } catch (err) {
      console.error("Creation error:", err);
      toast.error(err.message || "Failed to create course", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

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
        <h1 className="text-4xl font-bold text-white mb-2">Create New Course</h1>
        <p className="text-slate-400">Set up your course details and curriculum</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basics */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span>📝</span>
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
                        setThumbnailPreview(null);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold pt-1"
                    >
                      <Trash2 size={12} /> Remove Image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Course Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g., Ultimate Web Development Bootcamp"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="What will students learn?"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Giá (VNĐ)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Discount %</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Curriculum */}
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <span>📚</span>
              </div>
              Course Curriculum
            </h2>

            <div className="mb-8 p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSection()}
                  placeholder="e.g., Section 1: Introduction"
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={addSection}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
                >
                  <Plus size={20} /> Add
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
                  <div
                    className="p-4 bg-slate-800/50 cursor-pointer flex justify-between items-center"
                    onClick={() => setExpandedSectionId(expandedSectionId === section.id ? null : section.id)}
                  >
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
                          className="bg-transparent text-white font-semibold text-lg outline-none w-full"
                        />
                        <p className="text-sm text-slate-400">{section.lectures.length} lecture(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); addLecture(section.id); }} className="p-2 text-green-500 hover:text-green-400" title="Add lecture"><Plus size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); openAssignmentModal("section", section.id); }} className="p-2 text-purple-500 hover:text-purple-400" title="Add assignment"><ClipboardList size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); removeSection(section.id); }} className="p-2 text-red-500 hover:text-red-400" title="Delete section"><Trash2 size={18} /></button>
                       <span className={`material-symbols-outlined text-slate-400 transition-transform ${expandedSectionId === section.id ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                  </div>

                  {expandedSectionId === section.id && (
                    <div className="p-4 border-t border-slate-700 space-y-3">
                      {section.lectures.map((lecture) => (
                        <div key={lecture.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                           <div className="flex justify-between mb-3">
                             <div className="flex-1 space-y-2">
                               <input
                                 type="text"
                                 value={lecture.title}
                                 onChange={(e) => updateLecture(section.id, lecture.id, "title", e.target.value)}
                                 className="bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-white w-full"
                                 placeholder="Lecture title"
                               />
                               <textarea
                                 value={lecture.content}
                                 onChange={(e) => updateLecture(section.id, lecture.id, "content", e.target.value)}
                                 rows="2"
                                 className="bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-white text-sm w-full resize-none"
                                 placeholder="Add some notes for this lecture..."
                               />
                             </div>
                             <button onClick={() => removeLecture(section.id, lecture.id)} className="ml-3 text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Video</label>
                                {lecture.videoUrl ? (
                                  <div className="flex items-center gap-2 bg-slate-800/50 rounded p-2 border border-purple-500/30">
                                    <Video size={16} className="text-purple-400" />
                                    <span className="text-xs text-slate-300 truncate flex-1">{lecture.videoFile?.name}</span>
                                    <button onClick={() => updateLecture(section.id, lecture.id, "videoUrl", null)} className="text-red-500"><X size={14} /></button>
                                  </div>
                                ) : (
                                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/30 border border-dashed border-slate-700 rounded cursor-pointer hover:border-purple-500 transition text-slate-400 hover:text-purple-400">
                                    <Upload size={14} /> <span className="text-xs">Upload Video</span>
                                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(section.id, lecture.id, e.target.files[0])} />
                                  </label>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Materials</label>
                                <div className="space-y-1 mb-2">
                                  {lecture.materials.map(m => (
                                    <div key={m.id} className="flex items-center gap-2 bg-slate-800/50 rounded p-1.5 border border-blue-500/30">
                                      <FileText size={14} className="text-blue-400" />
                                      <span className="text-[10px] text-slate-300 truncate flex-1">{m.Name}</span>
                                      <button onClick={() => removeMaterial(section.id, lecture.id, m.id)} className="text-red-500"><X size={12} /></button>
                                    </div>
                                  ))}
                                </div>
                                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/30 border border-dashed border-slate-700 rounded cursor-pointer hover:border-blue-500 transition text-slate-400 hover:text-blue-400">
                                  <Upload size={14} /> <span className="text-xs">Add File</span>
                                  <input type="file" className="hidden" onChange={(e) => handleMaterialUpload(section.id, lecture.id, e.target.files[0])} />
                                </label>
                              </div>
                           </div>
                        </div>
                      ))}

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
                                  <button onClick={() => openAssignmentModal("section", section.id, assignment)} className="p-1.5 text-slate-400 hover:text-white"><Upload size={14} /></button>
                                  <button onClick={() => removeAssignment("section", section.id, assignment.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final Assignment Section */}
            <div className="pt-8 border-t border-slate-800 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Target size={20} />
                  </div>
                  Final Course Assignment
                </h3>
                {!finalAssignment && (
                  <button
                    onClick={() => openAssignmentModal("course", null)}
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
                    <button onClick={() => openAssignmentModal("course", null, finalAssignment)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors border border-slate-700">Edit Exam</button>
                    <button onClick={() => removeAssignment("course", null, finalAssignment.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                  </div>
                </div>
              ) : (
                <div className="py-8 bg-slate-800/10 rounded-xl border border-dashed border-slate-700 text-center">
                  <p className="text-slate-500 text-sm">Add a comprehensive exam that learners must pass to finish the course.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-6 sticky top-8">
            <h3 className="text-xl font-bold text-white mb-6">Publish Course</h3>
            
            <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Sections</span>
                 <span className="text-white font-bold">{sections.length}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Total Lectures</span>
                 <span className="text-white font-bold">{sections.reduce((s, c) => s + c.lectures.length, 0)}</span>
               </div>
               <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                 <span className="text-slate-400 font-bold">Price</span>
                 <span className="text-2xl font-black text-white">{(Number(formData.price) || 0).toLocaleString('vi-VN')}₫</span>
               </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} /> {isSaving ? "Creating..." : "Create Course"}
              </button>
              <button onClick={() => navigate("/instructor/dashboard")} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      {renderAssignmentModal()}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );

  function renderAssignmentModal() {
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
            const updatedChoices = q.choices.map(c => {
              if (field === "isCorrect") {
                return { ...c, isCorrect: c.id === cId };
              }
              return c.id === cId ? { ...c, [field]: value } : c;
            });
            return { ...q, choices: updatedChoices };
          }
          return q;
        })
      });
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl">
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Manage Assignment</h3>
                <p className="text-slate-400 text-xs">Configure quiz details and questions</p>
              </div>
            </div>
            <button onClick={closeAssignmentModal} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Basic Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Quiz Name</label>
                <input
                  type="text"
                  value={currentAssignment.name}
                  onChange={(e) => setCurrentAssignment({...currentAssignment, name: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                  placeholder="e.g., Section 1 Quiz"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Duration (min)</label>
                <input
                  type="number"
                  value={currentAssignment.duration}
                  onChange={(e) => setCurrentAssignment({...currentAssignment, duration: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Pass Grade (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={currentAssignment.gradeToPass}
                  onChange={(e) => setCurrentAssignment({...currentAssignment, gradeToPass: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  Questions ({currentAssignment.questions.length})
                </h4>
                <button
                  onClick={addQuestion}
                  className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 text-sm font-bold rounded-lg border border-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Add Question
                </button>
              </div>

              {currentAssignment.questions.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                  <p className="text-slate-500">No questions added yet. Click the button above to start.</p>
                </div>
              ) : (
                currentAssignment.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 relative group transition-all hover:bg-slate-800/40">
                    <div className="absolute -left-3 top-6 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-purple-400 shadow-xl">
                      {qIdx + 1}
                    </div>
                    
                    <div className="flex items-start justify-between mb-6 pl-6">
                      <div className="flex-1 mr-4">
                        <textarea
                          value={q.content}
                          onChange={(e) => updateQuestion(q.id, "content", e.target.value)}
                          placeholder="Question text..."
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors resize-none"
                          rows="2"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={q.difficulty}
                          onChange={(e) => updateQuestion(q.id, "difficulty", e.target.value)}
                          className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                        <button
                          onClick={() => removeQuestion(q.id)}
                          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
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
          <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50 rounded-b-2xl">
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
              Save Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }
}
