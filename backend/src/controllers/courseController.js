import * as courseService from '../services/courseService.js';
import * as reviewService from '../services/reviewService.js';

// Add Review
export const addReview = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.userId; // From authMiddleware

    console.log(`[CourseController] addReview Request - User: ${userId}, Course: ${courseId}, Body:`, req.body);

    const review = await reviewService.createReview(userId, courseId, { rating, content });

    // Serialize BigInt if any (though review mostly uses Int/String)
    const serializedReview = JSON.parse(
      JSON.stringify(review, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    res.status(201).json({
      success: true,
      data: serializedReview
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get Reviews
export const getReviews = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { page, limit } = req.query;

    const result = await reviewService.getCourseReviews(
      courseId, 
      parseInt(page) || 1, 
      parseInt(limit) || 10
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await courseService.getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories',
      message: error.message 
    });
  }
};

// Get courses with filters
export const getCourses = async (req, res) => {
  try {
    const {
      categoryId,
      level,
      minPrice,
      maxPrice,
      search,
      page,
      limit,
      sortBy
    } = req.query;

    const filters = {
      categoryId,
      level,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 24,
      sortBy
    };

    const result = await courseService.getCourses(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch courses',
      message: error.message 
    });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseService.getCourseById(id);
    
    // Convert BigInt to string for JSON serialization
    const serializedCourse = JSON.parse(
      JSON.stringify(course, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    
    res.json({
      success: true,
      data: serializedCourse
    });
  } catch (error) {
    console.error('Get course error:', error);
    if (error.message === 'Course not found') {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch course',
      message: error.message 
    });
  }
};

// Get instructor's course stats (for dashboard)
export const getInstructorStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const prisma = (await import('../lib/prisma.js')).default;

    // Find instructor record from user
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId }
    });

    if (!instructor) {
      return res.json({
        success: true,
        data: {
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
          avgRating: 0,
          pendingCourses: 0,
          approvedCourses: 0
        }
      });
    }

    const courses = await prisma.courses.findMany({
      where: { InstructorId: instructor.Id },
      select: {
        Id: true,
        LearnerCount: true,
        RatingCount: true,
        TotalRating: true,
        Price: true,
        ApprovalStatus: true
      }
    });

    const totalStudents = courses.reduce((sum, c) => sum + (c.LearnerCount || 0), 0);
    const totalRevenue = courses.reduce((sum, c) => sum + (c.LearnerCount || 0) * (c.Price || 0), 0);
    const totalRatingCount = courses.reduce((sum, c) => sum + (c.RatingCount || 0), 0);
    const totalRatingSum = courses.reduce((sum, c) => sum + Number(c.TotalRating || 0), 0);
    const avgRating = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount).toFixed(1) : 0;
    const pendingCourses = courses.filter(c => c.ApprovalStatus === 'Pending').length;
    const approvedCourses = courses.filter(c => c.ApprovalStatus === 'APPROVED').length;

    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue: Math.round(totalRevenue),
        avgRating: parseFloat(avgRating),
        pendingCourses,
        approvedCourses
      }
    });
  } catch (error) {
    console.error('Get instructor stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

// Get courses belonging to logged-in instructor
export const getInstructorCourses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'all' } = req.query;
    const prisma = (await import('../lib/prisma.js')).default;

    // Find instructor record
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId }
    });

    if (!instructor) {
      return res.json({ success: true, data: [] });
    }

    const where = { InstructorId: instructor.Id };
    if (status && status !== 'all') {
      where.ApprovalStatus = status;
    }

    const courses = await prisma.courses.findMany({
      where,
      select: {
        Id: true,
        Title: true,
        ThumbUrl: true,
        Price: true,
        Discount: true,
        Level: true,
        Status: true,
        ApprovalStatus: true,
        LearnerCount: true,
        RatingCount: true,
        TotalRating: true,
        LectureCount: true,
        CreationTime: true,
        Categories: {
          select: { Id: true, Title: true }
        }
      },
      orderBy: { CreationTime: 'desc' }
    });

    const serialized = JSON.parse(
      JSON.stringify(courses, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    const transformed = serialized.map(c => ({
      id: c.Id,
      title: c.Title,
      thumbnail: c.ThumbUrl || '',
      price: c.Price,
      discount: c.Discount,
      level: c.Level,
      status: c.Status,
      approvalStatus: c.ApprovalStatus,
      students: c.LearnerCount,
      lectures: c.LectureCount,
      rating: c.RatingCount > 0 ? (Number(c.TotalRating) / c.RatingCount).toFixed(1) : 0,
      ratingCount: c.RatingCount,
      category: c.Categories?.Title || '',
      createdAt: c.CreationTime
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch instructor courses' });
  }
};

// ─── CREATE COURSE ─────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const prisma = (await import('../lib/prisma.js')).default;

    // Find instructor record
    const instructor = await prisma.instructors.findFirst({ where: { CreatorId: userId } });
    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Instructor profile not found. Please contact admin.' });
    }

    const { title, description, intro, price, discount, level, category, sections } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Course title is required' });
    }

    // Find default category if not provided
    let categoryId = category;
    if (!categoryId) {
      const defaultCat = await prisma.categories.findFirst({ where: { IsLeaf: true }, orderBy: { Title: 'asc' } });
      categoryId = defaultCat?.Id;
    }
    if (!categoryId) {
      return res.status(400).json({ success: false, error: 'No category found. Please select a category.' });
    }

    // Create course with sections & lectures in a transaction
    const course = await prisma.$transaction(async (tx) => {
      const newCourse = await tx.courses.create({
        data: {
          Title: title.trim(),
          MetaTitle: title.trim(),
          Description: description || '',
          Intro: intro || description?.substring(0, 500) || '',
          Price: parseFloat(price) || 0,
          Discount: parseFloat(discount) || 0,
          Level: level || 'Beginner',
          Status: 'Draft',
          ApprovalStatus: 'Pending',
          LeafCategoryId: categoryId,
          InstructorId: instructor.Id,
          CreatorId: userId,
          LastModifierId: userId,
        }
      });

      // Create sections and lectures if provided
      if (sections && sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const sec = sections[i];
          const newSection = await tx.sections.create({
            data: {
              Title: sec.title || `Section ${i + 1}`,
              Index: i,
              CourseId: newCourse.Id,
            }
          });

          if (sec.lectures && sec.lectures.length > 0) {
            for (let j = 0; j < sec.lectures.length; j++) {
              const lec = sec.lectures[j];
              await tx.lectures.create({
                data: {
                  Title: lec.title || `Lecture ${j + 1}`,
                  Content: lec.content || '',
                  SectionId: newSection.Id,
                  CreatorId: userId,
                  LastModifierId: userId,
                }
              });
            }
            // Update section lecture count
            await tx.sections.update({
              where: { Id: newSection.Id },
              data: { LectureCount: sec.lectures.length }
            });
          }
        }
        // Update course lecture count
        const totalLectures = sections.reduce((sum, s) => sum + (s.lectures?.length || 0), 0);
        await tx.courses.update({
          where: { Id: newCourse.Id },
          data: { LectureCount: totalLectures }
        });
      }

      return newCourse;
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully! It will be reviewed by admin before publishing.',
      data: { id: course.Id, title: course.Title, status: course.Status, approvalStatus: course.ApprovalStatus }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, error: 'Failed to create course', message: error.message });
  }
};

