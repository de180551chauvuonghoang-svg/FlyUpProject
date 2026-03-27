import prisma from '../lib/prisma.js';

/**
 * Get Instructor Wallet Dashboard
 * Returns balance, bank details, and summary stats
 */
export const getWalletDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        const instructor = await prisma.instructors.findFirst({
            where: { CreatorId: userId },
            include: {
                _count: {
                    select: { Courses: true }
                }
            }
        });

        if (!instructor) {
            return res.status(404).json({ error: 'Instructor profile not found' });
        }

        // Calculate total students and sum of prices for sold courses (approximate earnings)
        const courses = await prisma.courses.findMany({
            where: { InstructorId: instructor.Id },
            select: {
                LearnerCount: true,
                Price: true
            }
        });

        const totalSold = courses.reduce((sum, c) => sum + (c.LearnerCount || 0), 0);
        
        res.json({
            balance: instructor.Balance.toString(),
            bankName: instructor.BankName || '', 
            bankAccountNumber: instructor.BankAccountNumber || '', 
            bankAccountName: instructor.BankAccountName || '',
            totalCoursesSold: totalSold,
            courseCount: instructor._count.Courses
        });
    } catch (error) {
        console.error('Get wallet dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Update Instructor Bank Details
 */
export const updateBankDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bankName, bankAccountNumber, bankAccountName } = req.body;

        const instructor = await prisma.instructors.findFirst({
            where: { CreatorId: userId }
        });

        if (!instructor) {
            return res.status(404).json({ error: 'Instructor profile not found' });
        }

        await prisma.instructors.update({
            where: { Id: instructor.Id },
            data: {
                BankName: bankName,
                BankAccountNumber: bankAccountNumber,
                BankAccountName: bankAccountName,
                LastModificationTime: new Date()
            }
        });

        res.json({ success: true, message: 'Bank details updated successfully' });
    } catch (error) {
        console.error('Update bank details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Request Withdrawal
 */
export const requestWithdrawal = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid withdrawal amount' });
        }

        const amountBigInt = BigInt(Math.floor(amount));

        const instructor = await prisma.instructors.findFirst({
            where: { CreatorId: userId }
        });

        if (!instructor) {
            return res.status(404).json({ error: 'Instructor profile not found' });
        }

        if (instructor.Balance < amountBigInt) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Get snapshot stats
        const courses = await prisma.courses.findMany({
            where: { InstructorId: instructor.Id },
            select: { LearnerCount: true }
        });
        const totalSold = courses.reduce((sum, c) => sum + (c.LearnerCount || 0), 0);

        // Create withdrawal request with bank snapshot
        const request = await prisma.withdrawalRequests.create({
            data: {
                InstructorId: instructor.Id,
                Amount: amountBigInt,
                Status: 'PENDING',
                TotalCoursesSold: totalSold,
                TotalEarnings: instructor.Balance,
                BankName: instructor.BankName,
                BankAccountNumber: instructor.BankAccountNumber,
                BankAccountName: instructor.BankAccountName
            }
        });

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            requestId: request.Id
        });
    } catch (error) {
        console.error('Request withdrawal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get Withdrawal History (for instructor)
 */
export const getWithdrawalHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const instructor = await prisma.instructors.findFirst({
            where: { CreatorId: userId }
        });

        if (!instructor) {
            return res.status(404).json({ error: 'Instructor profile not found' });
        }

        const [requests, total] = await Promise.all([
            prisma.withdrawalRequests.findMany({
                where: { InstructorId: instructor.Id },
                skip,
                take: parseInt(limit),
                orderBy: { CreationTime: 'desc' }
            }),
            prisma.withdrawalRequests.count({
                where: { InstructorId: instructor.Id }
            })
        ]);

        res.json({
            requests: requests.map(r => ({
                id: r.Id,
                amount: r.Amount.toString(),
                status: r.Status,
                createdAt: r.CreationTime,
                processedAt: r.ProcessedTime,
                rejectReason: r.RejectionReason
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Get withdrawal history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * ADMIN: Get All Withdrawal Requests
 */
export const getAllWithdrawalRequests = async (req, res) => {
    try {
        const { status = 'PENDING', page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (status !== 'ALL') {
            where.Status = status;
        }

        const [requests, total] = await Promise.all([
            prisma.withdrawalRequests.findMany({
                where,
                include: {
                    Instructor: {
                        include: {
                            Users_Instructors_CreatorIdToUsers: {
                                select: {
                                    FullName: true,
                                    Email: true,
                                    AvatarUrl: true
                                }
                            }
                        }
                    }
                },
                skip,
                take: parseInt(limit),
                orderBy: { CreationTime: 'desc' }
            }),
            prisma.withdrawalRequests.count({ where })
        ]);

        res.json({
            requests: requests.map(r => ({
                id: r.Id,
                amount: r.Amount.toString(),
                status: r.Status,
                createdAt: r.CreationTime,
                stats: {
                    totalSold: r.TotalCoursesSold,
                    totalEarnings: r.TotalEarnings.toString()
                },
                bankName: r.BankName,
                accountNumber: r.BankAccountNumber,
                accountName: r.BankAccountName,
                instructor: {
                    id: r.InstructorId,
                    name: r.Instructor.Users_Instructors_CreatorIdToUsers.FullName,
                    email: r.Instructor.Users_Instructors_CreatorIdToUsers.Email,
                    avatar: r.Instructor.Users_Instructors_CreatorIdToUsers.AvatarUrl
                }
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Admin get all withdrawal requests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * ADMIN: Process Withdrawal Request
 */
export const processWithdrawalRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;

        const request = await prisma.withdrawalRequests.findUnique({
            where: { Id: id }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.Status !== 'PENDING') {
            return res.status(400).json({ error: 'Request has already been processed' });
        }

        if (action === 'APPROVE') {
            await prisma.$transaction([
                prisma.withdrawalRequests.update({
                    where: { Id: id },
                    data: {
                        Status: 'APPROVED',
                        ProcessedTime: new Date()
                    }
                }),
                prisma.instructors.update({
                    where: { Id: request.InstructorId },
                    data: {
                        Balance: { decrement: request.Amount },
                        LastModificationTime: new Date()
                    }
                })
            ]);

            res.json({ success: true, message: 'Request approved' });
        } else if (action === 'REJECT') {
            await prisma.withdrawalRequests.update({
                where: { Id: id },
                data: {
                    Status: 'REJECTED',
                    ProcessedTime: new Date(),
                    RejectionReason: reason || 'Rejected by admin'
                }
            });

            res.json({ success: true, message: 'Request rejected' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Admin process withdrawal request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
