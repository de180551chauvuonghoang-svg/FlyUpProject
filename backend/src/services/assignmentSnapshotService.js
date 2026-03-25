import prisma from "../lib/prisma.js";
import { validateQuestionBankForSnapshot } from "./questionBankValidationService.js";

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

async function getOwnedSectionOrThrow({ userId, instructorId, sectionId }) {
    const section = await prisma.sections.findFirst({
        where: {
            Id: sectionId,
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

    if (!sectionId || !sourceQuestionBankId) {
        throw new Error("sectionId and sourceQuestionBankId are required");
    }

    const instructorUser = await getInstructorUserOrThrow(userId);

    const section = await getOwnedSectionOrThrow({
        userId,
        instructorId: instructorUser.InstructorId,
        sectionId,
    });

    const questionBank = await getPublishedOwnedQuestionBankOrThrow({
        userId,
        courseId: section.CourseId,
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

    const result = await prisma.$transaction(async (tx) => {
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
                select: {
                    Id: true,
                },
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

        const updatedAssignment = await tx.assignments.update({
            where: {
                Id: assignment.Id,
            },
            data: {
                QuestionCount: sourceQuestions.length,
            },
            select: {
                Id: true,
                Name: true,
                QuestionCount: true,
                SourceQuestionBankId: true,
            },
        });

        return updatedAssignment;
    });

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
        CreationTime: null,
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