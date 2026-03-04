
import { getUserTransactions } from '../services/transactionService.js';

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.Id; // Extracted from auth middleware
    const transactions = await getUserTransactions(userId);
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
