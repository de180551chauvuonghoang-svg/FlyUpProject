import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InstructorEditCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    discount: 0,
    level: "Beginner",
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_URL}/courses/${id}`);
        if (!res.ok) throw new Error("Course not found");
        const data = await res.json();
        const c = data.data;
        setFormData({
          title: c.Title || c.title || "",
          description: c.Description || c.description || "",
          price: c.Price ?? c.price ?? "",
          discount: c.Discount ?? c.discount ?? 0,
          level: c.Level || c.level || "Beginner",
        });
      } catch (err) {
        toast.error("Failed to load course");
        navigate("/instructor/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Course title is required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          discount: parseFloat(formData.discount) || 0,
          level: formData.level,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update course");
      }

      toast.success("Course updated successfully!");
      navigate("/instructor/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading course...</div>
      </div>
    );
  }

  const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <button
          onClick={() => navigate("/instructor/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
        >
          <ChevronLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white">Edit Course</h1>
        <p className="text-slate-400 mt-1">Update your course details below.</p>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Title */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">Course Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            placeholder="Enter course title"
          />
        </div>

        {/* Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
            placeholder="Describe your course..."
          />
        </div>

        {/* Price & Discount */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Price (USD)</label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-l-lg text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-l-0 border-slate-700 rounded-r-lg text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="49.99"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Discount %</label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-l-lg text-white focus:outline-none focus:border-purple-500 transition"
                />
                <span className="px-4 py-3 bg-slate-800 border border-l-0 border-slate-700 rounded-r-lg text-slate-400 font-semibold">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <label className="block text-slate-300 text-sm font-medium mb-3">Difficulty Level</label>
          <div className="grid grid-cols-4 gap-2">
            {levels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, level: lvl }))}
                className={`py-3 px-3 rounded-lg border-2 font-semibold text-sm transition ${
                  formData.level === lvl
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => navigate("/instructor/dashboard")}
            className="px-6 py-3 text-slate-400 font-semibold hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
          >
            <Save size={20} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
