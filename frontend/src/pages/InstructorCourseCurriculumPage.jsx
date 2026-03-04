import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Trash2, Edit2, Upload } from "lucide-react";

export default function InstructorCourseCurriculumPage() {
  const navigate = useNavigate();
  const [courseBasics, setCourseBasics] = useState(null);
  const [sections, setSections] = useState([
    {
      id: 1,
      title: "Section 1: Fundamentals",
      lectures: [
        { id: 1, title: "Introduction to React", duration: "12:45" },
        { id: 2, title: "Components & JSX", duration: "18:30" },
      ],
    },
  ]);

  const [editingSection, setEditingSection] = useState(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSections, setExpandedSections] = useState(new Set([1]));

  useEffect(() => {
    const basics = sessionStorage.getItem("courseBasics");
    if (basics) {
      setCourseBasics(JSON.parse(basics));
    } else {
      navigate("/instructor/create-course");
    }
  }, [navigate]);

  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    const newId = Math.max(...sections.map((s) => s.id), 0) + 1;
    setSections((prev) => [
      ...prev,
      { id: newId, title: newSectionTitle, lectures: [] },
    ]);
    setNewSectionTitle("");
    setShowNewSection(false);
    setExpandedSections((prev) => new Set([...prev, newId]));
  };

  const deleteSection = (sectionId) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const addLecture = (sectionId) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lectures: [
                ...section.lectures,
                {
                  id: Math.max(...section.lectures.map((l) => l.id), 0) + 1,
                  title: "New Lecture",
                  duration: "0:00",
                  isEditing: true,
                },
              ],
            }
          : section,
      ),
    );
  };

  const deleteLecture = (sectionId, lectureId) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lectures: section.lectures.filter((l) => l.id !== lectureId),
            }
          : section,
      ),
    );
  };

  const updateLecture = (sectionId, lectureId, field, value) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lectures: section.lectures.map((lecture) =>
                lecture.id === lectureId ? { ...lecture, [field]: value } : lecture,
              ),
            }
          : section,
      ),
    );
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const addLectureFromVideo = (sectionId, file) => {
    if (!file) return;
    
    const videoName = file.name.replace(/\.[^/.]+$/, "");
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lectures: [
                ...section.lectures,
                {
                  id: Date.now(),
                  title: videoName,
                  file: file,
                  duration: "0:00",
                  isVideo: true,
                },
              ],
            }
          : section,
      ),
    );
  };

  const handleContinue = () => {
    if (sections.length === 0) {
      alert("Please add at least one section");
      return;
    }
    sessionStorage.setItem("courseCurriculum", JSON.stringify(sections));
    navigate("/instructor/create-course/review");
  };

  if (!courseBasics) return null;

  return (
    <div className="min-h-screen bg-background-dark p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            🚀
          </div>
          <h1 className="text-3xl font-bold text-white">FlyUpProject</h1>
        </div>

        {/* Progress Tabs */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <span className="text-slate-400 font-semibold">Basics</span>
          </div>
          <div className="h-1 w-12 bg-primary"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="text-white font-semibold">Curriculum & Videos</span>
          </div>
          <div className="h-1 w-12 bg-slate-700"></div>
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-bold">
              3
            </div>
            <span className="text-slate-400 font-semibold">Review</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Course Curriculum</h2>
          <p className="text-slate-400">
            Organize your course into sections and lectures. Each section should contain related lessons.
          </p>
        </div>

        {/* Course Title Display */}
        <div className="mb-8 p-6 bg-slate-900 border border-slate-800 rounded-lg">
          <p className="text-slate-500 text-sm mb-2">Course: </p>
          <h3 className="text-2xl font-bold text-white">{courseBasics?.title}</h3>
        </div>

        {/* Sections */}
        <div className="space-y-4 mb-8">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between p-6 hover:bg-slate-800/50 transition cursor-pointer">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="text-slate-400 hover:text-white transition"
                  >
                    <svg
                      className={`w-5 h-5 transition ${
                        expandedSections.has(section.id) ? "rotate-90" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                    </svg>
                  </button>

                  <div>
                    <h4 className="text-white font-bold text-lg">
                      Section {index + 1}: {section.title}
                    </h4>
                    <p className="text-slate-400 text-sm">
                      {section.lectures.length} lecture{section.lectures.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSection(section.id)}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                    title="Edit section"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition"
                    title="Delete section"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Section Content */}
              {expandedSections.has(section.id) && (
                <div className="border-t border-slate-800 bg-slate-950/50 p-6 space-y-3">
                  {/* Lectures */}
                  {section.lectures.map((lecture, lectureIndex) => (
                    <div
                      key={lecture.id}
                      className="flex items-center justify-between p-4 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-slate-500 font-mono text-sm">
                          {lectureIndex + 1}
                        </span>
                        <div className="text-primary">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            <path d="M9.5 5.5v7.828a1 1 0 01-.5.866l-3.5-2.03a1 1 0 01-.5-.866V5.5z" />
                          </svg>
                        </div>
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
                            className="w-full bg-transparent text-white font-medium outline-none"
                          />
                        </div>
                        <span className="text-slate-500 text-sm">
                          {lecture.duration}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteLecture(section.id, lecture.id)}
                        className="p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition ml-2"
                        title="Delete lecture"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Add Lecture Button */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => addLecture(section.id)}
                      className="py-3 px-4 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-primary hover:border-primary transition flex items-center justify-center gap-2 font-semibold"
                    >
                      <Plus size={18} />
                      Add Lecture
                    </button>
                    
                    <label className="py-3 px-4 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-green-400 hover:border-green-500 transition flex items-center justify-center gap-2 font-semibold cursor-pointer group">
                      <Upload size={18} className="group-hover:text-green-400" />
                      Upload Video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            addLectureFromVideo(section.id, e.target.files[0]);
                          }
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Section */}
        {!showNewSection ? (
          <button
            onClick={() => setShowNewSection(true)}
            className="w-full py-4 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-primary hover:border-primary transition flex items-center justify-center gap-2 font-semibold group hover:bg-slate-900/50"
          >
            <Plus size={20} />
            Add New Section
          </button>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <label className="block text-slate-300 text-sm font-medium mb-3">
              Section Title
            </label>
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") addSection();
              }}
              placeholder="e.g., Section 2: Advanced Topics"
              autoFocus
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={addSection}
                className="flex-1 py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition"
              >
                Add Section
              </button>
              <button
                onClick={() => {
                  setShowNewSection(false);
                  setNewSectionTitle("");
                }}
                className="flex-1 py-2 px-4 border border-slate-700 text-slate-300 font-semibold rounded-lg hover:border-slate-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800">
        <button
          onClick={() => navigate("/instructor/create-course")}
          className="px-6 py-3 text-slate-300 font-semibold hover:text-white transition"
        >
          Back to Basics
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition"
        >
          Continue to Review
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
