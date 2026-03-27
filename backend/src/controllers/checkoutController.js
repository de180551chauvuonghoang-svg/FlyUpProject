import prisma from '../lib/prisma.js';
import { emailQueue } from '../lib/queue.js';

// Helper for coupon validation
const validateAndCalculateCoupon = async (code, courseIds) => {
    const coupon = await prisma.coupons.findUnique({ where: { Code: code } });
    if (!coupon) throw new Error('Invalid coupon code');
    if (!coupon.IsActive) throw new Error('Coupon is inactive');
    if (coupon.ExpiryDate && new Date(coupon.ExpiryDate) < new Date()) throw new Error('Coupon has expired');
    if (coupon.MaxUses && coupon.UsedCount >= coupon.MaxUses) throw new Error('Refresh page! Coupon usage limit reached');

    const courses = await prisma.courses.findMany({
        where: { Id: { in: courseIds } },
        select: { Price: true }
    });

    const originalTotal = courses.reduce((sum, course) => sum + Number(course.Price), 0);
    let discountAmount = 0;

    if (coupon.DiscountType === 'PERCENTAGE') {
        discountAmount = (originalTotal * coupon.DiscountValue) / 100;
    } else {
        discountAmount = coupon.DiscountValue;
    }

    if (discountAmount > originalTotal) discountAmount = originalTotal;

    return { coupon, discountAmount, originalTotal };
};

/**
 * Shared internal helper to fulfill an order (create bills, enrollments, cleanup)
 */
async function fulfillOrder(tx, checkoutId) {
    // 1. Get Checkout
    const checkout = await tx.cartCheckout.findUnique({
        where: { Id: checkoutId },
        include: { Coupons: true }
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
            TransactionId: checkout.TotalAmount === 0n ? `FREE_${Date.now()}` : `TXN_${Date.now()}`,
            DiscountAmount: checkout.DiscountAmount,
            CouponCode: checkout.Coupons ? checkout.Coupons.Code : null
        }
    });

    // 3. Create Enrollments
    const courseIds = JSON.parse(checkout.CourseIds);
    
    // Track which ones are actually NEW to avoid double counting
    let newEnrollmentsCount = 0;
    const newEnrolledCourseIds = [];

    const enrollments = await Promise.all(courseIds.map(async (courseId) => {
        // Check if exists first to decide on counter
        const existing = await tx.enrollments.findUnique({
            where: {
                CreatorId_CourseId: {
                    CreatorId: checkout.UserId,
                    CourseId: courseId
                }
            }
        });

        if (!existing) {
            newEnrollmentsCount++;
            newEnrolledCourseIds.push(courseId);
        }

        return tx.enrollments.upsert({
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
        });
    }));

    // --- NEW: Update Counters (LearnerCount and EnrollmentCount) ---
    // Update User EnrollmentCount only by NEW items
    if (newEnrollmentsCount > 0) {
        await tx.users.update({
            where: { Id: checkout.UserId },
            data: { EnrollmentCount: { increment: newEnrollmentsCount } }
        });

        // Update Courses LearnerCount only for NEWLY enrolled courses
        await tx.courses.updateMany({
            where: { Id: { in: newEnrolledCourseIds } },
            data: { LearnerCount: { increment: 1 } }
        });
    }

    // 4. Remove from Wishlist if exists
    await tx.wishlist.deleteMany({
        where: {
            UserId: checkout.UserId,
            CourseId: { in: courseIds }
        }
    });

    // 5. Update Coupon Usage if used
    if (checkout.CouponId) {
        const coupon = checkout.Coupons;
        if (coupon && coupon.MaxUses) {
            const updateResult = await tx.coupons.updateMany({
                where: {
                    Id: checkout.CouponId,
                    UsedCount: { lt: coupon.MaxUses }
                },
                data: {
                    UsedCount: { increment: 1 }
                }
            });

            if (updateResult.count === 0) {
                throw new Error('Coupon usage limit reached during fulfillment');
            }
        } else {
            await tx.coupons.update({
                where: { Id: checkout.CouponId },
                data: { UsedCount: { increment: 1 } }
            });
        }
    }

    // 6. Update Checkout Status
    await tx.cartCheckout.update({
        where: { Id: checkoutId },
        data: {
            Status: 'COMPLETED',
            ProcessedTime: new Date()
        }
    });

    return {
        success: true,
        enrollmentsCount: enrollments.length,
        userId: checkout.UserId,
        totalAmount: checkout.TotalAmount.toString(),
        courseIds: courseIds
    };
}

/**
 * Shared helper to send success email
 */
