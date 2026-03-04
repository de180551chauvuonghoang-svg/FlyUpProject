import prisma from '../lib/prisma.js';

/**
 * Create a new comment
 * @param {string} userId - ID of the user creating the comment
 * @param {object} data - Comment data
 * @param {string} data.content - Content of the comment
 * @param {string} data.sourceType - 'Lecture' or 'Article'
 * @param {string} data.sourceId - ID of the Lecture or Article
 * @param {string} [data.parentId] - ID of the parent comment (if reply)
 * @param {Array<{type: string, url: string}>} [data.media] - Array of media objects
 */
export const createComment = async (userId, { content, sourceType, sourceId, parentId, media }) => {
  // 1. Validate Source
  if (sourceType !== 'Lecture' && sourceType !== 'Article') {
    throw new Error('Invalid source type. Must be Lecture or Article.');
  }

  // 2. Prepare Data
  const commentData = {
    Content: content,
    CreatorId: userId,
    LastModifierId: userId,
    ParentId: parentId || null,
    SourceType: sourceType
  };

  if (sourceType === 'Lecture') {
    commentData.LectureId = sourceId;
  } else {
    commentData.ArticleId = sourceId;
  }

  // 3. Create Comment with Transaction (to handle media)
  return await prisma.$transaction(async (tx) => {
    // Check if source exists (Optional but recommended)
    if (sourceType === 'Lecture') {
      const lecture = await tx.lectures.findUnique({ where: { Id: sourceId } });
      if (!lecture) throw new Error('Lecture not found');
    } else {
        // Article check could go here
    }

    const comment = await tx.comments.create({
      data: commentData
    });

    // 4. Create Media if present
    if (media && Array.isArray(media) && media.length > 0) {
      await tx.commentMedia.createMany({
        data: media.map(m => ({
          CommentId: comment.Id,
          Type: m.type,
          Url: m.url
        }))
      });
    }

    // Return complete comment with media
    return await tx.comments.findUnique({
      where: { Id: comment.Id },
      include: {
        CommentMedia: true,
        Users: {
          select: {
            Id: true,
            FullName: true,
            AvatarUrl: true
          }
        }
      }
    });
  });
};

/**
 * Get comments for a source
 * @param {string} sourceType - 'Lecture' or 'Article'
 * @param {string} sourceId - ID of the source
 * @param {number} page
 * @param {number} limit
 */
export const getComments = async (sourceType, sourceId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const whereClause = {
    ParentId: null // Only fetch top-level comments first
  };

  if (sourceType === 'Lecture') {
    whereClause.LectureId = sourceId;
  } else {
    whereClause.ArticleId = sourceId;
  }

  const [comments, totalCount] = await Promise.all([
    prisma.comments.findMany({
      where: whereClause,
      include: {
        Users: {
            select: {
                Id: true,
                FullName: true,
                AvatarUrl: true
            }
        },
        CommentMedia: true,
        // Fetch replies (1 level deep for now, or use recursive query/separate call for deep nesting)
        // Prisma doesn't support recursive include easily, so we typically fetch top level and replies count,
        // or fetch all and build tree in JS if dataset is small.
        // For efficiency, let's fetch immediate replies.
        other_Comments: { 
            include: {
                Users: { select: { Id: true, FullName: true, AvatarUrl: true } },
                CommentMedia: true
            },
            orderBy: { CreationTime: 'asc' }
        }
      },
      orderBy: { CreationTime: 'desc' },
      skip,
      take: limit
    }),
    prisma.comments.count({ where: whereClause })
  ]);

  return {
    comments: comments.map(c => ({
      id: c.Id,
      content: c.Content,
      createdAt: c.CreationTime,
      user: {
        id: c.Users.Id,
        name: c.Users.FullName,
        avatar: c.Users.AvatarUrl
      },
      media: c.CommentMedia,
      replies: c.other_Comments.map(r => ({
          id: r.Id,
          content: r.Content,
          createdAt: r.CreationTime,
          user: {
              id: r.Users.Id,
              name: r.Users.FullName,
              avatar: r.Users.AvatarUrl
          },
          media: r.CommentMedia
      }))
    })),
    pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
    }
  };
};
