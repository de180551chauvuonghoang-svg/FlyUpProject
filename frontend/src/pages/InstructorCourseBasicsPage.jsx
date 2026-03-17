import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function InstructorCourseBasicsPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    shortIntro: "",
    price: "",
    discount: 0,
    category: "Development",
    difficultyLevel: "Beginner",
    description: "",
  });

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "discount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    // Validate form
    if (!formData.title.trim()) {
      alert("Please enter course title");
      return;
    }
    if (!formData.shortIntro.trim()) {
      alert("Please enter short intro");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      alert("Please enter valid price");
      return;
    }
    if (!formData.description.trim()) {
      alert("Please enter course description");
      return;
    }

    // Save to sessionStorage and navigate
    sessionStorage.setItem("courseBasics", JSON.stringify(formData));
    if (thumbnail) {
      sessionStorage.setItem("courseThumbnail", thumbnailPreview);
    }
    navigate("/instructor/create-course/curriculum");
  };

  const categories = ["Development", "Design", "Business", "Marketing", "Data Science", "Other"];
  const difficultyLevels = [
    { value: "Beginner", label: "Beginner", icon: "★" },
    { value: "Intermediate", label: "Intermediate", icon: "★★" },
    { value: "Advanced", label: "Advanced", icon: "★★★" },
    { value: "Expert", label: "Expert", icon: "◆" },
  ];

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <span className="text-white font-semibold">Basics</span>
          </div>
          <div className="h-1 w-12 bg-slate-700"></div>
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="text-slate-400 font-semibold">Curriculum & Videos</span>
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Course Basics</h2>
          <p className="text-slate-400">Start by providing the fundamental details of your new course.</p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Course Title */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Course Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter course title"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Short Intro */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Short Intro</label>
              <textarea
                name="shortIntro"
                value={formData.shortIntro}
                onChange={handleInputChange}
                placeholder="Describe what students will learn"
                rows="4"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition resize-none"
              />
              <div className="text-right text-xs text-slate-500 mt-1">
                {formData.shortIntro.length}/160 characters
              </div>
            </div>

            {/* Price & Discount Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-3">Price (USD)</label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-l-lg text-slate-400 font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="49.99"
                    className="flex-1 px-4 py-3 bg-slate-900 border border-l-0 border-slate-800 rounded-r-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-3">Discount %</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-l-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                  />
                  <span className="px-4 py-3 bg-slate-900 border border-l-0 border-slate-800 rounded-r-lg text-slate-400 font-semibold">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary transition appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Difficulty Level</label>
              <div className="grid grid-cols-4 gap-2">
                {difficultyLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setFormData((prev) => ({ ...prev, difficultyLevel: level.value }))}
                    className={`py-3 px-3 rounded-lg border-2 font-semibold text-center transition ${
                      formData.difficultyLevel === level.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-sm">{level.icon}</div>
                    <div className="text-xs">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Thumbnail & Description */}
          <div className="space-y-6">
            {/* Course Thumbnail */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Course Thumbnail</label>
              <label className="block">
                <div className="relative w-full aspect-video border-2 border-dashed border-slate-700 rounded-lg hover:border-primary transition cursor-pointer bg-slate-900/50 flex flex-col items-center justify-center group">
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📤</div>
                          <p className="text-white text-sm font-semibold">Change image</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-5xl mb-2">☁️</div>
                      <p className="text-white font-semibold mb-1">Click or drag file to upload</p>
                      <p className="text-slate-500 text-sm">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>
              </label>
              <p className="text-xs text-slate-500 mt-2">1920x1080 Recommended</p>
            </div>

            {/* Course Description */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Course Description</label>

              {/* Rich Text Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-3 bg-slate-900 border border-slate-800 rounded-t-lg">
                <button
                  title="Bold"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  <strong>B</strong>
                </button>
                <button
                  title="Italic"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  <em>I</em>
                </button>
                <button
                  title="Underline"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  <u>U</u>
                </button>
                <div className="h-6 w-px bg-slate-700 mx-1"></div>
                <button
                  title="Heading 1"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition text-xs font-bold"
                >
                  H1
                </button>
                <button
                  title="Heading 2"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition text-xs font-bold"
                >
                  H2
                </button>
                <div className="h-6 w-px bg-slate-700 mx-1"></div>
                <button
                  title="Bullet List"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  ≡
                </button>
                <button
                  title="Numbered List"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  1.
                </button>
                <div className="h-6 w-px bg-slate-700 mx-1"></div>
                <button
                  title="Link"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  🔗
                </button>
                <button
                  title="Image"
                  className="p-2 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  🖼️
                </button>
              </div>

              {/* Text Area */}
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="In this comprehensive course, we will dive deep into the world of React Animations using Framer Motion. You will learn:

• How to set up Framer Motion in a React project
• Creating gesture-based animations
• Layout animations and shared element transitions
• Complex orchestration with variants

By the end of this course, you'll be able to build award-winning interfaces that feel alive."
                rows="8"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-b-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800">
        <button className="px-6 py-3 text-slate-300 font-semibold hover:text-white transition">
          Save as Draft
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition"
        >
          Continue to Curriculum
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