async function sendSuccessEmail(userId, checkoutId, totalAmount, courseIds) {
    try {
        const user = await prisma.users.findUnique({
            where: { Id: userId },
            select: { Email: true, FullName: true }
        });

        const courses = await prisma.courses.findMany({
            where: { Id: { in: courseIds } },
            select: { Title: true, Price: true }
        });

        if (user) {
            await emailQueue.add('sendPurchaseSuccess', {
                email: user.Email,
                fullName: user.FullName,
                orderData: {
                    orderId: checkoutId,
                    totalAmount: Number(totalAmount),
                    courses: courses.map(c => ({ title: c.Title, price: Number(c.Price) }))
                }
            }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            });
            console.log('📧 Email job added to queue');
        }
    } catch (err) {
        console.error('⚠️ Failed to add email job to queue:', err.message);
    }
}

// Create a new checkout session
export const createCheckout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseIds, totalAmount, couponCode } = req.body;

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

        // --- NEW: Check if already enrolled in any of these courses ---
        const existingEnrollments = await prisma.enrollments.findMany({
            where: {
                CreatorId: userId,
                CourseId: { in: courseIds }
            },
            select: { CourseId: true }
        });

        if (existingEnrollments.length > 0) {
            const alreadyEnrolledIds = existingEnrollments.map(e => e.CourseId);
            const alreadyEnrolledTitles = courses
                .filter(c => alreadyEnrolledIds.includes(c.Id))
                .map(c => c.Title);
            
            return res.status(400).json({ 
                success: false, 
                error: `You are already enrolled in: ${alreadyEnrolledTitles.join(', ')}`,
                alreadyEnrolledIds
            });
        }

        // Verify total amount
        const baseTotal = courses.reduce((sum, course) => sum + Number(course.Price), 0);

        // Handle Coupon if provided
        let finalTotal = baseTotal;
        let discountAmount = 0;
        let appliedCouponId = null;

        if (couponCode) {
            try {
                const { coupon, discountAmount: disc } = await validateAndCalculateCoupon(couponCode, courseIds);
                discountAmount = disc;
                appliedCouponId = coupon.Id;
                finalTotal = baseTotal - discountAmount;
            } catch (e) {
                console.warn(`Invalid coupon passed to createCheckout: ${couponCode}`, e.message);
                // Return error so user knows the coupon is invalid
                return res.status(400).json({
                    success: false,
                    error: `Invalid coupon: ${e.message}`
                });
            }
        }

        const checkout = await prisma.cartCheckout.create({
            data: {
                UserId: userId,
                CourseIds: JSON.stringify(courseIds),
                TotalAmount: BigInt(Math.round(finalTotal)),
                DiscountAmount: BigInt(Math.round(discountAmount)),
                CouponId: appliedCouponId,
                PaymentMethod: 'VietQR',
                Status: 'PENDING',
                CreationTime: new Date()
            }
        });

        // --- NEW: Handle Free Enrollment Immediately ---
        if (finalTotal <= 0) {
            console.log(`🎁 Free course detected for user ${userId}. Auto-fulfilling...`);
            const result = await prisma.$transaction(async (tx) => {
                return await fulfillOrder(tx, checkout.Id);
            });

            if (result.success && !result.alreadyCompleted) {
                await sendSuccessEmail(result.userId, checkout.Id, result.totalAmount, result.courseIds);
            }

            return res.json({
                success: true,
                isFree: true,
                message: 'Enrolled successfully',
                data: {
                    checkoutId: checkout.Id,
                    totalAmount: '0',
                    status: 'COMPLETED'
                }
            });
        }

        res.json({
            success: true,
            data: {
                checkoutId: checkout.Id,
                totalAmount: checkout.TotalAmount.toString(),
                paymentMethod: checkout.PaymentMethod
            }
        });

    } catch (error) {
        console.error('Create checkout error:', error);
        res.status(500).json({ success: false, error: 'Failed to create checkout session' });
    }
};

// Check coupon validity without creating checkout
export const checkCoupon = async (req, res) => {
    try {
        const { code, courseIds } = req.body;

        if (!code || typeof code !== 'string' || !code.trim()) {
            return res.status(400).json({ success: false, error: 'Coupon code must be a non-empty string' });
        }

        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Course IDs must be a non-empty array' });
        }

        const { coupon, discountAmount, originalTotal } = await validateAndCalculateCoupon(code, courseIds);

        res.json({
            success: true,
            data: {
                isValid: true,
                code: coupon.Code,
                discountAmount,
                newTotal: originalTotal - discountAmount
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
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
            },
            include: {
                Coupons: true
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
                discountAmount: checkout.DiscountAmount ? checkout.DiscountAmount.toString() : null,
                couponCode: checkout.Coupons ? checkout.Coupons.Code : null,
                createdAt: checkout.CreationTime
            }
        });

    } catch (error) {
        console.error('Get checkout status error:', error);
        res.status(500).json({ success: false, error: 'Failed to get checkout status' });
    }
};

