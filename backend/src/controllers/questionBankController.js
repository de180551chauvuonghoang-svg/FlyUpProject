import {
    listInstructorQuestionBanksService,
    listInstructorCoursesForQuestionBankService,
    createQuestionBankService,
    getQuestionBankDetailService,
    listQuestionBankQuestionsService,
    createQuestionBankQuestionService,
    updateQuestionBankQuestionService,
    deleteQuestionBankQuestionService,
    publishQuestionBankService,
    unpublishQuestionBankService,
    listPublishedQuestionBanksByCourseService,
    restoreQuestionBankService,
    archiveQuestionBankService,
    updateQuestionBankService,
} from "../services/questionBankService.js";


export const getQuestionBanks = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const {
            page,
            pageSize,
            courseId,
            status,
            isPublic,
            keyword,
            sortBy,
            sortOrder,
        } = req.query;

        const result = await listInstructorQuestionBanksService({
            userId,
            page,
            pageSize,
            courseId,
            status,
            isPublic,
            keyword,
            sortBy,
            sortOrder,
        });

        res.json({
            success: true,
            data: result.items,
            meta: result.meta,
        });
    } catch (error) {
        console.error("getQuestionBanks error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to fetch question banks",
        });
    }
};

export const getQuestionBankCourses = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const data = await listInstructorCoursesForQuestionBankService({ userId });

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("getQuestionBankCourses error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to fetch instructor courses",
        });
    }
};

export const createQuestionBank = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { name, description, courseId } = req.body;

        const data = await createQuestionBankService({
            userId,
            name,
            description,
            courseId,
        });

        res.status(201).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("createQuestionBank error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to create question bank",
        });
    }
};

export const getQuestionBankDetail = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const data = await getQuestionBankDetailService({
            userId,
            bankId: id,
        });

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("getQuestionBankDetail error:", error);
        res.status(404).json({
            success: false,
            error: error.message || "Failed to fetch question bank detail",
        });
    }
};

export const getQuestionBankQuestions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const data = await listQuestionBankQuestionsService({
            userId,
            bankId: id,
        });

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("getQuestionBankQuestions error:", error);
        res.status(404).json({
            success: false,
            error: error.message || "Failed to fetch question bank questions",
        });
    }
};

export const createQuestionBankQuestion = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const {
            content,
            difficulty,
            paramA,
            paramB,
            paramC,
            explanation,
            status,
            choices,
        } = req.body;

        const data = await createQuestionBankQuestionService({
            userId,
            bankId: id,
            content,
            difficulty,
            paramA,
            paramB,
            paramC,
            explanation,
            status,
            choices,
        });

        res.status(201).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("createQuestionBankQuestion error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to create question",
        });
    }
};

export const updateQuestionBankQuestion = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id, questionId } = req.params;

        const {
            content,
            difficulty,
            paramA,
            paramB,
            paramC,
            explanation,
            status,
            choices,
        } = req.body;

        const data = await updateQuestionBankQuestionService({
            userId,
            bankId: id,
            questionId,
            content,
            difficulty,
            paramA,
            paramB,
            paramC,
            explanation,
            status,
            choices,
        });

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("updateQuestionBankQuestion error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to update question",
        });
    }
};

export const deleteQuestionBankQuestion = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id, questionId } = req.params;

        const data = await deleteQuestionBankQuestionService({
            userId,
            bankId: id,
            questionId,
        });

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("deleteQuestionBankQuestion error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to delete question",
        });
    }
};

export const publishQuestionBank = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const data = await publishQuestionBankService({
            userId,
            bankId: id,
        });

        res.json({
            success: true,
            data,
            message: "Question bank published successfully",
        });
    } catch (error) {
        console.error("publishQuestionBank error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to publish question bank",
        });
    }
};

export const unpublishQuestionBank = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const data = await unpublishQuestionBankService({
            userId,
            bankId: id,
        });

        res.json({
            success: true,
            data,
            message: "Question bank unpublished successfully",
        });
    } catch (error) {
        console.error("unpublishQuestionBank error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to unpublish question bank",
        });
    }
};

export const getPublishedQuestionBanksByCourse = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { courseId } = req.query;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                error: "courseId is required",
            });
        }

        const data = await listPublishedQuestionBanksByCourseService({
            userId,
            courseId,
        });

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("getPublishedQuestionBanksByCourse error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to fetch published question banks",
        });
    }
};

export const updateQuestionBank = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { name, description } = req.body;

        const data = await updateQuestionBankService({
            userId,
            bankId: id,
            name,
            description,
        });

        res.json({
            success: true,
            data,
            message: "Question bank updated successfully",
        });
    } catch (error) {
        console.error("updateQuestionBank error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to update question bank",
        });
    }
};

export const archiveQuestionBank = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const data = await archiveQuestionBankService({
            userId,
            bankId: id,
        });

        res.json({
            success: true,
            data,
            message: "Question bank archived successfully",
        });
    } catch (error) {
        console.error("archiveQuestionBank error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to archive question bank",
        });
    }
};

export const restoreQuestionBank = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const data = await restoreQuestionBankService({
            userId,
            bankId: id,
        });

        res.json({
            success: true,
            data,
            message: "Question bank restored successfully",
        });
    } catch (error) {
        console.error("restoreQuestionBank error:", error);
        res.status(400).json({
            success: false,
            error: error.message || "Failed to restore question bank",
        });
    }
};