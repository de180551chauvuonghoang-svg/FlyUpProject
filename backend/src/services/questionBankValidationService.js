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

    return {
        questionCount: questions.length,
    };
}

const MIN_TOTAL_QUESTIONS = 10;
const REQUIRED_DIFFICULTIES = ["Easy", "Medium", "Hard"];

export function validateQuestionBankForSnapshot(questionBank) {
    // Validate cơ bản như publish
    const result = validateQuestionBankForPublish(questionBank);

    // Chỉ tính câu hỏi đã Published
    const questions = (questionBank?.QuestionBankQuestions || []).filter(
        (q) => String(q.Status || "").trim() === "Published"
    );

    const total = questions.length;

    if (total < MIN_TOTAL_QUESTIONS) {
        throw new Error(
            `Assignment phải có ít nhất ${MIN_TOTAL_QUESTIONS} câu hỏi đã Published (hiện có ${total} câu)`
        );
    }

    // Đếm số câu theo từng mức độ
    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    for (const question of questions) {
        const difficulty = String(question.Difficulty || "").trim();
        if (difficulty in difficultyCounts) {
            difficultyCounts[difficulty]++;
        }
    }

    // Mỗi cấp độ phải có ít nhất 1 câu
    const missingDifficulties = REQUIRED_DIFFICULTIES.filter((d) => difficultyCounts[d] === 0);
    if (missingDifficulties.length > 0) {
        throw new Error(
            `Assignment phải có câu hỏi ở tất cả 3 cấp độ. Thiếu: ${missingDifficulties.join(", ")}`
        );
    }

    // Ít nhất 1 cấp độ phải có ≥2 câu
    const hasAtLeastTwoInOneDifficulty = REQUIRED_DIFFICULTIES.some((d) => difficultyCounts[d] >= 2);
    if (!hasAtLeastTwoInOneDifficulty) {
        throw new Error(
            `Ít nhất 1 cấp độ (Easy/Medium/Hard) phải có từ 2 câu hỏi trở lên`
        );
    }

    return result;
}