import prisma from '../lib/prisma.js';
import { sendPurchaseSuccessEmail } from '../services/emailService.js';

/**
 * Handle Casso Webhook
 * Docs: https://casso.vn/docs/webhook
 */
export const handleCassoWebhook = async (req, res) => {
  try {
    // 1. Verify Secure Token
    const secureToken = req.headers['secure-token'];
    
    // DEBUG LOGS (Remove in production later)
    console.log('🔔 Webhook Received!');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', JSON.stringify(req.body));
    console.log('Received Token:', secureToken);
    console.log('Expected Token:', process.env.CASSO_SECURE_TOKEN);

    if (!secureToken || secureToken !== process.env.CASSO_SECURE_TOKEN) {
      console.warn('⚠️ Casso Webhook: Invalid Secure Token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { error, data } = req.body;

    if (error !== 0) {
      return res.json({ status: 'ok', message: 'Ignored error payload' });
    }

    // 2. Process transactions
    const results = [];

    for (const transaction of data) {
      // Transaction content example: "VOI123 ORDER 670896f5..."
      // We look for "ORDER <CheckoutID>"
      const description = transaction.description;
      const amount = transaction.amount;
      
      // Use regex to find checkout ID (Check case-insensitive)
      const match = description.match(/ORDER\s+([a-zA-Z0-9-]+)/i);
      
      console.log(`Processing Trx: ${description}`);
      console.log(`Regex Match:`, match);

      if (!match) {
        console.log(`ℹ️ Ignored non-order transaction: ${description}`);
        console.log(`Expected format: /ORDER\\s+([a-zA-Z0-9-]+)/i`);
        continue;
      }

      const checkoutId = match[1];

      // 3. Find Checkout Record
      const checkout = await prisma.cartCheckout.findUnique({
        where: { Id: checkoutId }
      });

      if (!checkout) {
        console.error(`❌ Checkout not found for ID: ${checkoutId}`);
        continue;
      }

      if (checkout.Status === 'COMPLETED') {
        console.log(`✅ Checkout ${checkoutId} already completed.`);
        continue;
      }

      // 4. Verify Amount
      // Note: Allow small difference if needed, but exact match is safer
      if (amount < checkout.TotalAmount) {
        console.warn(`⚠️ Insufficient amount for ${checkoutId}. Expected: ${checkout.TotalAmount}, Received: ${amount}`);
        // Optionally mark as partial payment or ignore
        continue;
      }

      // 5. Execute Success Logic (Transaction)
      const result = await prisma.$transaction(async (tx) => {
        // Create Bill
        const bill = await tx.bills.create({
          data: {
            Action: 'Payment',
            Amount: amount, // Record actual received amount
            Gateway: 'VietQR (Casso)',
            IsSuccessful: true,
            CreatorId: checkout.UserId,
            TransactionId: transaction.tid, // Bank transaction ID
          }
        });

        // Create Enrollments
        const courseIds = JSON.parse(checkout.CourseIds);
        await Promise.all(courseIds.map(courseId => 
          tx.enrollments.create({
            data: {
              CreatorId: checkout.UserId,
              CourseId: courseId,
              BillId: bill.Id,
              Status: 'Active' // Or 'Pending' if you want manual approval
            }
          })
        ));

        // Update Checkout Status
        await tx.cartCheckout.update({
          where: { Id: checkoutId },
          data: { 
            Status: 'COMPLETED',
            ProcessedTime: new Date()
          }
        });

        return { 
          checkoutId, 
          status: 'COMPLETED',
          userId: checkout.UserId,
          courseIds,
          totalAmount: amount
        };
      });

      // 6. Send Email Notification
      try {
        // Fetch User and Course details for email
        const user = await prisma.users.findUnique({
          where: { Id: result.userId },
          select: { Email: true, FullName: true }
        });

        const courses = await prisma.courses.findMany({
          where: { Id: { in: result.courseIds } },
          select: { Title: true, Price: true }
        });

        if (user) {
          await sendPurchaseSuccessEmail(user.Email, user.FullName, {
            orderId: result.checkoutId,
            totalAmount: Number(result.totalAmount),
            courses: courses.map(c => ({ title: c.Title, price: Number(c.Price) }))
          });
        }
      } catch (emailErr) {
        console.error('⚠️ Failed to send success email:', emailErr);
      }

      console.log(`🎉 Payment successful for checkout ${checkoutId}`);
      results.push({ checkoutId: result.checkoutId, status: result.status });
    }

    res.json({ error: 0, message: 'Webhook processed', data: results });

  } catch (err) {
    console.error('❌ Casso Webhook Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
