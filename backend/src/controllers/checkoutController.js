import prisma from '../lib/prisma.js';

// Create a new checkout session
export const createCheckout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseIds, totalAmount } = req.body;

    if (!courseIds || courseIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No courses selected' });
    }

    // Verify all courses exist and are ongoing
    const courses = await prisma.courses.findMany({
      where: {
        Id: { in: courseIds },
        Status: 'Ongoing',
        ApprovalStatus: 'APPROVED'
      },
      select: { Id: true, Price: true }
    });

    if (courses.length !== courseIds.length) {
      return res.status(400).json({ success: false, error: 'Some courses are invalid or unavailable' });
    }

    // Verify total amount (optional but recommended security check)
    const calculatedTotal = courses.reduce((sum, course) => sum + Number(course.Price), 0);
    if (Math.abs(calculatedTotal - totalAmount) > 1000) { // Allow small float diff
       // For now, let's just warn or use calculated total
       console.warn('Frontend total differs from calculated total', totalAmount, calculatedTotal);
    }

    const checkout = await prisma.cartCheckout.create({
      data: {
        UserId: userId,
        CourseIds: JSON.stringify(courseIds),
        TotalAmount: Math.round(calculatedTotal), // Store as integer/BigInt
        PaymentMethod: 'VietQR',
        Status: 'PENDING',
        CreationTime: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        checkoutId: checkout.Id,
        totalAmount: checkout.TotalAmount.toString(), // BigInt to string
        paymentMethod: checkout.PaymentMethod
      }
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout session' });
  }
};

// Get status of a checkout session
export const getCheckoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const checkout = await prisma.cartCheckout.findFirst({
      where: {
        Id: id,
        UserId: userId
      }
    });

    if (!checkout) {
      return res.status(404).json({ success: false, error: 'Checkout session not found' });
    }

    res.json({
      success: true,
      data: {
        id: checkout.Id,
        status: checkout.Status,
        totalAmount: checkout.TotalAmount.toString(),
        createdAt: checkout.CreationTime
      }
    });

  } catch (error) {
    console.error('Get checkout status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get checkout status' });
  }
};

// Simulate payment success (Webhook mock)
// In production, this would be a secure endpoint receiving Bank Webhook
export const webhookPayment = async (req, res) => {
  try {
    const { checkoutId } = req.body;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Get Checkout
        const checkout = await tx.cartCheckout.findUnique({
            where: { Id: checkoutId }
        });

        if (!checkout) throw new Error('Checkout not found');
        if (checkout.Status === 'COMPLETED') return { alreadyCompleted: true };

        // 2. Create Bill
        const bill = await tx.bills.create({
            data: {
                Action: 'Payment',
                Amount: checkout.TotalAmount,
                Gateway: 'VietQR',
                IsSuccessful: true,
                CreatorId: checkout.UserId,
                TransactionId: `TXN_${Date.now()}`, // Simulated
            }
        });

        // 3. Create Enrollments
        const courseIds = JSON.parse(checkout.CourseIds);
        const enrollments = await Promise.all(courseIds.map(courseId => 
            tx.enrollments.upsert({
                where: {
                    CreatorId_CourseId: {
                        CreatorId: checkout.UserId,
                        CourseId: courseId
                    }
                },
                update: {
                    Status: 'Active',
                    BillId: bill.Id
                },
                create: {
                    CreatorId: checkout.UserId,
                    CourseId: courseId,
                    BillId: bill.Id,
                    Status: 'Active'
                }
            })
        ));

        // 4. Update Checkout Status
        await tx.cartCheckout.update({
            where: { Id: checkoutId },
            data: { 
                Status: 'COMPLETED',
                ProcessedTime: new Date()
            }
        });

        return { success: true, enrollmentsCount: enrollments.length };
    });

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('Payment simulation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
