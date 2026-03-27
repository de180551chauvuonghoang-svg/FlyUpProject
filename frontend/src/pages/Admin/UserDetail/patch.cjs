const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'UserDetail.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add imports
content = content.replace(
    /ExternalLink,?\r?\n\} from 'lucide-react';/,
    "ExternalLink,\n    ChevronDown,\n    Users,\n} from 'lucide-react';"
);

// 2. Add state
content = content.replace(
    /const \[txLoading, setTxLoading\] = useState\(false\);/,
    "const [txLoading, setTxLoading] = useState(false);\n\n    const [courses, setCourses] = useState([]);\n    const [showCourses, setShowCourses] = useState(false);\n    const [coursesLoading, setCoursesLoading] = useState(false);"
);

// 3. Add handleToggleCourses after useEffect
content = content.replace(
    /    \}, \[txPage\]\);/,
    "    }, [txPage]);\n\n    const handleToggleCourses = async () => {\n        if (showCourses) {\n            setShowCourses(false);\n            return;\n        }\n        try {\n            setCoursesLoading(true);\n            let result;\n            if (user?.role === 'INSTRUCTOR') {\n                result = await userService.getUserCourses(id);\n            } else {\n                result = await userService.getUserEnrollments(id);\n            }\n            setCourses(result.courses || []);\n            setShowCourses(true);\n        } catch (err) {\n            console.error('Failed to fetch courses/enrollments:', err);\n            showToast('Failed to load courses', 'error');\n        } finally {\n            setCoursesLoading(false);\n        }\n    };"
);

// 4. Update the stat card
content = content.replace(
    /<div className="ud-stat-card">[\s\S]*?<BookOpen size=\{20\} className="ud-stat-icon enrollments" \/>[\s\S]*?<div>[\s\S]*?<span className="ud-stat-value">\{user\.enrollmentCount \?\? 0\}<\/span>[\s\S]*?<span className="ud-stat-label">Enrollments<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
    `<div
                    className={\`ud-stat-card clickable \${showCourses ? 'active' : ''}\`}
                    onClick={handleToggleCourses}
                    title={user?.role === 'INSTRUCTOR' ? "Click to view created courses" : "Click to view enrolled courses"}
                >
                    <BookOpen size={20} className="ud-stat-icon enrollments" />
                    <div>
                        <span className="ud-stat-value">{user?.role === 'INSTRUCTOR' ? (user.courseCount ?? 0) : (user.enrollmentCount ?? 0)}</span>
                        <span className="ud-stat-label">{user?.role === 'INSTRUCTOR' ? 'Courses' : 'Enrollments'}</span>
                    </div>
                    <ChevronDown size={16} className={\`ud-stat-chevron \${showCourses ? 'open' : ''}\`} />
                </div>`
);

// 5. Add courses section
content = content.replace(
    /\{\/\* Details Grid \*\/\}/,
    `{/* Courses / Enrollments Section */}
            {showCourses && (
                <motion.div
                    className="ud-courses-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="ud-courses-header">
                        <BookOpen size={18} className="ud-tx-icon" />
                        <h3 className="ud-card-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
                            {user?.role === 'INSTRUCTOR' ? 'Courses Created' : 'Enrolled Courses'}
                        </h3>
                        <span className="ud-tx-count">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
                    </div>

                    {coursesLoading ? (
                        <div className="ud-tx-loading">
                            <div className="ud-spinner" />
                            <span>Loading courses...</span>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="ud-tx-empty">
                            <BookOpen size={32} />
                            <p>{user?.role === 'INSTRUCTOR' ? 'No courses created yet' : 'Not enrolled in any courses yet'}</p>
                        </div>
                    ) : (
                        <div className="ud-courses-grid">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    className="ud-course-card"
                                    onClick={() => navigate(\`/admin/courses\`)}
                                >
                                    <div className="ud-course-thumb">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} />
                                        ) : (
                                            <div className="ud-course-thumb-placeholder">
                                                <BookOpen size={24} />
                                            </div>
                                        )}
                                        <span className={\`ud-course-status \${(course.approvalStatus || course.status).toLowerCase()}\`}>
                                            {course.approvalStatus || course.status}
                                        </span>
                                    </div>
                                    <div className="ud-course-info">
                                        <h4 className="ud-course-title">{course.title}</h4>
                                        <div className="ud-course-meta">
                                            <span className="ud-course-category">{course.category}</span>
                                            <span className="ud-course-learners">
                                                <Users size={12} /> {course.learnerCount}
                                            </span>
                                            <span className="ud-course-price">
                                                {course.price > 0 ? \`$\${course.price}\` : 'Free'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Details Grid */}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Patched UserDetail.jsx successfully!');
