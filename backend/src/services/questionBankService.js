import prisma from "../lib/prisma.js";

function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

async function getInstructorUserOrThrow(userId) {
    const user = await prisma.users.findUnique({
        where: { Id: userId },
        select: {
            Id: true,
            Role: true,
            InstructorId: true,
            FullName: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (normalizeRole(user.Role) !== "instructor") {
        throw new Error("Only instructors can access question banks");
    }

    return user;
}

export async function listInstructorQuestionBanksService({
    userId,
    tab = "mine",
    search = "",
    courseId,
}) {
    await getInstructorUserOrThrow(userId);

    const where = {
        CreatorId: userId,
    };

    if (tab === "published") {
        where.Status = "Published";
    } else if (tab === "archived") {
        where.Status = "Archived";
    }

    if (courseId) {
        where.CourseId = courseId;
    }

    if (search?.trim()) {
        where.OR = [
            {
                Name: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
            {
                Description: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
        ];
    }

    const banks = await prisma.questionBanks.findMany({
        where,
        select: {
            Id: true,
            Name: true,
            Description: true,
            Status: true,
            IsPublic: true,
            CourseId: true,
            CreationTime: true,
            LastModificationTime: true,
            Course: {
                select: {
                    Title: true,
                },
            },
            _count: {
                select: {
                    QuestionBankQuestions: true,
                },
            },
        },
        orderBy: {
            LastModificationTime: "desc",
        },
    });

    return banks.map((bank) => ({
        Id: bank.Id,
        Name: bank.Name,
        Description: bank.Description || "",
        Status: bank.Status,
        IsPublic: bank.IsPublic,
        CourseId: bank.CourseId,
        CourseTitle: bank.Course?.Title || "",
        QuestionCount: bank._count?.QuestionBankQuestions || 0,
        CreationTime: bank.CreationTime,
        LastModificationTime: bank.LastModificationTime,
    }));
}

export async function listInstructorCoursesForQuestionBankService({ userId }) {
    const user = await getInstructorUserOrThrow(userId);

    const courses = await prisma.courses.findMany({
        where: {
            OR: [
                { CreatorId: userId },
                ...(user.InstructorId ? [{ InstructorId: user.InstructorId }] : []),
            ],
        },
        select: {
            Id: true,
            Title: true,
            Status: true,
            ApprovalStatus: true,
            CreationTime: true,
        },
        orderBy: {
            Title: "asc",
        },
    });

    return courses;
}

export async function createQuestionBankService({
    userId,
    name,
    description,
    courseId,
}) {
    const user = await getInstructorUserOrThrow(userId);

    if (!name?.trim()) {
        throw new Error("Question bank name is required");
    }

    if (!courseId) {
        throw new Error("courseId is required");
    }

    const course = await prisma.courses.findFirst({
        where: {
            Id: courseId,
            OR: [
                { CreatorId: userId },
                ...(user.InstructorId ? [{ InstructorId: user.InstructorId }] : []),
            ],
        },
        select: {
            Id: true,
            Title: true,
        },
    });

    if (!course) {
        throw new Error("Course not found or you do not have permission");
    }

    const bank = await prisma.questionBanks.create({
        data: {
            Name: name.trim(),
            Description: description?.trim() || null,
            Status: "Draft",
            IsPublic: false,
            CourseId: courseId,
            CreatorId: userId,
            LastModifierId: userId,
        },
        select: {
            Id: true,
            Name: true,
            Description: true,
            Status: true,
            IsPublic: true,
            CourseId: true,
            CreationTime: true,
            LastModificationTime: true,
            Course: {
                select: {
                    Title: true,
                },
            },
            _count: {
                select: {
                    QuestionBankQuestions: true,
                },
            },
        },
    });

    return {
        Id: bank.Id,
        Name: bank.Name,
        Description: bank.Description || "",
        Status: bank.Status,
        IsPublic: bank.IsPublic,
        CourseId: bank.CourseId,
        CourseTitle: bank.Course?.Title || "",
        QuestionCount: bank._count?.QuestionBankQuestions || 0,
        CreationTime: bank.CreationTime,
        LastModificationTime: bank.LastModificationTime,
    };
}

export async function getQuestionBankDetailService({ userId, bankId }) {
    await getInstructorUserOrThrow(userId);

    const bank = await prisma.questionBanks.findFirst({
        where: {
            Id: bankId,
            CreatorId: userId,
        },
        select: {
            Id: true,
            Name: true,
            Description: true,
            Status: true,
            IsPublic: true,
            CourseId: true,
            CreatorId: true,
            CreationTime: true,
            LastModificationTime: true,
            Course: {
                select: {
                    Title: true,
                },
            },
            _count: {
                select: {
                    QuestionBankQuestions: true,
                },
            },
        },
    });

    if (!bank) {
        throw new Error("Question bank not found");
    }

    return {
        Id: bank.Id,
        Name: bank.Name,
        Description: bank.Description || "",
        Status: bank.Status,
        IsPublic: bank.IsPublic,
        CourseId: bank.CourseId,
        CourseTitle: bank.Course?.Title || "",
        CreatorId: bank.CreatorId,
        QuestionCount: bank._count?.QuestionBankQuestions || 0,
        CreationTime: bank.CreationTime,
        LastModificationTime: bank.LastModificationTime,
    };
}