// ─── DELETE COURSE ─────────────────────────────────────────────────────────
export const deleteCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import('../lib/prisma.js')).default;

    // Try to find via Instructors table first, then fallback to CreatorId
    const instructor = await prisma.instructors.findFirst({ where: { CreatorId: userId } });
    const courseWhere = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhere });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found or access denied' });

    await prisma.courses.delete({ where: { Id: courseId } });

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete course', message: error.message });
  }
};

// ─── PUBLISH COURSE ─────────────────────────────────────────────────────────
export const publishCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import('../lib/prisma.js')).default;

    const instructor = await prisma.instructors.findFirst({ where: { CreatorId: userId } });
    const courseWhere = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhere });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found or access denied' });

    const updated = await prisma.courses.update({
      where: { Id: courseId },
      data: { Status: 'Ongoing', ApprovalStatus: 'APPROVED' }
    });

    res.json({ success: true, message: 'Course published successfully!', data: { status: updated.Status } });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ success: false, error: 'Failed to publish course' });
  }
};

// ─── UNPUBLISH COURSE ─────────────────────────────────────────────────────────
export const unpublishCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import('../lib/prisma.js')).default;

    const instructor = await prisma.instructors.findFirst({ where: { CreatorId: userId } });
    const courseWhereUnpub = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhereUnpub });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found or access denied' });

    const updated = await prisma.courses.update({
      where: { Id: courseId },
      data: { Status: 'Draft' }
    });

    res.json({ success: true, message: 'Course unpublished.', data: { status: updated.Status } });
  } catch (error) {
    console.error('Unpublish course error:', error);
    res.status(500).json({ success: false, error: 'Failed to unpublish course' });
  }
};

// ─── UPDATE COURSE ─────────────────────────────────────────────────────────
export const updateCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import('../lib/prisma.js')).default;

    // Verify ownership with CreatorId fallback
    const instructor = await prisma.instructors.findFirst({ where: { CreatorId: userId } });
    const courseWhereUpd = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhereUpd });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found or access denied' });

    const { title, description, intro, price, discount, level } = req.body;

    const updated = await prisma.courses.update({
      where: { Id: courseId },
      data: {
        ...(title && { Title: title.trim(), MetaTitle: title.trim() }),
        ...(description !== undefined && { Description: description }),
        ...(intro !== undefined && { Intro: intro }),
        ...(price !== undefined && { Price: parseFloat(price) || 0 }),
        ...(discount !== undefined && { Discount: parseFloat(discount) || 0 }),
        ...(level && { Level: level }),
        LastModifierId: userId,
      }
    });

    res.json({
      success: true,
      message: 'Course updated successfully!',
      data: { id: updated.Id, title: updated.Title }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, error: 'Failed to update course' });
  }
};
