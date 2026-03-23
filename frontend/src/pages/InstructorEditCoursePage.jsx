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
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";

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
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState(null);

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Course not found");

      const data = await res.json();
      const course = data.data || data;

      // Set basic info
      setFormData({
        title: course.Title || "",
        description: course.Description || "",
        intro: course.Intro || "",
        price: course.Price ?? "",
        discount: course.Discount ?? 0,
        level: course.Level || "Beginner",
      });

      // Set sections and lectures
      // Handle both raw LectureMaterial format and transformed VideoUrl/Materials format
      const sectionsData = (course.Sections || []).map((section) => ({
        id: section.Id,
        title: section.Title,
        isExisting: true,
        lectures: (section.Lectures || []).map((lecture) => {
          // Support both formats from backend
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

      setSections(sectionsData);
    } catch {
      toast.error("Failed to load course");
      navigate("/instructor/dashboard");
    } finally {
      setIsLoading(false);
    }
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
    if (!confirm("Are you sure you want to delete this section?")) return;

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

  // Lecture management
  const addLecture = (sectionId) => {
    const lectureTitle = prompt("Enter lecture title:");
    if (!lectureTitle || !lectureTitle.trim()) return;

    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lectures: [
              ...section.lectures,
              {
                id: `temp-${Date.now()}`,
                title: lectureTitle,
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
    toast.success("Lecture added!");
  };

  const removeLecture = async (sectionId, lectureId) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;

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

    // Set both videoFile and videoUrl in a single state update
    // to avoid stale closure issues
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
                    isModified: true,
                  }
                : lec,
            ),
          };
        }
        return section;
      }),
    );
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

      if (!basicInfoRes.ok) {
        throw new Error("Failed to update basic course info");
      }

      console.log("✅ Course info updated");

      // Step 2: Process sections (only new or modified)
      const sectionsToProcess = sections.filter(
        (s) => !s.isExisting || s.isModified,
      );
      const lecturesToProcess = sections.flatMap((s) =>
        s.lectures.filter((l) => !l.isExisting || l.isModified),
      );
      const filesToUpload = sections.flatMap((s) =>
        s.lectures.filter(
          (l) => l.videoFile || l.materials?.some((m) => m.isNew),
        ),
      );

      console.log(
        `📦 Processing: ${sectionsToProcess.length} sections, ${lecturesToProcess.length} lectures, ${filesToUpload.length} file uploads`,
      );

      for (const section of sections) {
        let sectionId = section.id;

        // Create new section
        if (!section.isExisting) {
          const sectionRes = await fetch(`${API_URL}/courses/${id}/sections`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ title: section.title }),
          });

          if (!sectionRes.ok)
            throw new Error(`Failed to create section: ${section.title}`);

          const sectionData = await sectionRes.json();
          sectionId = sectionData.data.Id;
        }
        // Update existing section ONLY if modified
        else if (section.isModified) {
          const updateRes = await fetch(
            `${API_URL}/courses/sections/${sectionId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ title: section.title }),
            },
          );

          if (!updateRes.ok)
            throw new Error(`Failed to update section: ${section.title}`);
        }

        // Step 3: Process lectures in this section (only new or modified)
        for (const lecture of section.lectures) {
          let lectureId = lecture.id;

          // Create new lecture
          if (!lecture.isExisting) {
            const lectureRes = await fetch(
              `${API_URL}/courses/sections/${sectionId}/lectures`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  title: lecture.title,
                  content: lecture.content || "",
                }),
              },
            );

            if (!lectureRes.ok)
              throw new Error(`Failed to create lecture: ${lecture.title}`);

            const lectureData = await lectureRes.json();
            lectureId = lectureData.data.Id;
          }
          // Update existing lecture ONLY if modified
          else if (lecture.isModified) {
            const updateRes = await fetch(
              `${API_URL}/courses/lectures/${lectureId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  title: lecture.title,
                  content: lecture.content || "",
                }),
              },
            );

            if (!updateRes.ok)
              throw new Error(`Failed to update lecture: ${lecture.title}`);
          }

          // Step 4: Upload video if new video file
          if (lecture.videoFile) {
            console.log(`📹 Uploading video for: ${lecture.title}`);
            const videoFormData = new FormData();
            videoFormData.append("file", lecture.videoFile);
            videoFormData.append("lectureId", lectureId);

            const videoRes = await fetch(`${API_URL}/upload/video`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: videoFormData,
            });

            if (!videoRes.ok) {
              let uploadError = "Failed to upload video";
              try {
                const errorData = await videoRes.json();
                uploadError =
                  errorData?.error || errorData?.message || uploadError;
              } catch {
                // Keep default error message if response body is not JSON
              }
              throw new Error(`${uploadError} for lecture: ${lecture.title}`);
            } else {
              console.log(`✅ Video uploaded for: ${lecture.title}`);
            }
          }

          // Step 5: Upload new materials
          const newMaterials = (lecture.materials || []).filter(
            (m) => m.isNew && m.file,
          );
          if (newMaterials.length > 0) {
            console.log(
              `📄 Uploading ${newMaterials.length} material(s) for: ${lecture.title}`,
            );
          }

          for (const material of newMaterials) {
            const matFormData = new FormData();
            matFormData.append("file", material.file);
            matFormData.append("lectureId", lectureId);

            const matRes = await fetch(`${API_URL}/upload/document`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: matFormData,
            });

            if (!matRes.ok) {
              let uploadError = "Failed to upload material";
              try {
                const errorData = await matRes.json();
                uploadError =
                  errorData?.error || errorData?.message || uploadError;
              } catch {
                // Keep default error message if response body is not JSON
              }
              throw new Error(`${uploadError}: ${material.Name}`);
            } else {
              console.log(`✅ Material uploaded: ${material.Name}`);
            }
          }
        }
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
                  Price (USD)
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
                      </div>
                    )}
                  </div>
                ))
              )}
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
                  ${formData.price || "0.00"}
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
    </div>
  );
}
