import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

/**
 * @swagger
 * /instructors:
 * get:
 * summary: Get all published instructors
 * tags: [Instructors]
 * responses:
 * 200:
 * description: List of instructors
 */
router.get('/instructors', async (req, res) => {
  try {
    const instructors = await prisma.instructors.findMany({
      include: {
        Users_Instructors_CreatorIdToUsers: {
          select: {
            Id: true,
            FullName: true,
            AvatarUrl: true,
            Bio: true,
            Email: true,
            Phone: true
          }
        },
        _count: {
          select: {
            Courses: true
          }
        }
      }
    });

    const formattedInstructors = instructors.map(inst => ({
      id: inst.Id,
      intro: inst.Intro,
      experience: inst.Experience,
      courseCount: inst.CourseCount || inst._count?.Courses || 0,
      user: inst.Users_Instructors_CreatorIdToUsers
    }));

    res.json({ instructors: formattedInstructors });
  } catch (error) {
    console.error('Get instructors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Giả định đây là route lấy chi tiết Student
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Bạn cần truy vấn student trước khi xử lý logic bên dưới
    const student = await prisma.users.findUnique({
      where: { Id: parseInt(id) },
      include: {
        Enrollments: {
          include: {
            Courses: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found or not managed by you' });
    }

    // Xử lý tiến độ học tập
    const activeCourses = student.Enrollments.map(enrollment => {
      const lectureCount = enrollment.Courses?.LectureCount || 0;
      let completedLectures = 0;

      try {
        const milestones = JSON.parse(enrollment.LectureMilestones || '[]');
        completedLectures = Array.isArray(milestones) ? milestones.length : 0;
      } catch (e) {
        completedLectures = 0;
      }

      const progress = lectureCount > 0
        ? Math.min(Math.round((completedLectures / lectureCount) * 100), 100)
        : 0;

      return {
        id: enrollment.Courses?.Id,
        title: enrollment.Courses?.Title,
        thumbUrl: enrollment.Courses?.ThumbUrl,
        progress: progress,
        completedLectures,
        totalLectures: lectureCount
      };
    });

    res.json({
      student: {
        ...student,
        activeCourses
      }
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;