import prisma from "../lib/prisma.js";
import { requestCatNextQuestion, requestCatSubmit } from "./catApiClient.js";

function round1(value) {
    return Math.round(value * 10) / 10;
}

async function getAssignmentOrThrow(assignmentId, courseId) {
    const assignment = await prisma.assignments.findFirst({
        where: {
            Id: assignmentId,
            Sections: {
                CourseId: courseId,
            },
        },
        select: {
            Id: true,
            Name: true,
            GradeToPass: true,
            QuestionCount: true,
            Sections: {
                select: {
                    CourseId: true,
                },
            },
        },
    });

    if (!assignment) {
        throw new Error("Assignment does not belong to course or does not exist");
    }

    return assignment;
}

async function getOrCreateUserAbility(userId, courseId) {
    const existing = await prisma.userAbilities.findFirst({
        where: {
            UserId: userId,
            CourseId: courseId,
        },
    });

    if (existing) return existing;

    return prisma.userAbilities.create({
        data: {
            UserId: userId,
            CourseId: courseId,
            Theta: 0,
            LastUpdate: new Date(),
        },
    });
}

async function getQuestionWithChoices(questionId, assignmentId) {
    return prisma.mcqQuestions.findFirst({
        where: {
            Id: questionId,
            AssignmentId: assignmentId,
        },
        include: {
            McqChoices: {
                select: {
                    Id: true,
                    Content: true,
                    IsCorrect: true,
                },
            },
        },
    });
}

async function getAllQuestionsMap(questionIds, assignmentId) {
    const questions = await prisma.mcqQuestions.findMany({
        where: {
            Id: { in: questionIds },
            AssignmentId: assignmentId,
        },
        include: {
            McqChoices: {
                select: {
                    Id: true,
                    Content: true,
                    IsCorrect: true,
                },
            },
        },
    });

    return new Map(questions.map((q) => [q.Id, q]));
}

export async function startCatQuizService({ userId, courseId, assignmentId, questionCount }) {
    if (!questionCount || questionCount < 50 || questionCount > 150) {
        throw new Error("questionCount must be between 50 and 150");
    }

    const assignment = await getAssignmentOrThrow(assignmentId, courseId);

    const totalAvailableQuestions = await prisma.mcqQuestions.count({
        where: { AssignmentId: assignmentId },
    });

    if (totalAvailableQuestions < questionCount) {
        throw new Error(
            `Assignment only has ${totalAvailableQuestions} questions, cannot start ${questionCount}-question quiz`
        );
    }

    const userAbility = await getOrCreateUserAbility(userId, courseId);
    const initialTheta = Number(userAbility.Theta ?? 0);

    const catData = await requestCatNextQuestion({
        user_id: userId,
        course_id: courseId,
        assignment_id: assignmentId,
        answered_questions: [],
        last_response: [],
        current_theta: initialTheta,
    });

    if (!catData?.next_question) {
        throw new Error("CAT did not return first question");
    }

    return {
        question: catData.next_question,
        currentTheta: catData.temp_theta ?? initialTheta,
        initialTheta,
        questionCount,
        assignment: {
            Id: assignment.Id,
            Name: assignment.Name,
            GradeToPass: assignment.GradeToPass,
        },
    };
}

export async function answerCatQuestionService({
    userId,
    courseId,
    assignmentId,
    questionCount,
    currentQuestionId,
    selectedChoiceId,
    answeredQuestions,
    responses,
    currentTheta,
}) {
    await getAssignmentOrThrow(assignmentId, courseId);

    if (!currentQuestionId) {
        throw new Error("currentQuestionId is required");
    }

    if (!Array.isArray(answeredQuestions) || !Array.isArray(responses)) {
        throw new Error("answeredQuestions and responses must be arrays");
    }

    if (answeredQuestions.length !== responses.length) {
        throw new Error("answeredQuestions and responses length mismatch");
    }

    if (answeredQuestions.includes(currentQuestionId)) {
        throw new Error("Question already answered");
    }

    const question = await getQuestionWithChoices(currentQuestionId, assignmentId);

    if (!question) {
        throw new Error("Question does not belong to assignment");
    }

    let isCorrect = false;

    if (selectedChoiceId) {
        const selectedChoice = question.McqChoices.find((c) => c.Id === selectedChoiceId);

        if (!selectedChoice) {
            throw new Error("Selected choice does not belong to current question");
        }

        isCorrect = Boolean(selectedChoice.IsCorrect);
    }

    const newResponse = isCorrect ? 1 : 0;
    const newAnsweredQuestions = [...answeredQuestions, currentQuestionId];
    const newResponses = [...responses, newResponse];

    const thetaBefore = Number(currentTheta ?? 0);

    if (newAnsweredQuestions.length >= questionCount) {
        await prisma.cAT_Logs.create({
            data: {
                UserId: userId,
                CourseId: courseId,
                AssignmentId: assignmentId,
                QuestionId: currentQuestionId,
                Response: Boolean(newResponse),
                ThetaBefore: thetaBefore,
                ThetaAfter: thetaBefore,
                Timestamp: new Date(),
            },
        });

        return {
            isFinished: true,
            isCorrect,
            answeredQuestions: newAnsweredQuestions,
            responses: newResponses,
            tempTheta: thetaBefore,
        };
    }

    const catData = await requestCatNextQuestion({
        user_id: userId,
        course_id: courseId,
        assignment_id: assignmentId,
        answered_questions: newAnsweredQuestions,
        last_response: newResponses,
        current_theta: thetaBefore,
    });

    const thetaAfter = Number(catData?.temp_theta ?? thetaBefore);

    await prisma.cAT_Logs.create({
        data: {
            UserId: userId,
            CourseId: courseId,
            AssignmentId: assignmentId,
            QuestionId: currentQuestionId,
            Response: Boolean(newResponse),
            ThetaBefore: thetaBefore,
            ThetaAfter: thetaAfter,
            Timestamp: new Date(),
        },
    });

    return {
        isFinished: false,
        isCorrect,
        answeredQuestions: newAnsweredQuestions,
        responses: newResponses,
        tempTheta: thetaAfter,
        nextQuestion: catData?.next_question ?? null,
    };
}

