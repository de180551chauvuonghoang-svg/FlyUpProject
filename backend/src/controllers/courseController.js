import * as courseService from '../services/courseService.js';

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
      limit
    } = req.query;

    const filters = {
      categoryId,
      level,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 24
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
