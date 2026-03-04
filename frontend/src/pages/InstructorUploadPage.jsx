import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Upload, Plus, Trash2, Save, X, Eye, Copy } from "lucide-react";
import Header from "../components/Header/Header";

export default function InstructorUploadPage() {
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [coursePrice, setCoursePrice] = useState("");
  const [courseLevel, setCourseLevel] = useState("Beginner");
  const [sections, setSections] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const addSection = () => {
    if (!newSectionTitle.trim()) {
      toast.error("Please enter a section title");
      return;
    }

    const newSection = {
      id: Date.now(),
      title: newSectionTitle,
      lectures: [],
    };

    setSections([...sections, newSection]);
    setNewSectionTitle("");
    toast.success("Section added!");
  };

  const addLecture = (sectionId, lectureFile) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lectures: [
              ...section.lectures,
              {
                id: Date.now(),
                title: lectureFile?.name || "Untitled Lecture",
                file: lectureFile,
                uploadProgress: 0,
              },
            ],
          };
        }
        return section;
      }),
    );
    toast.success("Lecture added!");
  };

  const removeLecture = (sectionId, lectureId) => {
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

  const removeSection = (sectionId) => {
    setSections(sections.filter((sec) => sec.id !== sectionId));
    toast.success("Section removed");
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim()) {
      toast.error("Please enter a course title");
      return;
    }

    if (sections.length === 0) {
      toast.error("Please add at least one section with lectures");
      return;
    }

    const hasLectures = sections.some((sec) => sec.lectures.length > 0);
    if (!hasLectures) {
      toast.error("Please add at least one lecture to a section");
      return;
    }

    setIsCreating(true);

    try {
      // TODO: Call API to create course
      console.log("Creating course:", {
        title: courseTitle,
        description: courseDescription,
        price: coursePrice,
        level: courseLevel,
        sections,
      });

      toast.success("Course created successfully!");
      // Redirect to course page or dashboard
      setTimeout(() => {
        navigate("/instructor-dashboard");
      }, 1500);
    } catch (error) {
      toast.error(error.message || "Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#1a1a2e] to-[#0a0a14]">
      <Header />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Create a New Course
          </h1>
          <p className="text-slate-400">
            Build an engaging learning experience for your students
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Basic Info Card */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                Course Details
              </h2>

              {/* Course Title */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Advanced JavaScript Mastery"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Course Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">
                  Course Description
                </label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Describe what students will learn..."
                  rows="4"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              {/* Price and Level Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Price (VND)
                  </label>
                  <input
                    type="number"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Course Level
                  </label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sections & Lectures Card */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                  <span className="text-lg">📚</span>
                </div>
                Course Content
              </h2>

              {/* Add Section Input */}
              <div className="mb-8 p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSection()}
                    placeholder="e.g., Section 1: JavaScript Fundamentals"
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
                    <div className="text-slate-500 mb-2">
                      📭 No sections yet
                    </div>
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
                        onClick={() =>
                          setExpandedSectionId(
                            expandedSectionId === section.id
                              ? null
                              : section.id,
                          )
                        }
                        className="p-4 bg-slate-800/50 cursor-pointer hover:bg-slate-800/70 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">📖</span>
                          <div>
                            <h3 className="text-white font-semibold">
                              {section.title}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {section.lectures.length} lecture(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400">
                            {expandedSectionId === section.id
                              ? "expand_less"
                              : "expand_more"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSection(section.id);
                            }}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Section Content - Lectures */}
                      {expandedSectionId === section.id && (
                        <div className="p-4 border-t border-slate-700 space-y-3">
                          {/* Lectures List */}
                          {section.lectures.map((lecture) => (
                            <div
                              key={lecture.id}
                              className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg hover:bg-slate-700/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <span className="material-symbols-outlined text-purple-500">
                                  play_circle
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">
                                    {lecture.title}
                                  </p>
                                  {lecture.uploadProgress > 0 &&
                                    lecture.uploadProgress < 100 && (
                                      <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-purple-600 transition-all"
                                          style={{
                                            width: `${lecture.uploadProgress}%`,
                                          }}
                                        />
                                      </div>
                                    )}
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  removeLecture(section.id, lecture.id)
                                }
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}

                          {/* Add Lecture Button */}
                          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-700 rounded-lg hover:border-purple-500 hover:bg-slate-800/30 transition-colors cursor-pointer group">
                            <Upload
                              size={20}
                              className="text-slate-400 group-hover:text-purple-500 transition-colors"
                            />
                            <span className="text-sm text-slate-400 group-hover:text-purple-500 transition-colors font-medium">
                              Upload Lecture Video
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  addLecture(section.id, e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview & Action */}
          <div>
            {/* Course Preview Card */}
            <div className="sticky top-24 bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-slate-700/30 rounded-2xl overflow-hidden">
              {/* Preview Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-purple-600 to-blue-600 relative group cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-4xl">
                    image
                  </span>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                  {courseTitle || "Your Course Title"}
                </h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {courseDescription || "Course description will appear here"}
                </p>

                {/* Course Stats */}
                <div className="space-y-3 mb-6 py-4 border-y border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">📚 Sections:</span>
                    <span className="text-white font-semibold">
                      {sections.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">🎬 Lectures:</span>
                    <span className="text-white font-semibold">
                      {sections.reduce(
                        (acc, sec) => acc + sec.lectures.length,
                        0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">💰 Price:</span>
                    <span className="text-white font-semibold">
                      {coursePrice ? `${coursePrice.toLocaleString()}₫` : "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">📊 Level:</span>
                    <span className="text-white font-semibold">
                      {courseLevel}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCreateCourse}
                    disabled={isCreating}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {isCreating ? "Creating..." : "Create Course"}
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 flex items-start gap-2">
                    <span>ℹ️</span>
                    <span>
                      Review course details before publishing. You can edit
                      later.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
