import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    fetchInstructorCoursesForBank, 
    fetchSectionsByCourse, 
    fetchPublishedQuestionBanksByCourse,
    createAssignmentFromBank 
} from '../services/assignmentSnapshotService';
import InstructorLayout from '../components/InstructorLayout';

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
        <InstructorLayout
            title="Create Assignment"
            subtitle="Snapshot a published question bank into a new assignment"
        >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="xl:col-span-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-8">Assignment Details</h2>

                        {loadingMeta ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
                                <p className="text-slate-400 text-sm">Loading courses...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Course *</label>
                                        <select
                                            name="courseId"
                                            value={form.courseId}
                                            onChange={handleChange}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none"
                                        >
                                            <option value="" className="bg-slate-900">Select course</option>
                                            {courses.map((course) => (
                                                <option key={course.Id} value={course.Id} className="bg-slate-900">
                                                    {course.Title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Section *</label>
                                        <select
                                            name="sectionId"
                                            value={form.sectionId}
                                            onChange={handleChange}
                                            disabled={!form.courseId || loadingSections}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none disabled:opacity-50"
                                        >
                                            <option value="" className="bg-slate-900">
                                                {loadingSections ? 'Loading sections...' : 'Select section'}
                                            </option>
                                            {sections.map((section) => (
                                                <option key={section.Id} value={section.Id} className="bg-slate-900">
                                                    {section.Index}. {section.Title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Assignment Name *</label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Java OOP Quiz 01"
                                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Duration (min) *</label>
                                        <input
                                            name="duration"
                                            type="number"
                                            min="1"
                                            value={form.duration}
                                            onChange={handleChange}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Grade To Pass *</label>
                                        <input
                                            name="gradeToPass"
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={form.gradeToPass}
                                            onChange={handleChange}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Published Question Bank *</label>
                                    <select
                                        name="sourceQuestionBankId"
                                        value={form.sourceQuestionBankId}
                                        onChange={handleChange}
                                        disabled={!form.courseId || loadingBanks}
                                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-all appearance-none disabled:opacity-50"
                                    >
                                        <option value="" className="bg-slate-900">
                                            {loadingBanks ? 'Loading published banks...' : 'Select published question bank'}
                                        </option>
                                        {banks.map((bank) => (
                                            <option key={bank.Id} value={bank.Id} className="bg-slate-900">
                                                {bank.Name} ({bank.QuestionCount} questions)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full md:w-auto px-10 py-4 rounded-xl bg-purple-500 text-white text-md font-bold hover:bg-purple-600 shadow-xl shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting && <div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>}
                                        {submitting ? 'Creating...' : 'Create Assignment'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Preview/Result Section */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <h2 className="text-lg font-bold text-white mb-6">Configuration Preview</h2>
                        <div className="space-y-5">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Course</p>
                                <p className="text-sm font-bold text-slate-300">{selectedCourse?.Title || 'Not selected'}</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Section</p>
                                <p className="text-sm font-bold text-slate-300">{selectedSection ? `${selectedSection.Index}. ${selectedSection.Title}` : 'Not selected'}</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Source Bank</p>
                                <p className="text-sm font-bold text-slate-300">{selectedBank?.Name || 'Not selected'}</p>
                                {selectedBank && (
                                    <p className="text-[10px] text-purple-400 mt-1 uppercase font-black">{selectedBank.QuestionCount} Questions to snapshot</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Snapshot Logic
                          </h4>
                          <ul className="text-[11px] text-slate-400 space-y-2 leading-relaxed font-medium">
                            <li>• All banking questions are duplicated as independent MCQ entities</li>
                            <li>• Choices are snapshotted with their correct status</li>
                            <li>• Once created, the bank and assignment are decoupled</li>
                          </ul>
                        </div>
                    </div>

                    {createdResult && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 text-emerald-400 mb-6">
                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                                <h3 className="text-lg font-bold">Assignment Created!</h3>
                            </div>
                            
                            <div className="space-y-4 mb-8">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Assignment ID</span>
                                <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">{createdResult.assignmentId}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Questions Added</span>
                                <span className="text-white font-bold">{createdResult.questionCount}</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/instructor/assignments/${createdResult.assignmentId}/preview`)}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    Go to Assignment <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setCreatedResult(null);
                                        setForm(prev => ({ ...prev, name: '', duration: 30, gradeToPass: 8 }));
                                    }}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl border border-white/10 transition-all"
                                >
                                    Create Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </InstructorLayout>
    );
};

export default CreateAssignmentFromBankPage;
