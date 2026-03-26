function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function assertNonEmptyText(value, message) {
    if (!String(value || "").trim()) {
        throw new Error(message);
    }
}

function assertValidDifficulty(difficulty) {
    if (difficulty == null || difficulty === "") return;

    const allowed = ["Easy", "Medium", "Hard"];
    if (!allowed.includes(String(difficulty))) {
        throw new Error(`Difficulty must be one of: ${allowed.join(", ")}`);
    }
}

function assertValidIrtParams({ paramA, paramB, paramC }) {
    if (paramA != null) {
        const a = Number(paramA);
        if (!Number.isFinite(a) || a <= 0) {
            throw new Error("ParamA must be a positive number");
        }
    }

    if (paramB != null) {
        const b = Number(paramB);
        if (!Number.isFinite(b)) {
            throw new Error("ParamB must be a valid number");
        }
    }

    if (paramC != null) {
        const c = Number(paramC);
        if (!Number.isFinite(c) || c < 0 || c >= 1) {
            throw new Error("ParamC must be a number in range [0, 1)");
        }
    }
}

export function validateQuestionBankMetadata({ name }) {
    assertNonEmptyText(name, "Question bank name is required");
}

export function validateQuestionBankQuestionDraft(question) {
    assertNonEmptyText(question?.Content, "Question content is required");
    assertValidDifficulty(question?.Difficulty);
    assertValidIrtParams({
        paramA: question?.ParamA,
        paramB: question?.ParamB,
        paramC: question?.ParamC,
    });
}

export function validateQuestionBankChoicesDraft(choices) {
    if (!Array.isArray(choices) || choices.length < 2) {
        throw new Error("Each question must have at least 2 choices");
    }

    if (choices.length > 5) {
        throw new Error("Each question can have at most 5 choices");
    }

    const normalizedChoiceContents = new Set();
    let correctCount = 0;

    for (const choice of choices) {
        assertNonEmptyText(choice?.Content, "Choice content is required");

        const normalized = normalizeText(choice.Content);
        if (normalizedChoiceContents.has(normalized)) {
            throw new Error("Duplicate choices are not allowed in the same question");
        }
        normalizedChoiceContents.add(normalized);

        if (Boolean(choice?.IsCorrect)) {
            correctCount += 1;
        }
    }

    if (correctCount !== 1) {
        throw new Error("Each question must have exactly 1 correct answer");
    }
}

export function validateQuestionBankQuestionWithChoices(question) {
    validateQuestionBankQuestionDraft(question);
    validateQuestionBankChoicesDraft(question?.QuestionBankChoices || []);
}

const MIN_TOTAL_QUESTIONS = 10;
const MIN_PER_DIFFICULTY = 2;
const REQUIRED_DIFFICULTIES = ["Easy", "Medium", "Hard"];

/**
 * Shared helper: validate a list of questions has ≥10 total and ≥2 per level.
 * @param {Array} questions - array of question objects with { Difficulty }
 * @param {string} context - "bank" | "assignment" for error messages
 */
export function validateDifficultyDistribution(questions, context = "bank") {
    const label = context === "assignment" ? "Assignment" : "Question Bank";
    const total = questions.length;

    if (total < MIN_TOTAL_QUESTIONS) {
        throw new Error(
            `${label} phải có ít nhất ${MIN_TOTAL_QUESTIONS} câu hỏi (hiện có ${total} câu)`
        );
    }

    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    for (const question of questions) {
        const difficulty = String(question.Difficulty || "").trim();
        if (difficulty in difficultyCounts) {
            difficultyCounts[difficulty]++;
        }
    }

    const issues = REQUIRED_DIFFICULTIES
        .filter((d) => difficultyCounts[d] < MIN_PER_DIFFICULTY)
        .map((d) => `${d} (cần ${MIN_PER_DIFFICULTY}, hiện có ${difficultyCounts[d]})`);

    if (issues.length > 0) {
        throw new Error(
            `${label} phải có ít nhất ${MIN_PER_DIFFICULTY} câu ở mỗi cấp độ. Chưa đủ: ${issues.join("; ")}`
        );
    }
}

export function validateQuestionBankForPublish(questionBank) {
    const questions = questionBank?.QuestionBankQuestions || [];

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Cannot publish an empty question bank");
    }

    const normalizedQuestionContents = new Set();

    for (const question of questions) {
        validateQuestionBankQuestionWithChoices(question);

        const normalizedQuestion = normalizeText(question.Content);
        if (normalizedQuestionContents.has(normalizedQuestion)) {
            throw new Error("Duplicate questions are not allowed in the same question bank");
        }
        normalizedQuestionContents.add(normalizedQuestion);
    }

    // Only Published questions count toward the distribution requirement
    const publishedQuestions = questions.filter(
        (q) => String(q.Status || "").trim() === "Published"
    );
    validateDifficultyDistribution(publishedQuestions, "bank");

    return {
        questionCount: questions.length,
    };
}

export function validateQuestionBankForSnapshot(questionBank) {
    // Validate cơ bản như publish
    const result = validateQuestionBankForPublish(questionBank);

    // Chỉ tính câu hỏi đã Published
    const publishedQuestions = (questionBank?.QuestionBankQuestions || []).filter(
        (q) => String(q.Status || "").trim() === "Published"
    );

    // Distribution already checked in validateQuestionBankForPublish above
    // (re-validate here in case caller bypasses publish check)
    validateDifficultyDistribution(publishedQuestions, "bank");

    return result;
}

/**
 * Validate a selection of questions (from assignment create/update).
 * @param {Array} selectedQuestions - the actual question objects that will be snapshotted
 */
export function validateAssignmentQuestionSelection(selectedQuestions) {
    validateDifficultyDistribution(selectedQuestions, "assignment");
}