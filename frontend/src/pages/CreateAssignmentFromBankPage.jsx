import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

import {
    fetchInstructorCoursesForBank,
    fetchSectionsByCourse,
    fetchPublishedQuestionBanksByCourse,
    createAssignmentFromBank,
} from '../services/assignmentSnapshotService';

const CreateAssignmentFromBankPage = () => {
    const [courses, setCourses] = useState([]);
    const [sections, setSections] = useState([]);
    const [banks, setBanks] = useState([]);

    const [loadingMeta, setLoadingMeta] = useState(true);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [createdResult, setCreatedResult] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const presetCourseId = searchParams.get('courseId') || '';
    const presetSourceQuestionBankId = searchParams.get('sourceQuestionBankId') || '';


    const [form, setForm] = useState({
        courseId: presetCourseId,
        sectionId: '',
        name: '',
        duration: 30,
        gradeToPass: 8,
        sourceQuestionBankId: presetSourceQuestionBankId,
    });

    useEffect(() => {
        const loadCourses = async () => {
            setLoadingMeta(true);
            try {
                const data = await fetchInstructorCoursesForBank();
                setCourses(data);
            } catch (error) {
                toast.error(error.message || 'Failed to load courses');
            } finally {
                setLoadingMeta(false);
            }
        };

        loadCourses();
    }, []);

    useEffect(() => {
        if (!form.courseId) {
            setSections([]);
            setBanks([]);
            setForm((prev) => ({
                ...prev,
                sectionId: '',
                sourceQuestionBankId: '',
            }));
            return;
        }

        const loadDependentData = async () => {
            setLoadingSections(true);
            setLoadingBanks(true);

            try {
                const [sectionsData, banksData] = await Promise.all([
                    fetchSectionsByCourse(form.courseId),
                    fetchPublishedQuestionBanksByCourse(form.courseId),
                ]);

                setSections(sectionsData);
                setBanks(banksData);

                setForm((prev) => ({
                    ...prev,
                    sectionId: '',
                    sourceQuestionBankId: '',
                }));
            } catch (error) {
                toast.error(error.message || 'Failed to load sections or banks');
            } finally {
                setLoadingSections(false);
                setLoadingBanks(false);
            }
        };

        loadDependentData();
    }, [form.courseId]);

    const selectedCourse = useMemo(
        () => courses.find((course) => course.Id === form.courseId) || null,
        [courses, form.courseId]
    );

    const selectedSection = useMemo(
        () => sections.find((section) => section.Id === form.sectionId) || null,
        [sections, form.sectionId]
    );

    const selectedBank = useMemo(
        () => banks.find((bank) => bank.Id === form.sourceQuestionBankId) || null,
        [banks, form.sourceQuestionBankId]
    );

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'courseId') {
            setCreatedResult(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.courseId || !form.sectionId || !form.sourceQuestionBankId || !form.name.trim()) {
            toast.error('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Creating assignment from question bank...');

        try {
            const result = await createAssignmentFromBank({
                courseId: form.courseId,
                sectionId: form.sectionId,
                name: form.name.trim(),
                duration: Number(form.duration),
                gradeToPass: Number(form.gradeToPass),
                sourceQuestionBankId: form.sourceQuestionBankId,
            });

            setCreatedResult(result);
            toast.success('Assignment created successfully', { id: toastId });

            setForm((prev) => ({
                ...prev,
                name: '',
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to create assignment', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
                        Phase 4
                    </p>
                    <h1 className="text-3xl font-black text-slate-900 mt-2">
                        Create Assignment from Question Bank
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Snapshot a published question bank into Assignments, McqQuestions, and McqChoices.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-5">Assignment Form</h2>

                            {loadingMeta ? (
                                <div className="flex items-center gap-3 py-6">
                                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-slate-500">Loading courses...</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Course *
                                            </label>
                                            <select
                                                name="courseId"
                                                value={form.courseId}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-violet-400"
                                            >
                                                <option value="">Select course</option>
                                                {courses.map((course) => (
                                                    <option key={course.Id} value={course.Id}>
                                                        {course.Title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Section *
                                            </label>
                                            <select
                                                name="sectionId"
                                                value={form.sectionId}
                                                onChange={handleChange}
                                                disabled={!form.courseId || loadingSections}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-slate-100"
                                            >
                                                <option value="">
                                                    {loadingSections ? 'Loading sections...' : 'Select section'}
                                                </option>
                                                {sections.map((section) => (
                                                    <option key={section.Id} value={section.Id}>
                                                        {section.Index}. {section.Title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Assignment Name *
                                        </label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Java OOP Quiz 01"
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Duration (minutes) *
                                            </label>
                                            <input
                                                name="duration"
                                                type="number"
                                                min="1"
                                                value={form.duration}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Grade To Pass *
                                            </label>
                                            <input
                                                name="gradeToPass"
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="0.1"
                                                value={form.gradeToPass}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Published Question Bank *
                                        </label>
                                        <select
                                            name="sourceQuestionBankId"
                                            value={form.sourceQuestionBankId}
                                            onChange={handleChange}
                                            disabled={!form.courseId || loadingBanks}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-slate-100"
                                        >
                                            <option value="">
                                                {loadingBanks ? 'Loading published banks...' : 'Select published question bank'}
                                            </option>
                                            {banks.map((bank) => (
                                                <option key={bank.Id} value={bank.Id}>
                                                    {bank.Name} ({bank.QuestionCount} questions)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60"
                                        >
                                            {submitting ? 'Creating Assignment...' : 'Create Assignment'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                            <h2 className="text-lg font-bold text-slate-900">Preview</h2>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Selected Course
                                </p>
                                <p className="text-sm font-medium text-slate-800 mt-1">
                                    {selectedCourse?.Title || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Selected Section
                                </p>
                                <p className="text-sm font-medium text-slate-800 mt-1">
                                    {selectedSection ? `${selectedSection.Index}. ${selectedSection.Title}` : '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Selected Bank
                                </p>
                                <p className="text-sm font-medium text-slate-800 mt-1">
                                    {selectedBank?.Name || '-'}
                                </p>
                                {selectedBank && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {selectedBank.QuestionCount} question(s)
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Snapshot Behavior
                                </p>
                                <ul className="mt-2 text-sm text-slate-600 space-y-2">
                                    <li>• Copy all bank questions into McqQuestions</li>
                                    <li>• Copy all bank choices into McqChoices</li>
                                    <li>• Preserve source ids for audit/history</li>
                                    <li>• Existing bank edits will not affect this assignment</li>
                                </ul>
                            </div>

                            {createdResult && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="text-sm font-bold text-emerald-700">
                                        Assignment created successfully
                                    </p>
                                    <div className="mt-3 text-xs text-emerald-800 space-y-1">
                                        <p><span className="font-semibold">Assignment ID:</span> {createdResult.assignmentId}</p>
                                        <p><span className="font-semibold">Name:</span> {createdResult.name}</p>
                                        <p><span className="font-semibold">Question Count:</span> {createdResult.questionCount}</p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/instructor/assignments/${createdResult.assignmentId}/preview`)}
                                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                                        >
                                            Go to Assignment
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCreatedResult(null);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    name: '',
                                                    duration: 30,
                                                    gradeToPass: 8,
                                                }));
                                            }}
                                            className="px-4 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-700 text-sm font-bold hover:bg-emerald-100"
                                        >
                                            Create Another
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateAssignmentFromBankPage;