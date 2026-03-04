import prisma from '../lib/prisma.js';

export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        UserId_CourseId: {
          UserId: userId,
          CourseId: courseId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: {
          UserId_CourseId: {
            UserId: userId,
            CourseId: courseId,
          },
        },
      });
      return res.status(200).json({ message: 'Removed from wishlist', isInWishlist: false });
    } else {
      await prisma.wishlist.create({
        data: {
          UserId: userId,
          CourseId: courseId,
        },
      });
      return res.status(201).json({ message: 'Added to wishlist', isInWishlist: true });
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const wishlist = await prisma.wishlist.findMany({
      where: { UserId: userId },
      include: {
        Courses: {
            include: {
                Instructors: {
                    include: {
                        Users_Instructors_CreatorIdToUsers: {
                            select: { FullName: true, AvatarUrl: true }
                        }
                    }
                },
                Categories: {
                    select: { Title: true }
                }
            }
        },
      },
      orderBy: { CreationTime: 'desc' }
    });
    
    // Map to return just courses but with extra info if needed
    // The frontend usually expects course objects
    const courses = wishlist.map(item => item.Courses);
    
    // Serialize BigInts to strings to prevent "Do not know how to serialize a BigInt" error
    const serializedCourses = JSON.stringify(courses, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    );
    
    res.setHeader('Content-Type', 'application/json');
    res.send(serializedCourses);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkWishlistStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;

        const existing = await prisma.wishlist.findUnique({
            where: {
                UserId_CourseId: {
                    UserId: userId,
                    CourseId: courseId,
                },
            },
        });

        res.status(200).json({ isInWishlist: !!existing });
    } catch (error) {
        console.error('Error checking wishlist status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
