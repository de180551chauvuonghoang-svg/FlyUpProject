import { motion } from 'framer-motion';
import { Users, Star, Settings } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

/**
 * CourseCard Component
 * Displays a course card with thumbnail, status, and stats
 */
function CourseCard({ course, delay = 0 }) {
    const { title, thumbnail, status, studentsCount, rating } = course;

    const statusColors = {
        BUILDING: {
            bg: 'rgba(234, 179, 8, 0.2)',
            text: '#eab308',
        },
        ORBITING: {
            bg: 'rgba(34, 197, 94, 0.2)',
            text: '#22c55e',
        },
    };

    const statusStyle = statusColors[status] || statusColors.ORBITING;

    return (
        <motion.div
            className="course-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <div className="course-thumbnail">
                <img src={thumbnail} alt={title} />
                <div
                    className="course-status"
                    style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                    }}
                >
                    {status}
                </div>
            </div>

            <div className="course-content">
                <h4 className="course-title">{title}</h4>

                <div className="course-stats">
                    <div className="course-stat">
                        <Users size={14} />
                        <span>{formatNumber(studentsCount)} cadets</span>
                    </div>
                    <div className="course-stat">
                        <Star size={14} fill="currentColor" />
                        <span>{rating}</span>
                    </div>
                </div>

                <button className="course-configure-btn">
                    <Settings size={14} />
                    <span>Configure</span>
                </button>
            </div>
        </motion.div>
    );
}

export default CourseCard;
