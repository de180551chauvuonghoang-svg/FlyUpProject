import prisma from "../lib/prisma.js";
import { validateQuestionBankForSnapshot, validateAssignmentQuestionSelection } from "./questionBankValidationService.js";

async function getInstructorUserOrThrow(userId) {
    const user = await prisma.users.findUnique({
        where: { Id: userId },
        select: {
            Id: true,
            Role: true,
            InstructorId: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (String(user.Role || "").toLowerCase() !== "instructor") {
        throw new Error("Only instructors can create assignments from question bank");
    }

    return user;
}

async function getOwnedSectionOrThrow({ userId, instructorId, courseId, sectionId }) {
    const section = await prisma.sections.findFirst({
        where: {
            Id: sectionId,
            CourseId: courseId,
            Courses: {
                OR: [
                    { CreatorId: userId },
                    ...(instructorId ? [{ InstructorId: instructorId }] : []),
                ],
            },
        },
        select: {
            Id: true,
            Title: true,
            CourseId: true,
            Courses: {
                select: {
                    Id: true,
                    Title: true,
                    CreatorId: true,
                    InstructorId: true,
                },
            },
        },
    });

    if (!section) {
        throw new Error("Section not found or does not belong to your course");
    }

    return section;
}

async function getPublishedOwnedQuestionBankOrThrow({ userId, courseId, sourceQuestionBankId }) {
    const bank = await prisma.questionBanks.findFirst({
        where: {
            Id: sourceQuestionBankId,
            CourseId: courseId,
            CreatorId: userId,
            IsPublic: true,
            Status: "Published",
        },
        select: {
            Id: true,
            Name: true,
            CourseId: true,
            Status: true,
            IsPublic: true,
            QuestionBankQuestions: {
                where: {
                    Status: "Published",
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
                    CreationTime: "asc",
                },
            },
        },
    });

    if (!bank) {
        throw new Error("Published question bank not found or not owned by you");
    }

    return bank;
}

export async function createAssignmentFromQuestionBankService({
    userId,
    courseId,
    sectionId,
    name,
    duration,
    gradeToPass,
    sourceQuestionBankId,
    questionIds = [], // Added questionIds
}) {
    const normalizedName = String(name || "").trim();

    if (!normalizedName) {
        throw new Error("Assignment name is required");
    }

    const normalizedDuration = Number(duration);
    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
        throw new Error("Duration must be a positive number");
    }

    const normalizedGradeToPass = Number(gradeToPass);
    if (!Number.isFinite(normalizedGradeToPass) || normalizedGradeToPass < 0 || normalizedGradeToPass > 10) {
        throw new Error("GradeToPass must be between 0 and 10");
    }

    if (!courseId || !sectionId || !sourceQuestionBankId) {
        throw new Error("courseId, sectionId, and sourceQuestionBankId are required");
    }

    const instructorUser = await getInstructorUserOrThrow(userId);

    await getOwnedSectionOrThrow({
        userId,
        instructorId: instructorUser.InstructorId,
        courseId,
        sectionId,
    });

    const questionBank = await getPublishedOwnedQuestionBankOrThrow({
        userId,
        courseId,
        sourceQuestionBankId,
    });

    validateQuestionBankForSnapshot(questionBank);
    let sourceQuestions = questionBank.QuestionBankQuestions || [];

    // Filter by questionIds if provided
    if (Array.isArray(questionIds) && questionIds.length > 0) {
        sourceQuestions = sourceQuestions.filter(q => questionIds.includes(q.Id));
        
        if (sourceQuestions.length === 0) {
            throw new Error("None of the selected questions were found in the source bank");
        }
    }

    // Validate selected questions: total ≥10 AND each level ≥2
    validateAssignmentQuestionSelection(sourceQuestions);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Tạo assignment
        const assignment = await tx.assignments.create({
            data: {
                Name: normalizedName,
                Duration: normalizedDuration,
                QuestionCount: 0,
                SectionId: sectionId,
                CreatorId: userId,
                GradeToPass: normalizedGradeToPass,
                SourceQuestionBankId: sourceQuestionBankId,
            },
            select: {
                Id: true,
                Name: true,
                SourceQuestionBankId: true,
            },
        });

        // 2. Bulk insert tất cả McqQuestions cùng lúc thay vì từng cái
        await tx.mcqQuestions.createMany({
            data: sourceQuestions.map((q) => ({
                Content: q.Content,
                AssignmentId: assignment.Id,
                ParamA: q.ParamA,
                ParamB: q.ParamB,
                ParamC: q.ParamC,
                Difficulty: q.Difficulty || null,
                SourceQuestionBankQuestionId: q.Id,
            })),
        });

        // 3. Fetch lại IDs của các câu vừa tạo để map với choices
        const createdQuestions = await tx.mcqQuestions.findMany({
            where: {
                AssignmentId: assignment.Id,
                SourceQuestionBankQuestionId: { in: sourceQuestions.map((q) => q.Id) },
            },
            select: { Id: true, SourceQuestionBankQuestionId: true },
        });

        const sourceIdToMcqId = new Map(
            createdQuestions.map((q) => [q.SourceQuestionBankQuestionId, q.Id])
        );

        // 4. Bulk insert tất cả choices cùng lúc
        const allChoices = [];
        for (const q of sourceQuestions) {
            const mcqId = sourceIdToMcqId.get(q.Id);
            if (!mcqId) continue;
            for (const choice of q.QuestionBankChoices || []) {
                allChoices.push({
                    Content: choice.Content,
                    IsCorrect: choice.IsCorrect,
                    McqQuestionId: mcqId,
                    SourceQuestionBankChoiceId: choice.Id,
                });
            }
        }

        if (allChoices.length > 0) {
            await tx.mcqChoices.createMany({ data: allChoices });
        }

        // 5. Update question count
        const updatedAssignment = await tx.assignments.update({
            where: { Id: assignment.Id },
            data: { QuestionCount: sourceQuestions.length },
            select: {
                Id: true,
                Name: true,
                QuestionCount: true,
                SourceQuestionBankId: true,
            },
        });

        return updatedAssignment;
    }, { timeout: 30000 }); // Tăng lên 30 giây

    return {
        assignmentId: result.Id,
        name: result.Name,
        questionCount: result.QuestionCount,
        sourceQuestionBankId: result.SourceQuestionBankId,
    };
}

