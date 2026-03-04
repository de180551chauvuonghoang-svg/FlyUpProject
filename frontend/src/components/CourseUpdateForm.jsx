import React, { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import apiConfig from "../config/apiConfig";

/**
 * CourseUpdateForm - Component để instructor cập nhật khóa học
 *
 * Sử dụng:
 * <CourseUpdateForm courseId={courseId} onSuccess={handleSuccess} />
 */
export const CourseUpdateForm = ({ courseId, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Course basic info
  const [formData, setFormData] = useState({
    title: "",
    intro: "",
    description: "",
    price: 0,
    level: "Beginner",
    sections: [],
  });

  // Fetch course details on mount
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(
          `${apiConfig.BASE_URL}/courses/instructor/course/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }

        const result = await response.json();

        if (result.success) {
          const courseData = result.data;
          setFormData({
            title: courseData.Title || "",
            intro: courseData.Intro || "",
            description: courseData.Description || "",
            price: courseData.Price || 0,
            level: courseData.Level || "Beginner",
            sections: courseData.Sections || [],
          });
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching course:", err);
      }
    };

    if (courseId && token) {
      fetchCourse();
    }
  }, [courseId, token]);

  // Handle basic field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  // Handle section title change
  const handleSectionTitleChange = (sectionIndex, newTitle) => {
    setFormData((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionIndex].title = newTitle;
      return { ...prev, sections: updatedSections };
    });
  };

  // Handle lecture title change
  const handleLectureTitleChange = (sectionIndex, lectureIndex, newTitle) => {
    setFormData((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionIndex].lectures[lectureIndex].title = newTitle;
      return { ...prev, sections: updatedSections };
    });
  };

  // Handle lecture description change
  const handleLectureDescriptionChange = (
    sectionIndex,
    lectureIndex,
    newDescription,
  ) => {
    setFormData((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionIndex].lectures[lectureIndex].description =
        newDescription;
      return { ...prev, sections: updatedSections };
    });
  };

  // Add new section
  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: `Section ${prev.sections.length + 1}`,
          lectures: [],
        },
      ],
    }));
  };

  // Add new lecture to section
  const addLecture = (sectionIndex) => {
    setFormData((prev) => {
      const updatedSections = [...prev.sections];
      if (!updatedSections[sectionIndex].lectures) {
        updatedSections[sectionIndex].lectures = [];
      }
      updatedSections[sectionIndex].lectures.push({
        title: `Lecture ${updatedSections[sectionIndex].lectures.length + 1}`,
        description: "",
      });
      return { ...prev, sections: updatedSections };
    });
  };

  // Delete section
  const deleteSection = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex),
    }));
  };

  // Delete lecture
  const deleteLecture = (sectionIndex, lectureIndex) => {
    setFormData((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionIndex].lectures = updatedSections[
        sectionIndex
      ].lectures.filter((_, idx) => idx !== lectureIndex);
      return { ...prev, sections: updatedSections };
    });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        title: formData.title,
        intro: formData.intro,
        description: formData.description,
        price: formData.price,
        level: formData.level,
        sections: formData.sections.map((section, sectionIndex) => ({
          ...(section.id && { id: section.id }),
          title: section.title,
          lectures: section.lectures.map((lecture, lectureIndex) => ({
            ...(lecture.id && { id: lecture.id }),
            title: lecture.title,
            description: lecture.description,
          })),
        })),
      };

      const response = await fetch(
        `${apiConfig.BASE_URL}/courses/${courseId}/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(result.data);
        }
        // Show success message for 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to update course");
      }
    } catch (err) {
      setError(err.message || "An error occurred while updating course");
      console.error("Error updating course:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-update-form">
      <h2>Cập nhật khóa học</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success">
          Khóa học đã được cập nhật thành công!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>Thông tin cơ bản</h3>

          <div className="form-group">
            <label htmlFor="title">Tiêu đề khóa học</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="intro">Mô tả ngắn</label>
            <input
              type="text"
              id="intro"
              name="intro"
              value={formData.intro}
              onChange={handleInputChange}
              className="form-control"
              maxLength="500"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả chi tiết</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-control"
              rows="4"
              maxLength="1000"
            />
          </div>

          <div className="form-row">
            <div className="form-group col-md-6">
              <label htmlFor="price">Giá (VND)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="form-control"
                min="0"
                step="1000"
              />
            </div>

            <div className="form-group col-md-6">
              <label htmlFor="level">Level</label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="Beginner">Beginner (Người mới bắt đầu)</option>
                <option value="Intermediate">Intermediate (Trung bình)</option>
                <option value="Advanced">Advanced (Nâng cao)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sections and Lectures */}
        <div className="form-section">
          <h3>Sections và Lectures</h3>

          {formData.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="section-card">
              <div className="section-header">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) =>
                    handleSectionTitleChange(sectionIndex, e.target.value)
                  }
                  className="form-control section-title"
                  placeholder="Section title"
                />
                <button
                  type="button"
                  onClick={() => deleteSection(sectionIndex)}
                  className="btn btn-danger btn-sm"
                >
                  Xóa Section
                </button>
              </div>

              <div className="lectures-list">
                {section.lectures &&
                  section.lectures.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className="lecture-card">
                      <input
                        type="text"
                        value={lecture.title}
                        onChange={(e) =>
                          handleLectureTitleChange(
                            sectionIndex,
                            lectureIndex,
                            e.target.value,
                          )
                        }
                        className="form-control lecture-title"
                        placeholder="Lecture title"
                        required
                      />
                      <textarea
                        value={lecture.description}
                        onChange={(e) =>
                          handleLectureDescriptionChange(
                            sectionIndex,
                            lectureIndex,
                            e.target.value,
                          )
                        }
                        className="form-control lecture-description"
                        placeholder="Lecture content/description"
                        rows="3"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          deleteLecture(sectionIndex, lectureIndex)
                        }
                        className="btn btn-danger btn-sm"
                      >
                        Xóa Lecture
                      </button>
                    </div>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => addLecture(sectionIndex)}
                className="btn btn-secondary btn-sm"
              >
                + Thêm Lecture
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="btn btn-primary btn-sm"
          >
            + Thêm Section mới
          </button>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-success btn-lg"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật khóa học"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .course-update-form {
          max-width: 900px;
          margin: 20px auto;
          padding: 20px;
        }

        .form-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .form-section h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
        }

        .form-control {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .section-card {
          margin-bottom: 20px;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          background: white;
        }

        .section-header {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .section-title {
          flex: 1;
          padding: 10px;
          font-size: 16px;
          font-weight: 600;
        }

        .lectures-list {
          margin-bottom: 15px;
          padding-left: 20px;
        }

        .lecture-card {
          margin-bottom: 15px;
          padding: 12px;
          background: #f5f5f5;
          border-left: 4px solid #007bff;
          border-radius: 4px;
        }

        .lecture-title {
          margin-bottom: 10px;
          font-weight: 500;
        }

        .lecture-description {
          margin-bottom: 10px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-success {
          background: #28a745;
          color: white;
          width: 100%;
        }

        .btn-success:hover:not(:disabled) {
          background: #218838;
        }

        .btn-success:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-lg {
          padding: 12px 24px;
          font-size: 16px;
        }

        .form-actions {
          margin-top: 30px;
          text-align: center;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
};

export default CourseUpdateForm;
