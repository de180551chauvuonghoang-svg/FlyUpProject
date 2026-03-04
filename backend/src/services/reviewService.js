import prisma from '../lib/prisma.js';

export const createReview = async (userId, courseId, { rating, content }) => {
  console.log(`[ReviewService] createReview called for User: ${userId}, Course: ${courseId}, Rating: ${rating}`);

  // 1. Verify Enrollment (Authorization Check)
  // User MUST have an active enrollment in the course to review it.
  const enrollment = await prisma.enrollments.findFirst({
    where: {
      CreatorId: userId,
      CourseId: courseId,
      Status: 'Active' // Ensure enrollment is active
    }
  });

  if (!enrollment) {
    console.warn(`[ReviewService] Enrollment not found or not active for User: ${userId}, Course: ${courseId}`);
    throw new Error('You must be enrolled in this course to leave a review.');
  }

  // 2. Validate Rating
  const ratingInt = parseInt(rating);
  if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    console.error(`[ReviewService] Invalid rating: ${rating}`);
    throw new Error('Rating must be an integer between 1 and 5.');
  }

  // 3. Transaction: Create/Update Review and Update Course Aggregates
  return await prisma.$transaction(async (tx) => {
    // Check if review already exists for this user and course
    const existingReview = await tx.courseReviews.findFirst({
      where: {
        CreatorId: userId,
        CourseId: courseId
      }
    });

    let review;
    
    if (existingReview) {
      console.log(`[ReviewService] Updating existing review: ${existingReview.Id}`);
      // Update existing review
      // We need to adjust aggregate: minus old rating, add new rating
      // But re-calculating from scratch or incremental update?
      // Incremental is faster.
      
      const oldRating = existingReview.Rating;
      const ratingDiff = ratingInt - oldRating;

      review = await tx.courseReviews.update({
        where: { Id: existingReview.Id },
        data: {
          Rating: ratingInt,
          Content: content || '',
          LastModificationTime: new Date(),
          LastModifierId: userId
        }
      });

      // Update Course Stats
      if (ratingDiff !== 0) {
        await tx.courses.update({
          where: { Id: courseId },
          data: {
            TotalRating: { increment: ratingDiff }
            // RatingCount remains same
          }
        });
      }
    } else {
      console.log(`[ReviewService] Creating new review for course: ${courseId}`);
      // Create new review
      review = await tx.courseReviews.create({
        data: {
          CourseId: courseId,
          CreatorId: userId,
          LastModifierId: userId,
          Rating: ratingInt,
          Content: content || ''
        }
      });

      // Update Course Stats
      await tx.courses.update({
        where: { Id: courseId },
        data: {
          TotalRating: { increment: ratingInt },
          RatingCount: { increment: 1 }
        }
      });
    }

    console.log(`[ReviewService] Review saved successfully: ${review.Id}`);
    return review;
  });
};

export const getCourseReviews = async (courseId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [reviews, totalCount] = await Promise.all([
    prisma.courseReviews.findMany({
      where: { CourseId: courseId },
      include: {
        Users: {
          select: {
            Id: true,
            FullName: true,
            AvatarUrl: true
          }
        }
      },
      orderBy: { CreationTime: 'desc' },
      skip,
      take: limit
    }),
    prisma.courseReviews.count({ where: { CourseId: courseId } })
  ]);

  return {
    reviews: reviews.map(r => ({
      Id: r.Id,
      user: {
        Id: r.Users.Id,
        FullName: r.Users.FullName,
        AvatarUrl: r.Users.AvatarUrl || 'https://via.placeholder.com/40?text=User'
      },
      Rating: r.Rating,
      Content: r.Content,
      CreationTime: r.CreationTime,
      LastModificationTime: r.LastModificationTime
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};
