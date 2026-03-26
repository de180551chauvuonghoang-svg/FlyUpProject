import prisma from "../lib/prisma.js";
import {
    validateQuestionBankMetadata,
    validateQuestionBankForPublish,
    validateQuestionBankQuestionDraft,
    validateQuestionBankChoicesDraft,
} from "./questionBankValidationService.js";

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
    page = 1,
    pageSize = 10,
    courseId,
    status,
    isPublic,
    keyword,
    sortBy = "updatedAt",
    sortOrder = "desc",
}) {
    await getInstructorUserOrThrow(userId);

    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedPageSize = Math.min(50, Math.max(1, Number(pageSize) || 10));
    const skip = (normalizedPage - 1) * normalizedPageSize;

    const where = {
        CreatorId: userId,
    };

    if (courseId) {
        where.CourseId = courseId;
    }

    if (status) {
        const allowedStatuses = ["Draft", "Published", "Archived"];
        if (!allowedStatuses.includes(status)) {
            throw new Error("Invalid status filter");
        }
        where.Status = status;
    }

    if (typeof isPublic === "string" && isPublic.length > 0) {
        if (isPublic !== "true" && isPublic !== "false") {
            throw new Error("isPublic must be true or false");
        }
        where.IsPublic = isPublic === "true";
    }

    if (keyword && String(keyword).trim()) {
        const trimmedKeyword = String(keyword).trim();
        where.OR = [
            {
                Name: {
                    contains: trimmedKeyword,
                    mode: "insensitive",
                },
            },
            {
                Description: {
                    contains: trimmedKeyword,
                    mode: "insensitive",
                },
            },
        ];
    }

    let orderBy;
    const normalizedSortOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    switch (sortBy) {
        case "createdAt":
            orderBy = { CreationTime: normalizedSortOrder };
            break;
        case "name":
            orderBy = { Name: normalizedSortOrder };
            break;
        case "questionCount":
            orderBy = {
                QuestionBankQuestions: {
                    _count: normalizedSortOrder,
                },
            };
            break;
        case "updatedAt":
        default:
            orderBy = { LastModificationTime: normalizedSortOrder };
            break;
    }

    const [items, total] = await prisma.$transaction([
        prisma.questionBanks.findMany({
            where,
            select: questionBankSummarySelect,
            orderBy,
            skip,
            take: normalizedPageSize,
        }),
        prisma.questionBanks.count({ where }),
    ]);

    return {
        items: items.map(mapQuestionBankSummary),
        meta: {
            page: normalizedPage,
            pageSize: normalizedPageSize,
            total,
            totalPages: Math.ceil(total / normalizedPageSize),
        },
    };
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

export async function createQuestionBankService({ userId, courseId, name, description }) {
    await getInstructorUserOrThrow(userId);
    validateQuestionBankMetadata({ name });

    const ownedCourse = await prisma.courses.findFirst({
        where: {
            Id: courseId,
            CreatorId: userId,
        },
        select: {
            Id: true,
            Title: true,
        },
    });

    if (!ownedCourse) {
        throw new Error("Course not found or does not belong to instructor");
    }

    const created = await prisma.questionBanks.create({
        data: {
            Name: String(name).trim(),
            Description: String(description || "").trim(),
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
        Id: created.Id,
        Name: created.Name,
        Description: created.Description || "",
        Status: created.Status,
        IsPublic: created.IsPublic,
        CourseId: created.CourseId,
        CourseTitle: created.Course?.Title || "",
        QuestionCount: created._count?.QuestionBankQuestions || 0,
        CreationTime: created.CreationTime,
        LastModificationTime: created.LastModificationTime,
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

export async function listQuestionBankQuestionsService({ userId, bankId }) {
    await getInstructorUserOrThrow(userId);

    const bank = await prisma.questionBanks.findFirst({
        where: {
            Id: bankId,
            CreatorId: userId,
        },
        select: {
            Id: true,
        },
    });

    if (!bank) {
        throw new Error("Question bank not found");
    }

    const questions = await prisma.questionBankQuestions.findMany({
        where: {
            QuestionBankId: bankId,
        },
        select: {
            Id: true,
            Content: true,
            Difficulty: true,
            ParamA: true,
            ParamB: true,
            ParamC: true,
            Explanation: true,
            Status: true,
            CreationTime: true,
            LastModificationTime: true,
            QuestionBankChoices: {
                select: {
                    Id: true,
                    Content: true,
                    IsCorrect: true,
                    OrderIndex: true,
                },
                orderBy: {
                    OrderIndex: "asc",
                },
            },
        },
        orderBy: {
            LastModificationTime: "desc",
        },
    });

    return questions.map((question) => ({
        Id: question.Id,
        Content: question.Content,
        Difficulty: question.Difficulty,
        ParamA: question.ParamA,
        ParamB: question.ParamB,
        ParamC: question.ParamC,
        Explanation: question.Explanation,
        Status: question.Status,
        CreationTime: question.CreationTime,
        LastModificationTime: question.LastModificationTime,
        Choices: question.QuestionBankChoices.map((choice) => ({
            Id: choice.Id,
            Content: choice.Content,
            IsCorrect: choice.IsCorrect,
            OrderIndex: choice.OrderIndex,
        })),
    }));
}

function normalizeQuestionChoices(choices = []) {
    return choices.map((choice, index) => ({
        content: String(choice?.content || '').trim(),
        isCorrect: Boolean(choice?.isCorrect),
        orderIndex: Number(choice?.orderIndex ?? index + 1),
    }));
}

function validateQuestionPayload({
    content,
    choices,
}) {
    const normalizedContent = String(content || '').trim();

    if (!normalizedContent) {
        throw new Error("Question content is required");
    }

    if (!Array.isArray(choices) || choices.length < 2) {
        throw new Error("Question must have at least 2 choices");
    }

    const normalizedChoices = normalizeQuestionChoices(choices);

    const emptyChoice = normalizedChoices.find((choice) => !choice.content);
    if (emptyChoice) {
        throw new Error("All choices must have content");
    }

    const correctCount = normalizedChoices.filter((choice) => choice.isCorrect).length;
    if (correctCount !== 1) {
        throw new Error("Question must have exactly 1 correct choice");
    }

    return {
        normalizedContent,
        normalizedChoices,
    };
}

export async function createQuestionBankQuestionService({
    userId,
    bankId,
    content,
    difficulty,
    paramA,
    paramB,
    paramC,
    explanation,
    status,
    choices,
}) {
    await getInstructorUserOrThrow(userId);

    const bank = await prisma.questionBanks.findFirst({
        where: {
            Id: bankId,
            CreatorId: userId,
        },
        select: {
            Id: true,
        },
    });

    if (!bank) {
        throw new Error("Question bank not found");
    }

    const { normalizedContent, normalizedChoices } = validateQuestionPayload({
        content,
        choices,
    });

    validateQuestionBankQuestionDraft({
        Content: content,
        Difficulty: difficulty,
        ParamA: paramA,
        ParamB: paramB,
        ParamC: paramC,
    });

    validateQuestionBankChoicesDraft(
        choices.map((choice) => ({
            Content: choice.content,
            IsCorrect: choice.isCorrect,
        }))
    );

    const createdQuestion = await prisma.$transaction(async (tx) => {
        const question = await tx.questionBankQuestions.create({
            data: {
                QuestionBankId: bankId,
                Content: normalizedContent,
                Difficulty: difficulty?.trim() || null,
                ParamA: paramA === '' || paramA === null || paramA === undefined ? null : Number(paramA),
                ParamB: paramB === '' || paramB === null || paramB === undefined ? null : Number(paramB),
                ParamC: paramC === '' || paramC === null || paramC === undefined ? null : Number(paramC),
                Explanation: explanation?.trim() || null,
                Status: status?.trim() || "Draft",
                CreatorId: userId,
                LastModifierId: userId,
            },
            select: {
                Id: true,
            },
        });

        await tx.questionBankChoices.createMany({
            data: normalizedChoices.map((choice) => ({
                QuestionBankQuestionId: question.Id,
                Content: choice.content,
                IsCorrect: choice.isCorrect,
                OrderIndex: choice.orderIndex,
            })),
        });

        return tx.questionBankQuestions.findUnique({
            where: {
                Id: question.Id,
            },
            select: {
                Id: true,
                Content: true,
                Difficulty: true,
                ParamA: true,
                ParamB: true,
                ParamC: true,
                Explanation: true,
                Status: true,
                CreationTime: true,
                LastModificationTime: true,
                QuestionBankChoices: {
                    select: {
                        Id: true,
                        Content: true,
                        IsCorrect: true,
                        OrderIndex: true,
                    },
                    orderBy: {
                        OrderIndex: "asc",
                    },
                },
            },
        });
    });

    return {
        Id: createdQuestion.Id,
        Content: createdQuestion.Content,
        Difficulty: createdQuestion.Difficulty,
        ParamA: createdQuestion.ParamA,
        ParamB: createdQuestion.ParamB,
        ParamC: createdQuestion.ParamC,
        Explanation: createdQuestion.Explanation,
        Status: createdQuestion.Status,
        CreationTime: createdQuestion.CreationTime,
        LastModificationTime: createdQuestion.LastModificationTime,
        Choices: createdQuestion.QuestionBankChoices.map((choice) => ({
            Id: choice.Id,
            Content: choice.Content,
            IsCorrect: choice.IsCorrect,
            OrderIndex: choice.OrderIndex,
        })),
    };
}

export async function updateQuestionBankQuestionService({
    userId,
    bankId,
    questionId,
    content,
    difficulty,
    paramA,
    paramB,
    paramC,
    explanation,
    status,
    choices,
}) {
    await getInstructorUserOrThrow(userId);

    const question = await prisma.questionBankQuestions.findFirst({
        where: {
            Id: questionId,
            QuestionBankId: bankId,
            QuestionBank: {
                CreatorId: userId,
            },
        },
        select: {
            Id: true,
        },
    });

    if (!question) {
        throw new Error("Question not found");
    }

    const { normalizedContent, normalizedChoices } = validateQuestionPayload({
        content,
        choices,
    });

    validateQuestionBankQuestionDraft({
        Content: content,
        Difficulty: difficulty,
        ParamA: paramA,
        ParamB: paramB,
        ParamC: paramC,
    });

    validateQuestionBankChoicesDraft(
        choices.map((choice) => ({
            Content: choice.content,
            IsCorrect: choice.isCorrect,
        }))
    );

    const updatedQuestion = await prisma.$transaction(async (tx) => {
        await tx.questionBankQuestions.update({
            where: {
                Id: questionId,
            },
            data: {
                Content: normalizedContent,
                Difficulty: difficulty?.trim() || null,
                ParamA: paramA === '' || paramA === null || paramA === undefined ? null : Number(paramA),
                ParamB: paramB === '' || paramB === null || paramB === undefined ? null : Number(paramB),
                ParamC: paramC === '' || paramC === null || paramC === undefined ? null : Number(paramC),
                Explanation: explanation?.trim() || null,
                Status: status?.trim() || "Draft",
                LastModifierId: userId,
                LastModificationTime: new Date(),
            },
        });

        // Unlink McqChoices
        const oldChoices = await tx.questionBankChoices.findMany({
            where: { QuestionBankQuestionId: questionId },
            select: { Id: true },
        });
        const oldChoiceIds = oldChoices.map((c) => c.Id);

        if (oldChoiceIds.length > 0) {
            await tx.mcqChoices.updateMany({
                where: { SourceQuestionBankChoiceId: { in: oldChoiceIds } },
                data: { SourceQuestionBankChoiceId: null },
            });
        }

        await tx.questionBankChoices.deleteMany({
            where: {
                QuestionBankQuestionId: questionId,
            },
        });

        await tx.questionBankChoices.createMany({
            data: normalizedChoices.map((choice) => ({
                QuestionBankQuestionId: questionId,
                Content: choice.content,
                IsCorrect: choice.isCorrect,
                OrderIndex: choice.orderIndex,
            })),
        });

        return tx.questionBankQuestions.findUnique({
            where: {
                Id: questionId,
            },
            select: {
                Id: true,
                Content: true,
                Difficulty: true,
                ParamA: true,
                ParamB: true,
                ParamC: true,
                Explanation: true,
                Status: true,
                CreationTime: true,
                LastModificationTime: true,
                QuestionBankChoices: {
                    select: {
                        Id: true,
                        Content: true,
                        IsCorrect: true,
                        OrderIndex: true,
                    },
                    orderBy: {
                        OrderIndex: "asc",
                    },
                },
            },
        });
    });

    return {
        Id: updatedQuestion.Id,
        Content: updatedQuestion.Content,
        Difficulty: updatedQuestion.Difficulty,
        ParamA: updatedQuestion.ParamA,
        ParamB: updatedQuestion.ParamB,
        ParamC: updatedQuestion.ParamC,
        Explanation: updatedQuestion.Explanation,
        Status: updatedQuestion.Status,
        CreationTime: updatedQuestion.CreationTime,
        LastModificationTime: updatedQuestion.LastModificationTime,
        Choices: updatedQuestion.QuestionBankChoices.map((choice) => ({
            Id: choice.Id,
            Content: choice.Content,
            IsCorrect: choice.IsCorrect,
            OrderIndex: choice.OrderIndex,
        })),
    };
}

export async function deleteQuestionBankQuestionService({
    userId,
    bankId,
    questionId,
}) {
    await getInstructorUserOrThrow(userId);

    const question = await prisma.questionBankQuestions.findFirst({
        where: {
            Id: questionId,
            QuestionBankId: bankId,
            QuestionBank: {
                CreatorId: userId,
            },
        },
        select: {
            Id: true,
        },
    });

    if (!question) {
        throw new Error("Question not found");
    }

    await prisma.$transaction(async (tx) => {
        // Unlink McqQuestions
        await tx.mcqQuestions.updateMany({
            where: { SourceQuestionBankQuestionId: questionId },
            data: { SourceQuestionBankQuestionId: null },
        });

        // Unlink McqChoices
        const oldChoices = await tx.questionBankChoices.findMany({
            where: { QuestionBankQuestionId: questionId },
            select: { Id: true },
        });
        const oldChoiceIds = oldChoices.map((c) => c.Id);

        if (oldChoiceIds.length > 0) {
            await tx.mcqChoices.updateMany({
                where: { SourceQuestionBankChoiceId: { in: oldChoiceIds } },
                data: { SourceQuestionBankChoiceId: null },
            });
        }

        await tx.questionBankQuestions.delete({
            where: {
                Id: questionId,
            },
        });
    });

    return {
        success: true,
        deletedQuestionId: questionId,
    };
}

async function getOwnedQuestionBankOrThrow(userId, bankId) {
    await getInstructorUserOrThrow(userId);

    const bank = await prisma.questionBanks.findFirst({
        where: {
            Id: bankId,
            CreatorId: userId,
        },
        select: {
            Id: true,
            Name: true,
            Status: true,
            IsPublic: true,
            CreatorId: true,
        },
    });

    if (!bank) {
        throw new Error("Question bank not found");
    }

    return bank;
}

async function validateQuestionBankPublishable(bankId) {
    const questions = await prisma.questionBankQuestions.findMany({
        where: {
            QuestionBankId: bankId,
        },
        select: {
            Id: true,
            Content: true,
            QuestionBankChoices: {
                select: {
                    Id: true,
                    Content: true,
                    IsCorrect: true,
                },
                orderBy: {
                    OrderIndex: "asc",
                },
            },
        },
    });

    if (questions.length === 0) {
        throw new Error("Cannot publish an empty question bank");
    }

    for (const question of questions) {
        if (!String(question.Content || "").trim()) {
            throw new Error("All questions must have content before publishing");
        }

        if (!Array.isArray(question.QuestionBankChoices) || question.QuestionBankChoices.length < 2) {
            throw new Error("Every question must have at least 2 choices before publishing");
        }

        const hasEmptyChoice = question.QuestionBankChoices.some(
            (choice) => !String(choice.Content || "").trim()
        );

        if (hasEmptyChoice) {
            throw new Error("All choices must have content before publishing");
        }

        const correctCount = question.QuestionBankChoices.filter(
            (choice) => Boolean(choice.IsCorrect)
        ).length;

        if (correctCount !== 1) {
            throw new Error("Every question must have exactly 1 correct answer before publishing");
        }
    }

    return {
        questionCount: questions.length,
    };
}

export async function publishQuestionBankService({ userId, bankId }) {
    await getOwnedQuestionBankOrThrow(userId, bankId);

    const fullBank = await prisma.questionBanks.findFirst({
        where: {
            Id: bankId,
            CreatorId: userId,
        },
        select: {
            Id: true,
            QuestionBankQuestions: {
                select: {
                    Id: true,
                    Content: true,
                    Difficulty: true,
                    Status: true,
                    ParamA: true,
                    ParamB: true,
                    ParamC: true,
                    QuestionBankChoices: {
                        select: {
                            Id: true,
                            Content: true,
                            IsCorrect: true,
                            OrderIndex: true,
                        },
                        orderBy: {
                            OrderIndex: "asc",
                        },
                    },
                },
            },
        },
    });

    validateQuestionBankForPublish(fullBank);

    const updated = await prisma.questionBanks.update({
        where: {
            Id: bankId,
        },
        data: {
            Status: "Published",
            IsPublic: true,
            LastModifierId: userId,
            LastModificationTime: new Date(),
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
        Id: updated.Id,
        Name: updated.Name,
        Description: updated.Description || "",
        Status: updated.Status,
        IsPublic: updated.IsPublic,
        CourseId: updated.CourseId,
        CourseTitle: updated.Course?.Title || "",
        QuestionCount: updated._count?.QuestionBankQuestions || 0,
        CreationTime: updated.CreationTime,
        LastModificationTime: updated.LastModificationTime,
    };
}

export async function unpublishQuestionBankService({ userId, bankId }) {
    await getOwnedQuestionBankOrThrow(userId, bankId);

    const updated = await prisma.questionBanks.update({
        where: {
            Id: bankId,
        },
        data: {
            Status: "Draft",
            IsPublic: false,
            LastModifierId: userId,
            LastModificationTime: new Date(),
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
        Id: updated.Id,
        Name: updated.Name,
        Description: updated.Description || "",
        Status: updated.Status,
        IsPublic: updated.IsPublic,
        CourseId: updated.CourseId,
        CourseTitle: updated.Course?.Title || "",
        QuestionCount: updated._count?.QuestionBankQuestions || 0,
        CreationTime: updated.CreationTime,
        LastModificationTime: updated.LastModificationTime,
    };
}
export async function listPublishedQuestionBanksByCourseService({ userId, courseId }) {
    await getInstructorUserOrThrow(userId);

    const banks = await prisma.questionBanks.findMany({
        where: {
            CreatorId: userId,
            CourseId: courseId,
            IsPublic: true,
            Status: "Published",
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
        QuestionCount: bank._count?.QuestionBankQuestions || 0,
        CreationTime: bank.CreationTime,
        LastModificationTime: bank.LastModificationTime,
    }));
}

const questionBankSummarySelect = {
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
};

function mapQuestionBankSummary(bank) {
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

export async function updateQuestionBankService({
    userId,
    bankId,
    name,
    description,
}) {
    await getInstructorUserOrThrow(userId);
    await getOwnedQuestionBankOrThrow(userId, bankId);

    validateQuestionBankMetadata({ name });

    const updated = await prisma.questionBanks.update({
        where: {
            Id: bankId,
        },
        data: {
            Name: String(name).trim(),
            Description: String(description || "").trim(),
            LastModifierId: userId,
            LastModificationTime: new Date(),
        },
        select: questionBankSummarySelect,
    });

    return mapQuestionBankSummary(updated);
}

export async function archiveQuestionBankService({
    userId,
    bankId,
}) {
    await getInstructorUserOrThrow(userId);

    const bank = await getOwnedQuestionBankOrThrow(userId, bankId);

    if (bank.Status === "Archived") {
        throw new Error("Question bank is already archived");
    }

    const updated = await prisma.questionBanks.update({
        where: {
            Id: bankId,
        },
        data: {
            Status: "Archived",
            IsPublic: false,
            LastModifierId: userId,
            LastModificationTime: new Date(),
        },
        select: questionBankSummarySelect,
    });

    return mapQuestionBankSummary(updated);
}

export async function restoreQuestionBankService({
    userId,
    bankId,
}) {
    await getInstructorUserOrThrow(userId);

    const bank = await getOwnedQuestionBankOrThrow(userId, bankId);

    if (bank.Status !== "Archived") {
        throw new Error("Only archived question banks can be restored");
    }

    const updated = await prisma.questionBanks.update({
        where: {
            Id: bankId,
        },
        data: {
            Status: "Draft",
            IsPublic: false,
            LastModifierId: userId,
            LastModificationTime: new Date(),
        },
        select: questionBankSummarySelect,
    });

    return mapQuestionBankSummary(updated);
}