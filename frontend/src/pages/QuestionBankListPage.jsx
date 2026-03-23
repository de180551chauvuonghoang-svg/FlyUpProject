import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
    fetchQuestionBanks,
    fetchQuestionBankCourses,
    createQuestionBank,
} from '../services/questionBankService';
import InstructorLayout from '../components/InstructorLayout';

const tabs = [
    { key: 'mine', label: 'Created by me' },
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
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border backdrop-blur-md ${classes[normalized] || classes.draft}`}>
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
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Create Question Bank</h3>
                        <p className="text-sm text-slate-400 mt-0.5">Define a new collection for your course.</p>
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
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">Bank Name</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Advanced Java Patterns"
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">Associated Course</label>
                        <div className="relative">
                            <select
                                name="courseId"
                                value={form.courseId}
                                onChange={handleChange}
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white outline-none appearance-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
                            >
                                <option value="" className="bg-slate-900">Select course</option>
                                {courses.map((course) => (
                                    <option key={course.Id} value={course.Id} className="bg-slate-900">{course.Title}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none">expand_more</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Briefly describe the purpose of this bank..."
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white outline-none resize-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-600"
                        />
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
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
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
    const [activeTab, setActiveTab] = useState('mine');
    const [search, setSearch] = useState('');
    const [courseId, setCourseId] = useState('');
    const [banks, setBanks] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const loadBanks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchQuestionBanks({ tab: activeTab, search, courseId });
            setBanks(data);
        } catch (err) {
            console.error('Failed to fetch question banks:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, courseId]);

    const loadCourses = useCallback(async () => {
        try {
            const data = await fetchQuestionBankCourses();
            setCourses(data);
        } catch (err) {
            console.error('Failed to fetch instructor courses:', err);
        }
    }, []);

    useEffect(() => { loadCourses(); }, [loadCourses]);
    useEffect(() => { loadBanks(); }, [loadBanks]);

    const courseTitleMap = useMemo(() => {
        const map = new Map();
        for (const course of courses) { map.set(course.Id, course.Title); }
        return map;
    }, [courses]);

    return (
        <InstructorLayout
            title="Question Bank"
            subtitle="Manage and organize your question collections"
            searchQuery={search}
            setSearchQuery={setSearch}
            placeholder="Search banks..."
            actions={
                <>
                    <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="hidden md:block min-w-[200px] rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
                    >
                        <option value="">All courses</option>
                        {courses.map((course) => (
                            <option key={course.Id} value={course.Id}>{course.Title}</option>
                        ))}
                    </select>
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
                {/* Tabs */}
                <div className="flex border-b border-white/5 overflow-x-auto pb-px">
                  {tabs.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                          active 
                            ? "text-purple-400 border-purple-500" 
                            : "text-slate-500 border-transparent hover:text-slate-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Table Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Question Bank</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Visibility</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="p-20 text-center">
                              <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                            </td>
                          </tr>
                        ) : banks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-20 text-center">
                              <span className="material-symbols-outlined text-5xl text-slate-700 block mb-4">database</span>
                              <p className="text-slate-400 font-bold">No question banks found</p>
                            </td>
                          </tr>
                        ) : (
                          banks.map((bank) => (
                            <tr key={bank.Id} className="group hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">database</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">{bank.Name}</p>
                                    <p className="text-xs text-slate-500 truncate">{bank.Description || 'No description'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-sm font-bold text-slate-300">{bank.QuestionCount} Qs</span>
                              </td>
                              <td className="p-4">
                                <StatusBadge status={bank.Status} />
                              </td>
                              <td className="p-4">
                                <VisibilityBadge isPublic={bank.IsPublic} />
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-slate-400 truncate max-w-[150px]">
                                  {bank.CourseTitle || courseTitleMap.get(bank.CourseId) || '-'}
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
                                    <span className="material-symbols-outlined text-lg">more_vert</span>
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
            </div>

            <CreateQuestionBankModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={loadBanks}
                courses={courses}
            />
        </InstructorLayout>
    );
};

export default QuestionBankListPage;
