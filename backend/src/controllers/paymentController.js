import prisma from '../lib/prisma.js';

/**
 * Handle Casso Webhook
 * Docs: https://casso.vn/docs/webhook
 */
export const handleCassoWebhook = async (req, res) => {
  try {
    // 1. Verify Secure Token
    const secureToken = req.headers['secure-token'];
    
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
      
      // Use regex to find checkout ID
      const match = description.match(/ORDER\s+([a-zA-Z0-9-]+)/);
      
      if (!match) {
        console.log(`ℹ️ Ignored non-order transaction: ${description}`);
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

        return { checkoutId, status: 'COMPLETED' };
      });

      console.log(`🎉 Payment successful for checkout ${checkoutId}`);
      results.push(result);
    }

    res.json({ error: 0, message: 'Webhook processed', data: results });

  } catch (err) {
    console.error('❌ Casso Webhook Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
