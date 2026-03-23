import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import {
    fetchQuestionBanks,
    fetchQuestionBankCourses,
    createQuestionBank,
} from '../services/questionBankService';

const tabs = [
    { key: 'mine', label: 'Created by me' },
    { key: 'published', label: 'Published' },
    { key: 'archived', label: 'Archived' },
];

const StatusBadge = ({ status }) => {
    const normalized = String(status || '').toLowerCase();

    const classes = {
        draft: 'bg-amber-50 text-amber-700 border border-amber-200',
        published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        archived: 'bg-slate-100 text-slate-600 border border-slate-200',
    };

    return (
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${classes[normalized] || classes.draft}`}>
            {status}
        </span>
    );
};

const VisibilityBadge = ({ isPublic }) => {
    return (
        <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border ${isPublic
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
        >
            {isPublic ? 'Public' : 'Private'}
        </span>
    );
};

const SidebarLink = ({ active = false, icon, label }) => {
    return (
        <button
            type="button"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${active
                ? 'bg-[#4b2038] text-white shadow-lg'
                : 'text-[#ce8db1] hover:bg-[#4b2038] hover:text-white'
                }`}
        >
            <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {icon}
            </span>
            <span className="text-sm font-medium">{label}</span>
        </button>
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
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
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
            const created = await createQuestionBank({
                name: form.name,
                description: form.description,
                courseId: form.courseId,
            });

            toast.success('Question bank created', { id: toastId });
            onCreated(created);
            onClose();
            setForm({
                name: '',
                description: '',
                courseId: courses?.[0]?.Id || '',
            });
        } catch (error) {
            toast.error(error.message || 'Failed to create question bank', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Create Question Bank</h3>
                        <p className="text-sm text-slate-500">Create a draft bank for one course.</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Bank Name
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Java OOP Bank"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Course
                        </label>
                        <select
                            name="courseId"
                            value={form.courseId}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                        >
                            <option value="">Select a course</option>
                            {courses.map((course) => (
                                <option key={course.Id} value={course.Id}>
                                    {course.Title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Short description for this question bank"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-violet-400"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 disabled:opacity-60"
                        >
                            {submitting ? 'Creating...' : 'Create Bank'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const QuestionBankListPage = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('mine');
    const [search, setSearch] = useState('');
    const [courseId, setCourseId] = useState('');
    const [banks, setBanks] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const displayName = user?.FullName || user?.fullName || 'Instructor';

    const loadBanks = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await fetchQuestionBanks({
                tab: activeTab,
                search,
                courseId,
            });
            setBanks(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch question banks');
        } finally {
            setLoading(false);
        }
    };

    const loadCourses = async () => {
        setCoursesLoading(true);
        try {
            const data = await fetchQuestionBankCourses();
            setCourses(data);
        } catch (err) {
            console.error('Failed to fetch instructor courses:', err);
        } finally {
            setCoursesLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        loadBanks();
    }, [activeTab, courseId]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadBanks();
        }, 350);

        return () => clearTimeout(timeout);
    }, [search]);

    const courseTitleMap = useMemo(() => {
        const map = new Map();
        for (const course of courses) {
            map.set(course.Id, course.Title);
        }
        return map;
    }, [courses]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8f6f6]">
            <aside className="w-64 bg-[#240f1b] flex flex-col justify-between shrink-0 h-full">
                <div className="p-6">
                    <div className="mb-8">
                        <h1 className="text-white text-lg font-bold">Deep Space Violet</h1>
                        <p className="text-[#ce8db1] text-xs uppercase tracking-wider font-semibold">
                            Instructor Dashboard
                        </p>
                    </div>

                    <nav className="space-y-2">
                        <SidebarLink icon="group" label="Plan" />
                        <SidebarLink icon="menu_book" label="Create" />
                        <SidebarLink icon="database" label="Question Bank" active />
                        <SidebarLink icon="chat" label="Communications" />
                        <SidebarLink icon="bar_chart" label="Performance" />
                    </nav>
                </div>

                <div className="p-6 bg-black/20 mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-white text-xs font-medium">Question Banks</p>
                        <p className="text-white text-xs font-bold">{banks.length}</p>
                    </div>

                    <div className="w-full bg-[#4b2038] rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full w-[25%]"></div>
                    </div>

                    <p className="text-[#ce8db1] text-[10px]">Phase 2 connected to database</p>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 overflow-hidden">
                            <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div>
                            <p className="text-white text-xs font-bold">{displayName}</p>
                            <p className="text-[#ce8db1] text-[10px]">Instructor</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-white flex flex-col">
                <header className="sticky top-0 z-10 px-8 pt-8 pb-4 bg-white/90 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Question Bank</h2>

                        <div className="flex items-center gap-4">
                            <div className="relative w-80">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    search
                                </span>
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                                    placeholder="Search question banks..."
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <select
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="min-w-[220px] rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                            >
                                <option value="">All courses</option>
                                {courses.map((course) => (
                                    <option key={course.Id} value={course.Id}>
                                        {course.Title}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(true)}
                                className="text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                Add Question Bank
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-slate-200">
                        {tabs.map((tab) => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-3 text-sm transition-colors ${active
                                        ? 'font-bold text-orange-600 border-b-2 border-orange-600'
                                        : 'font-medium text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </header>

                <div className="p-8 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-blue-600">database</span>
                            <div>
                                <p className="text-blue-900 font-bold text-sm">Phase 2 is active</p>
                                <p className="text-blue-700 text-xs">
                                    Question bank list and create flow are now using real database data.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input className="rounded border-slate-300" type="checkbox" />
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Question Bank
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Questions
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Visibility
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Course
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Updated
                                    </th>
                                    <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-sm text-slate-500">Loading question banks...</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && error && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="material-symbols-outlined text-4xl text-red-300">
                                                    error
                                                </span>
                                                <p className="text-sm font-semibold text-red-600">{error}</p>
                                                <button
                                                    type="button"
                                                    onClick={loadBanks}
                                                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && banks.map((bank) => (
                                    <tr key={bank.Id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="p-4">
                                            <input className="rounded border-slate-300" type="checkbox" />
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-violet-600">
                                                        database
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{bank.Name}</p>
                                                    <p className="text-xs text-slate-500">{bank.Description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4 text-sm text-slate-600 font-medium">{bank.QuestionCount}</td>

                                        <td className="p-4">
                                            <StatusBadge status={bank.Status} />
                                        </td>

                                        <td className="p-4">
                                            <VisibilityBadge isPublic={bank.IsPublic} />
                                        </td>

                                        <td className="p-4 text-sm text-slate-600">
                                            {bank.CourseTitle || courseTitleMap.get(bank.CourseId) || '-'}
                                        </td>

                                        <td className="p-4 text-xs text-slate-500">
                                            {new Date(bank.LastModificationTime).toLocaleString('vi-VN')}
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/instructor/question-banks/${bank.Id}`}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                    View
                                                </Link>

                                                <button
                                                    type="button"
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xl">more_vert</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {!loading && !error && banks.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">
                                                    database
                                                </span>
                                                <p className="text-sm font-semibold text-slate-600">
                                                    No question banks found
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Create your first question bank to get started.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between pt-4 text-slate-500 text-xs font-medium">
                        <p>
                            {loading ? 'Loading...' : `Showing ${banks.length} question bank(s)`}
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50"
                                disabled
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="px-3 py-1 bg-slate-100 text-slate-900 rounded-md"
                            >
                                1
                            </button>
                            <button
                                type="button"
                                className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-100"
                                disabled
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <CreateQuestionBankModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={() => {
                    loadBanks();
                }}
                courses={courses}
            />
        </div>
    );
};

export default QuestionBankListPage;