export async function listAssignmentsByQuestionBankService({
    userId,
    questionBankId,
}) {
    const bank = await prisma.questionBanks.findFirst({
        where: {
            Id: questionBankId,
            CreatorId: userId,
        },
        select: {
            Id: true,
        },
    });

    if (!bank) {
        throw new Error("Question bank not found");
    }

    const assignments = await prisma.assignments.findMany({
        where: {
            SourceQuestionBankId: questionBankId,
            CreatorId: userId,
        },
        select: {
            Id: true,
            Name: true,
            Duration: true,
            GradeToPass: true,
            QuestionCount: true,
            Sections: {
                select: {
                    Id: true,
                    Title: true,
                    Index: true,
                    Courses: {
                        select: {
                            Id: true,
                            Title: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    Submissions: true,
                },
            },
        },
        orderBy: {
            Id: "desc",
        },
    });

    return assignments.map((assignment) => ({
        Id: assignment.Id,
        Name: assignment.Name,
        Duration: assignment.Duration,
        GradeToPass: assignment.GradeToPass,
        QuestionCount: assignment.QuestionCount,
        SubmissionCount: assignment._count?.Submissions || 0,
        Section: assignment.Sections
            ? {
                Id: assignment.Sections.Id,
                Title: assignment.Sections.Title,
                Index: assignment.Sections.Index,
            }
            : null,
        Course: assignment.Sections?.Courses
            ? {
                Id: assignment.Sections.Courses.Id,
                Title: assignment.Sections.Courses.Title,
            }
            : null,
    }));
}
export async function getAssignmentSnapshotDetailService({
    userId,
    assignmentId,
}) {
    const assignment = await prisma.assignments.findFirst({
        where: {
            Id: assignmentId,
            CreatorId: userId,
        },
        select: {
            Id: true,
            Name: true,
            Duration: true,
            GradeToPass: true,
            QuestionCount: true,
            SourceQuestionBankId: true,
            Sections: {
                select: {
                    Id: true,
                    Title: true,
                    Index: true,
                    Courses: {
                        select: {
                            Id: true,
                            Title: true,
                        },
                    },
                },
            },
            McqQuestions: {
                select: {
                    Id: true,
                    Content: true,
                    Difficulty: true,
                    ParamA: true,
                    ParamB: true,
                    ParamC: true,
                    SourceQuestionBankQuestionId: true,
                    McqChoices: {
                        select: {
                            Id: true,
                            Content: true,
                            IsCorrect: true,
                            SourceQuestionBankChoiceId: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    Submissions: true,
                },
            },
        },
    });

    if (!assignment) {
        throw new Error("Assignment not found");
    }

    return {
        Id: assignment.Id,
        Name: assignment.Name,
        Duration: assignment.Duration,
        GradeToPass: assignment.GradeToPass,
        QuestionCount: assignment.QuestionCount,
        SourceQuestionBankId: assignment.SourceQuestionBankId,
        SubmissionCount: assignment._count?.Submissions || 0,
        Section: assignment.Sections
            ? {
                Id: assignment.Sections.Id,
                Title: assignment.Sections.Title,
                Index: assignment.Sections.Index,
            }
            : null,
        Course: assignment.Sections?.Courses
            ? {
                Id: assignment.Sections.Courses.Id,
                Title: assignment.Sections.Courses.Title,
            }
            : null,
        Questions: (assignment.McqQuestions || []).map((question) => ({
            Id: question.Id,
            Content: question.Content,
            Difficulty: question.Difficulty,
            ParamA: question.ParamA,
            ParamB: question.ParamB,
            ParamC: question.ParamC,
            SourceQuestionBankQuestionId: question.SourceQuestionBankQuestionId,
            Choices: (question.McqChoices || []).map((choice) => ({
                Id: choice.Id,
                Content: choice.Content,
                IsCorrect: choice.IsCorrect,
                SourceQuestionBankChoiceId: choice.SourceQuestionBankChoiceId,
            })),
        })),
    };
}


export async function updateAssignmentSnapshotService({
    userId,
    assignmentId,
    name,
    duration,
    gradeToPass,
    sectionId,
    questionIds = [], // Latest selection from bank
}) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) throw new Error("Assignment name is required");

    const normalizedDuration = Number(duration);
    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
        throw new Error("Duration must be a positive number");
    }

    const normalizedGradeToPass = Number(gradeToPass);
    if (!Number.isFinite(normalizedGradeToPass) || normalizedGradeToPass < 0 || normalizedGradeToPass > 10) {
        throw new Error("GradeToPass must be between 0 and 10");
    }

    const assignment = await prisma.assignments.findFirst({
        where: { Id: assignmentId, CreatorId: userId },
        select: {
            Id: true,
            SectionId: true,
            SourceQuestionBankId: true,
            McqQuestions: {
                select: {
                    Id: true,
                    SourceQuestionBankQuestionId: true,
                },
            },
            Sections: {
                select: {
                    CourseId: true,
                },
            },
        },
    });

    if (!assignment) throw new Error("Assignment not found or not owned by you");

    // If section changed, validate ownership
    if (sectionId && sectionId !== assignment.SectionId) {
        const instructorUser = await getInstructorUserOrThrow(userId);
        await getOwnedSectionOrThrow({
            userId,
            instructorId: instructorUser.InstructorId,
            courseId: assignment.Sections?.CourseId,
            sectionId,
        });
    }

    return await prisma.$transaction(async (tx) => {
        // 1. Update basic info
        await tx.assignments.update({
            where: { Id: assignmentId },
            data: {
                Name: normalizedName,
                Duration: normalizedDuration,
                GradeToPass: normalizedGradeToPass,
                SectionId: sectionId || assignment.SectionId,
            },
            select: { Id: true },
        });

        // 2. Manage questions if questionIds provided
        if (Array.isArray(questionIds) && questionIds.length > 0) {
            // Validate total ≥10 AND each level ≥2 before applying changes
            // We need the difficulty info from the bank questions, so fetch them
            const bankQuestionsForValidation = await tx.questionBankQuestions.findMany({
                where: {
                    Id: { in: questionIds },
                    QuestionBankId: assignment.SourceQuestionBankId,
                },
                select: { Id: true, Difficulty: true },
            });
            validateAssignmentQuestionSelection(bankQuestionsForValidation);

            const currentQuestions = assignment.McqQuestions || [];

            // Xóa orphan McqQuestions (không có SourceQuestionBankQuestionId) vì không thể track
            await tx.mcqQuestions.deleteMany({
                where: {
                    AssignmentId: assignmentId,
                    SourceQuestionBankQuestionId: null,
                },
            });

            // Current source IDs mapped in this assignment
            const currentSourceIds = currentQuestions
                .map(q => q.SourceQuestionBankQuestionId)
                .filter(Boolean);

            // Questions to delete: those whose source ID is NOT in the new selection
            const toDeleteIds = currentQuestions
                .filter(q => q.SourceQuestionBankQuestionId && !questionIds.includes(q.SourceQuestionBankQuestionId))
                .map(q => q.Id);

            if (toDeleteIds.length > 0) {
                await tx.mcqQuestions.deleteMany({
                    where: { Id: { in: toDeleteIds } },
                });
            }

            // Questions to add: those in new selection NOT currently in this assignment
            const toAddSourceIds = questionIds.filter(sid => !currentSourceIds.includes(sid));

            if (toAddSourceIds.length > 0) {
                // Fetch details for the new questions from the original Question Bank
                const sourceQuestions = await tx.questionBankQuestions.findMany({
                    where: { 
                        Id: { in: toAddSourceIds },
                        QuestionBankId: assignment.SourceQuestionBankId 
                    },
                    select: {
                        Id: true,
                        Content: true,
                        Difficulty: true,
                        ParamA: true,
                        ParamB: true,
                        ParamC: true,
                        QuestionBankChoices: {
                            select: {
                                Id: true,
                                Content: true,
                                IsCorrect: true,
                            },
                        },
                    },
                });

                for (const sourceQuestion of sourceQuestions) {
                    const createdQuestion = await tx.mcqQuestions.create({
                        data: {
                            Content: sourceQuestion.Content,
                            AssignmentId: assignment.Id,
                            ParamA: sourceQuestion.ParamA,
                            ParamB: sourceQuestion.ParamB,
                            ParamC: sourceQuestion.ParamC,
                            Difficulty: sourceQuestion.Difficulty || null,
                            SourceQuestionBankQuestionId: sourceQuestion.Id,
                        },
                        select: { Id: true },
                    });

                    if ((sourceQuestion.QuestionBankChoices || []).length > 0) {
                        await tx.mcqChoices.createMany({
                            data: sourceQuestion.QuestionBankChoices.map((sourceChoice) => ({
                                Content: sourceChoice.Content,
                                IsCorrect: sourceChoice.IsCorrect,
                                McqQuestionId: createdQuestion.Id,
                                SourceQuestionBankChoiceId: sourceChoice.Id,
                            })),
                        });
                    }
                }
            }

            // Update question count
            await tx.assignments.update({
                where: { Id: assignmentId },
                data: { QuestionCount: questionIds.length },
                select: { Id: true },
            });
        }

        return { success: true };
    });
}

export async function deleteAssignmentSnapshotService({ userId, assignmentId }) {
    const assignment = await prisma.assignments.findFirst({
        where: { Id: assignmentId, CreatorId: userId },
        select: { Id: true },
    });

    if (!assignment) throw new Error("Assignment not found or not owned by you");

    await prisma.assignments.delete({
        where: { Id: assignmentId },
        select: { Id: true },
    });

    return { success: true };
}