// Simulate payment success (Webhook mock)
export const webhookPayment = async (req, res) => {
    try {
        const { checkoutId } = req.body;

        // Start transaction
        const result = await prisma.$transaction(async (tx) => {
            return await fulfillOrder(tx, checkoutId);
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        // Send Email Notification
        if (result.success && !result.alreadyCompleted) {
            await sendSuccessEmail(result.userId, checkoutId, result.totalAmount, result.courseIds);
        } else if (result.alreadyCompleted) {
            console.log('ℹ️ Payment already completed, skipping email.');
        }

        res.json({ success: true, data: result });

    } catch (error) {
        console.error('Payment simulation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Apply Coupon to Checkout
export const applyCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code } = req.body;
        const userId = req.user.userId;

        // 1. Get Checkout
        const checkout = await prisma.cartCheckout.findFirst({
            where: { Id: id, UserId: userId }
        });

        if (!checkout) {
            return res.status(404).json({ success: false, error: 'Checkout session not found' });
        }

        if (checkout.Status !== 'PENDING') {
            return res.status(400).json({ success: false, error: 'Cannot apply coupon to completed checkout' });
        }

        // 2. Validate Coupon & 3. Calculate Discount
        let coupon, discountAmount, originalTotal;
        try {
            const courseIds = JSON.parse(checkout.CourseIds);
            // Use the shared helper
            const result = await validateAndCalculateCoupon(code, courseIds);
            coupon = result.coupon;
            discountAmount = result.discountAmount;
            originalTotal = result.originalTotal;
        } catch (e) {
            if (e.message === 'Invalid coupon code') {
                return res.status(404).json({ success: false, error: e.message });
            }
            return res.status(400).json({ success: false, error: e.message });
        }

        const newTotal = originalTotal - discountAmount;

        // 4. Update Checkout
        // 4. Update Checkout
        // Use updateMany to ensure we update only if Id matches AND UserId matches (Authorization/Ownership check)
        const updateResult = await prisma.cartCheckout.updateMany({
            where: {
                Id: id,
                UserId: userId
            },
            data: {
                CouponId: coupon.Id,
                DiscountAmount: Math.round(discountAmount),
                TotalAmount: Math.round(newTotal) // Update final payable amount
            }
        });

        if (updateResult.count === 0) {
            return res.status(403).json({ success: false, error: 'Checkout session not found or unauthorized' });
        }

        res.json({
            success: true,
            data: {
                id: id,
                totalAmount: Math.round(newTotal).toString(),
                discountAmount: Math.round(discountAmount).toString(),
                couponCode: coupon.Code
            }
        });

    } catch (error) {
        console.error('Apply coupon error:', error);
        res.status(500).json({ success: false, error: 'Failed to apply coupon' });
    }
};

// Get all available public coupons
export const getAvailableCoupons = async (req, res) => {
    try {
        const currentDate = new Date(); // Use local time or UTC as configured in Prisma

        // 1. Get IDs of valid coupons efficiently using Raw Query
        // This allows us to compare "UsedCount" < "MaxUses" checking at DB level
        // We handle "MaxUses IS NULL" (unlimited) OR "UsedCount < MaxUses"
        // Also ensure IsActive, IsPublic, and ExpiryDate valid
        const validCouponIdsRaw = await prisma.$queryRaw`
            SELECT "Id" 
            FROM "Coupons" 
            WHERE "IsActive" = true 
              AND "IsPublic" = true
              AND ("ExpiryDate" IS NULL OR "ExpiryDate" > ${currentDate})
              AND ("MaxUses" IS NULL OR "UsedCount" < "MaxUses")
        `;

        // validCouponIdsRaw is array of objects: [{ Id: '...' }, { Id: '...' }]
        const validIds = validCouponIdsRaw.map(c => c.Id);

        if (validIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 2. Fetch full details using Prisma proper for Type safety and relation mapping
        const coupons = await prisma.coupons.findMany({
            where: {
                Id: { in: validIds }
            },
            select: {
                Id: true,
                Code: true,
                DiscountType: true,
                DiscountValue: true,
                Title: true,
                Description: true,
                ExpiryDate: true,
                MaxUses: true,
                UsedCount: true
            },
            orderBy: {
                CreationTime: 'desc'
            }
        });

        res.json({
            success: true,
            data: coupons
        });

    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
    }
};
