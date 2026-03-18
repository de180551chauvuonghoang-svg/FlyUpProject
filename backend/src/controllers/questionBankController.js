import {
    listInstructorQuestionBanksService,
    listInstructorCoursesForQuestionBankService,
    createQuestionBankService,
    getQuestionBankDetailService,
} from "../services/questionBankService.js";

export const getQuestionBanks = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { tab = "mine", search = "", courseId = "" } = req.query;

        const data = await listInstructorQuestionBanksService({
            userId,
            tab,
            search,
            courseId,
        });

        res.json({
            success: true,
            data,
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