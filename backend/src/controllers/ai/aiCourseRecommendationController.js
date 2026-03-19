import { getPersonalizedRecommendations } from '../../services/ai/personalizedCourseRecommendationService.js';

/**
 * Get personalized course recommendations for a user
 * GET /api/recommendations/:userId
 */
export const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Validate limit
    if (limit < 1 || limit > 10) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 10'
      });
    }

    // Authorization: users can only get their own recommendations
    // (unless admin - optional enhancement)
    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own recommendations'
      });
    }

    console.log(`[Recommendation Controller] Request from ${req.user.userId} for user ${userId}`);

    // Get recommendations
    const result = await getPersonalizedRecommendations(userId, limit);

    // Success response
    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[Recommendation Controller] Error:', error);

    // Handle specific errors
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Handle AI service errors gracefully
    if (error.message.startsWith('AI_')) {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: 'AI service is currently unavailable. Please try again later.',
        code: error.message
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate recommendations'
    });
  }
};

/**
 * Health check for recommendation service
 * GET /api/recommendations/health
 */
export const getRecommendationHealth = async (req, res) => {
  try {
    const { checkGroqHealth } = await import('../../utils/ai-providers/groqClient.js');

    const groqHealthy = await checkGroqHealth();

    return res.status(groqHealthy ? 200 : 503).json({
      success: true,
      service: 'recommendations',
      status: groqHealthy ? 'healthy' : 'degraded',
      ai: {
        provider: 'Groq',
        healthy: groqHealthy
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      service: 'recommendations',
      status: 'unhealthy',
      error: error.message
    });
  }
};





