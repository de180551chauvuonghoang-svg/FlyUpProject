
import prisma from '../lib/prisma.js';

export const getUserTransactions = async (userId) => {
  try {
    const transactions = await prisma.bills.findMany({
      where: {
        CreatorId: userId,
        IsSuccessful: true
      },
      include: {
        Enrollments: {
          include: {
            Courses: {
              select: {
                Id: true,
                Title: true,
                ThumbUrl: true,
                Price: true
              }
            }
          }
        }
      },
      orderBy: {
        CreationTime: 'desc'
      }
    });

    return transactions.map(bill => ({
      id: bill.Id,
      transactionId: bill.TransactionId || bill.ClientTransactionId,
      date: bill.CreationTime,
      amount: Number(bill.Amount),
      status: bill.IsSuccessful ? 'Successful' : 'Failed', // Though we filter by true, good to map
      gateway: bill.Gateway,
      items: bill.Enrollments.map(enrollment => ({
        courseId: enrollment.Courses.Id,
        title: enrollment.Courses.Title,
        thumbnail: enrollment.Courses.ThumbUrl,
        price: enrollment.Courses.Price // Or calculate from bill split if needed, but bill has total
      }))
    }));

  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transaction history');
  }
};