export async function finishCatQuizService({
    userId,
    courseId,
    assignmentId,
    answeredQuestions,
    responses,
    selectedChoiceIds,
    timeSpentInSec,
    initialTheta,
}) {
    const assignment = await getAssignmentOrThrow(assignmentId, courseId);

    if (!Array.isArray(answeredQuestions) || !Array.isArray(responses)) {
        throw new Error("answeredQuestions and responses must be arrays");
    }

    if (answeredQuestions.length !== responses.length) {
        throw new Error("answeredQuestions and responses length mismatch");
    }

    if (!Array.isArray(selectedChoiceIds) || selectedChoiceIds.length !== answeredQuestions.length) {
        throw new Error("selectedChoiceIds length must match answeredQuestions length");
    }

    const catResult = await requestCatSubmit({
        user_id: userId,
        course_id: courseId,
        assignment_id: assignmentId,
        answered_questions: answeredQuestions,
        responses,
        smoothing_alpha: 0.2,
        initial_theta: Number(initialTheta ?? 0),
    });

    const correctCount = Number(catResult.correct ?? 0);
    const totalQuestions = Number(catResult.total ?? answeredQuestions.length);
    const finalTheta = Number(catResult.final_theta ?? 0);
    const updatedUserTheta = Number(catResult.updated_user_theta ?? finalTheta);

    const mark = totalQuestions > 0 ? round1((correctCount / totalQuestions) * 10) : 0;
    const passed = mark >= Number(assignment.GradeToPass ?? 5);

    const questionsMap = await getAllQuestionsMap(answeredQuestions, assignmentId);

    const selectedPairs = [];
    for (let i = 0; i < answeredQuestions.length; i++) {
        const questionId = answeredQuestions[i];
        const choiceId = selectedChoiceIds[i];

        if (!choiceId) continue;

        const question = questionsMap.get(questionId);
        if (!question) {
            throw new Error(`Question ${questionId} not found in assignment`);
        }

        const choiceExists = question.McqChoices.some((c) => c.Id === choiceId);
        if (!choiceExists) {
            throw new Error(`Choice ${choiceId} does not belong to question ${questionId}`);
        }

        selectedPairs.push({
            questionId,
            choiceId,
        });
    }

    const result = await prisma.$transaction(async (tx) => {
        const submission = await tx.submissions.create({
            data: {
                Mark: mark,
                TimeSpentInSec: Number(timeSpentInSec ?? 0),
                AssignmentId: assignmentId,
                CreatorId: userId,
                LastModifierId: userId,
            },
        });

        if (selectedPairs.length > 0) {
            await tx.mcqUserAnswer.createMany({
                data: selectedPairs.map((item) => ({
                    SubmissionId: submission.Id,
                    MCQChoiceId: item.choiceId,
                })),
                skipDuplicates: true,
            });
        }

        await tx.cAT_Results.create({
            data: {
                UserId: userId,
                CourseId: courseId,
                AssignmentId: assignmentId,
                FinalTheta: finalTheta,
                CorrectCount: correctCount,
                TotalQuestions: totalQuestions,
                ThetaBefore: Number(initialTheta ?? 0),
                ThetaAfter: updatedUserTheta,
                CompletionTime: new Date(),
            },
        });

        const existingAbility = await tx.userAbilities.findFirst({
            where: {
                UserId: userId,
                CourseId: courseId,
            },
        });

        if (existingAbility) {
            await tx.userAbilities.update({
                where: { Id: existingAbility.Id },
                data: {
                    Theta: updatedUserTheta,
                    LastUpdate: new Date(),
                },
            });
        } else {
            await tx.userAbilities.create({
                data: {
                    UserId: userId,
                    CourseId: courseId,
                    Theta: updatedUserTheta,
                    LastUpdate: new Date(),
                },
            });
        }

        return submission;
    });

    return {
        submissionId: result.Id,
        mark,
        passed,
        gradeToPass: Number(assignment.GradeToPass ?? 5),
        correctCount,
        totalQuestions,
        finalTheta,
        updatedUserTheta,
        timeSpentInSec: Number(timeSpentInSec ?? 0),
    };
}
