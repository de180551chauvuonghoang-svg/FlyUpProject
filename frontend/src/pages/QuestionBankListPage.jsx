import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
    fetchQuestionBanks,
    fetchQuestionBankCourses,
    createQuestionBank,
    bulkGenerateAIQuestions,
} from '../services/questionBankService';
import InstructorLayout from '../components/InstructorLayout';

const tabs = [
    { key: 'all', label: 'All Banks' },
    { key: 'published', label: 'Published' },
    { key: 'archived', label: 'Archived' },
];

const StatusBadge = ({ status }) => {
    const normalized = String(status || '').toLowerCase();
    const classes = {
        draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    return (
        <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border backdrop-blur-md ${classes[normalized] || classes.draft
                }`}
        >
            {status}
        </span>
    );
};

const VisibilityBadge = ({ isPublic }) => {
    return (
        <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border backdrop-blur-md ${isPublic
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }`}
        >
            {isPublic ? 'Public' : 'Private'}
        </span>
    );
};

const CreateQuestionBankModal = ({
    open,
    onClose,
    onCreated,
    courses,
}) => {
    const [form, setForm] = useState({
        name: '',
        description: '',
        courseId: '',
        autoGenerate: false,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm((prev) => ({
            ...prev,
            courseId: prev.courseId || courses?.[0]?.Id || '',
        }));
    }, [open, courses]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error('Question bank name is required');
            return;
        }

        if (!form.courseId) {
            toast.error('Please select a course');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Creating question bank...');

        try {
            const newBank = await createQuestionBank({
                name: form.name,
                description: form.description,
                courseId: form.courseId,
            });

            if (form.autoGenerate) {
                toast.loading('AI is generating 10 questions for your new bank...', { id: toastId });
                await bulkGenerateAIQuestions(newBank.Id, form.courseId, 10, 'Mixed');
            }

            toast.success('Question bank created', { id: toastId });
            onCreated();
            onClose();

            setForm({
                name: '',
                description: '',
                courseId: courses?.[0]?.Id || '',
            });
        } catch (error) {
            toast.error(error.message || 'Failed to create question bank', {
                id: toastId,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            Create Question Bank
                        </h3>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Define a new collection for your course.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                            Bank Name
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Advanced Java Patterns"
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                            Associated Course
                        </label>
                        <div className="relative">
                            <select
                                name="courseId"
                                value={form.courseId}
                                onChange={handleChange}
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white outline-none appearance-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
                            >
                                <option value="" className="bg-slate-900">
                                    Select course
                                </option>
                                {courses.map((course) => (
                                    <option
                                        key={course.Id}
                                        value={course.Id}
                                        className="bg-slate-900"
                                    >
                                        {course.Title}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none">
                                expand_more
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Briefly describe the purpose of this bank..."
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white outline-none resize-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <input
                            type="checkbox"
                            id="autoGenerate"
                            name="autoGenerate"
                            checked={form.autoGenerate}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500/20"
                        />
                        <label htmlFor="autoGenerate" className="flex flex-col cursor-pointer">
                            <span className="text-sm font-bold text-white">Auto-generate with AI</span>
                            <span className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">Creates 10 questions automatically from course content</span>
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 rounded-xl text-white text-sm font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-xl hover:shadow-purple-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">
                                        add_circle
                                    </span>
                                    <span>Create Bank</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const QuestionBankListPage = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [banks, setBanks] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [meta, setMeta] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
    });

    const [filters, setFilters] = useState({
        page: 1,
        pageSize: 10,
        courseId: '',
        status: '',
        isPublic: '',
        keyword: '',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
    });

    useEffect(() => {
        const timeout = setTimeout(() => {
            setFilters((prev) => ({
                ...prev,
                keyword: searchInput,
                page: 1,
            }));
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        if (activeTab === 'published') {
            setFilters((prev) => ({
                ...prev,
                status: 'Published',
                page: 1,
            }));
            return;
        }

        if (activeTab === 'archived') {
            setFilters((prev) => ({
                ...prev,
                status: 'Archived',
                page: 1,
            }));
            return;
        }

        setFilters((prev) => ({
            ...prev,
            status: '',
            page: 1,
        }));
    }, [activeTab]);

    const loadCourses = useCallback(async () => {
        try {
            const data = await fetchQuestionBankCourses();
            setCourses(data || []);
        } catch (err) {
            console.error('Failed to fetch instructor courses:', err);
            toast.error(err.message || 'Failed to load courses');
        }
    }, []);

    const loadBanks = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchQuestionBanks(filters);
            setBanks(result.items || []);
            setMeta(
                result.meta || {
                    page: 1,
                    pageSize: 10,
                    total: 0,
                    totalPages: 0,
                }
            );
        } catch (err) {
            console.error('Failed to fetch question banks:', err);
            toast.error(err.message || 'Failed to load question banks');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    useEffect(() => {
        loadBanks();
    }, [loadBanks]);

    const courseTitleMap = useMemo(() => {
        const map = new Map();
        for (const course of courses) {
            map.set(course.Id, course.Title);
        }
        return map;
    }, [courses]);

    const handleCreated = useCallback(() => {
        setFilters((prev) => ({
            ...prev,
            page: 1,
        }));
        loadBanks();
    }, [loadBanks]);

    return (
        <InstructorLayout
            title="Question Bank"
            subtitle="Manage and organize your question collections"
            searchQuery={searchInput}
            setSearchQuery={setSearchInput}
            placeholder="Search banks..."
            actions={
                <>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        New Bank
                    </button>
                </>
            }
        >
            <div className="space-y-8">
                <div className="flex border-b border-white/5 overflow-x-auto pb-px">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${active
                                        ? 'text-purple-400 border-purple-500'
                                        : 'text-slate-500 border-transparent hover:text-slate-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        <div className="xl:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by bank name or description..."
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Course
                            </label>
                            <select
                                value={filters.courseId}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        courseId: e.target.value,
                                        page: 1,
                                    }))
                                }
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="">All courses</option>
                                {courses.map((course) => (
                                    <option key={course.Id} value={course.Id}>
                                        {course.Title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        status: e.target.value,
                                        page: 1,
                                    }))
                                }
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="">All statuses</option>
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Visibility
                            </label>
                            <select
                                value={filters.isPublic}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        isPublic: e.target.value,
                                        page: 1,
                                    }))
                                }
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="">All</option>
                                <option value="true">Public</option>
                                <option value="false">Private</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Sort By
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        sortBy: e.target.value,
                                        page: 1,
                                    }))
                                }
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="updatedAt">Updated At</option>
                                <option value="createdAt">Created At</option>
                                <option value="name">Name</option>
                                <option value="questionCount">Question Count</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Sort Order
                            </label>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        sortOrder: e.target.value,
                                        page: 1,
                                    }))
                                }
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Page Size
                            </label>
                            <select
                                value={filters.pageSize}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        pageSize: Number(e.target.value),
                                        page: 1,
                                    }))
                                }
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Question Bank
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Questions
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Visibility
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Course
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Updated
                                    </th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center">
                                            <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : banks.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center">
                                            <span className="material-symbols-outlined text-5xl text-slate-700 block mb-4">
                                                database
                                            </span>
                                            <p className="text-slate-300 font-bold">
                                                No question banks found
                                            </p>
                                            <p className="text-slate-500 text-sm mt-2">
                                                Try changing filters or create a new bank.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    banks.map((bank) => (
                                        <tr
                                            key={bank.Id}
                                            className="group hover:bg-white/5 transition-all"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined">
                                                            database
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                                            {bank.Name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {bank.Description || 'No description'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className="text-sm font-bold text-slate-300">
                                                    {bank.QuestionCount} Qs
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <StatusBadge status={bank.Status} />
                                            </td>

                                            <td className="p-4">
                                                <VisibilityBadge isPublic={bank.IsPublic} />
                                            </td>

                                            <td className="p-4">
                                                <p className="text-sm text-slate-400 truncate max-w-[180px]">
                                                    {bank.CourseTitle ||
                                                        courseTitleMap.get(bank.CourseId) ||
                                                        '-'}
                                                </p>
                                            </td>

                                            <td className="p-4">
                                                <p className="text-sm text-slate-500">
                                                    {bank.LastModificationTime
                                                        ? new Date(
                                                            bank.LastModificationTime
                                                        ).toLocaleString('vi-VN')
                                                        : '-'}
                                                </p>
                                            </td>

                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/instructor/question-banks/${bank.Id}`}
                                                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white text-xs font-bold rounded-lg transition-all"
                                                    >
                                                        View
                                                    </Link>
                                                    <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                                        <span className="material-symbols-outlined text-lg">
                                                            more_vert
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-slate-500">
                        Showing page{' '}
                        <span className="font-semibold text-slate-300">{meta.page}</span> of{' '}
                        <span className="font-semibold text-slate-300">
                            {meta.totalPages || 1}
                        </span>{' '}
                        · Total{' '}
                        <span className="font-semibold text-slate-300">{meta.total}</span>{' '}
                        bank(s)
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={meta.page <= 1}
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    page: Math.max(1, prev.page - 1),
                                }))
                            }
                            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-semibold hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={meta.page >= (meta.totalPages || 1)}
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    page: Math.min(meta.totalPages || 1, prev.page + 1),
                                }))
                            }
                            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-semibold hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <CreateQuestionBankModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={handleCreated}
                courses={courses}
            />
        </InstructorLayout>
    );
};

export default QuestionBankListPage;
