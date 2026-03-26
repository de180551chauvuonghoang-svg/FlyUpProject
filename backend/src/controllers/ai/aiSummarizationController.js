import { AISummarizationService } from '../../services/ai/aiSummarizationService.js';

/**
 * Controller for document summarization
 */
export async function summarizeDocument(req, res) {
  try {
    const { id, type, language } = req.body;

    if (!id || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: id and type are required.'
      });
    }

    const result = await AISummarizationService.summarize(id, type, language);

    return res.status(200).json(result);
  } catch (error) {
    console.error(`Summarize Controller Error:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during summarization.'
    });
  }
}
