import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "../components/Header/Header";
import { createCourse } from "../services/courseService";
import useAuth from "../hooks/useAuth";

export default function InstructorCourseReviewPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [courseBasics, setCourseBasics] = useState(null);
  const [courseCurriculum, setCourseCurriculum] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const basics = sessionStorage.getItem("courseBasics");
    const curriculum = sessionStorage.getItem("courseCurriculum");
    
    if (basics && curriculum) {
      setCourseBasics(JSON.parse(basics));
      setCourseCurriculum(JSON.parse(curriculum));
    } else {
      navigate("/instructor/create-course");
    }
  }, [navigate]);

  const handleCreateCourse = async () => {
    setIsCreating(true);
    try {
      if (!accessToken) {
        alert("You must be logged in to create a course");
        return;
      }

      // Prepare course data for API
      const courseData = {
        title: courseBasics.title,
        description: courseBasics.description,
        price: parseFloat(courseBasics.price) || 0,
        level: courseBasics.level,
        category: courseBasics.category,
        sections: courseCurriculum.map((section, index) => ({
          title: section.title,
          index: index,
          lectures: (section.lectures || []).map((lecture, lectureIndex) => ({
            title: lecture.title,
            index: lectureIndex,
            duration: lecture.duration || "0:00",
            file: lecture.file, // Will be handled as FormData if needed
          }))
        }))
      };

      console.log("Creating course with:", courseData);

      // Call API to create course
      const result = await createCourse(courseData, accessToken);
      
      alert("Course created successfully!");
      console.log("Course created:", result);
      
      // Clear sessionStorage
      sessionStorage.removeItem("courseBasics");
      sessionStorage.removeItem("courseCurriculum");
      
      // Redirect to dashboard
      navigate("/instructor-dashboard");
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!courseBasics || !courseCurriculum) return null;

  const totalLectures = courseCurriculum.reduce(
    (sum, section) => sum + (section.lectures?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background-dark p-8">
      <Header />

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
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <span className="text-slate-400 font-semibold">Curriculum & Videos</span>
          </div>
          <div className="h-1 w-12 bg-primary"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              3
            </div>
            <span className="text-white font-semibold">Review</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Review Your Course</h2>
          <p className="text-slate-400">
            Check all the details before publishing your course
          </p>
        </div>

        {/* Course Overview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-6">
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Thumbnail Preview */}
            <div className="col-span-1">
              <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-6xl">🎓</span>
              </div>
            </div>

            {/* Course Info */}
            <div className="col-span-2">
              <h3 className="text-3xl font-bold text-white mb-3">
                {courseBasics.title}
              </h3>
              <p className="text-slate-400 mb-6">
                {courseBasics.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Sections</p>
                  <p className="text-2xl font-bold text-white">
                    {courseCurriculum.length}
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Lectures</p>
                  <p className="text-2xl font-bold text-white">
                    {totalLectures}
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Price</p>
                  <p className="text-2xl font-bold text-white">
                    ₫{courseBasics.price || "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Level:</span>
                <p className="text-white font-semibold">{courseBasics.level}</p>
              </div>
              <div>
                <span className="text-slate-500">Category:</span>
                <p className="text-white font-semibold">{courseBasics.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 mb-6">
          <h3 className="text-2xl font-bold text-white mb-6">Curriculum</h3>
          
          <div className="space-y-4">
            {courseCurriculum.map((section, sectionIndex) => (
              <div key={section.id} className="bg-slate-800/30 rounded-lg p-4">
                <h4 className="text-white font-bold mb-3">
                  Section {sectionIndex + 1}: {section.title}
                </h4>
                <ul className="space-y-2 ml-4">
                  {(section.lectures || []).map((lecture, lectureIndex) => (
                    <li key={lecture.id} className="text-slate-400 flex items-center gap-2">
                      <span className="text-primary">▶</span>
                      Lecture {lectureIndex + 1}: {lecture.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
          <p className="text-blue-300">
            ℹ️ Once you publish this course, it will be available for students to enroll. You can edit course details later from your dashboard.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800 max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/instructor/create-course/curriculum")}
          className="px-6 py-3 text-slate-300 font-semibold hover:text-white transition"
        >
          Back to Curriculum
        </button>
        <button
          onClick={handleCreateCourse}
          disabled={isCreating}
          className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-lg transition"
        >
          {isCreating ? "Creating..." : "Publish Course"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
