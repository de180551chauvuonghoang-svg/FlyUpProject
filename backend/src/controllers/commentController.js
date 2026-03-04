import * as commentService from '../services/commentService.js';

export const addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content, sourceType, sourceId, parentId, media } = req.body;

    if (!content && (!media || media.length === 0)) {
        return res.status(400).json({ error: 'Comment content or media is required' });
    }

    if (!sourceId || !sourceType) {
        return res.status(400).json({ error: 'Source ID and Type are required' });
    }

    const comment = await commentService.createComment(userId, {
        content,
        sourceType,
        sourceId,
        parentId,
        media
    });

    // Serialize BigInt if relevant (usually not for UUIDs/Dates, but good practice)
    const serialized = JSON.parse(JSON.stringify(comment));

    res.status(201).json({
        success: true,
        data: serialized
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getComments = async (req, res) => {
    try {
        const { sourceType, sourceId, page, limit } = req.query;

        if (!sourceType || !sourceId) {
            return res.status(400).json({ error: 'Source Type and ID are required' });
        }

        const result = await commentService.getComments(
            sourceType, 
            sourceId, 
            parseInt(page) || 1, 
            parseInt(limit) || 20
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
