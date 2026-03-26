import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Users,
    ArrowUpRight,
    Copy,
    ExternalLink
} from 'lucide-react';

import payoutService from '../../../services/payoutService';
import { useDebounce } from '../../../hooks/useDebounce';

function PayoutRequests() {
    const [requests, setRequests] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(null);

    const fetchRequests = async (page, status) => {
        try {
            setIsLoading(true);
            const result = await payoutService.getAllWithdrawalRequests(status, page, itemsPerPage);
            setRequests(result.requests);
            setTotalPages(result.pagination.totalPages);
            setTotalItems(result.pagination.totalItems);
        } catch (error) {
            toast.error('Failed to fetch payout requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(currentPage, statusFilter);
    }, [currentPage, statusFilter]);

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handleProcessRequest = async (requestId, action) => {
        try {
            setActionLoading(requestId);
            await payoutService.processWithdrawalRequest(requestId, action, action === 'REJECT' ? rejectReason : '');
            toast.success(`Request ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`);
            setShowRejectModal(null);
            setRejectReason('');
            fetchRequests(currentPage, statusFilter);
        } catch (error) {
            toast.error(error.message || `Failed to ${action.toLowerCase()} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'APPROVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const renderTableContent = () => {
        if (isLoading) {
            return [...Array(5)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-40 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-12 w-48 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-white/5 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-24 bg-white/5 rounded"></div></td>
                </tr>
            ));
        }

        if (requests.length === 0) {
            return (
                <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        No payout requests found
                    </td>
                </tr>
            );
        }

        return requests.map((req, index) => (
            <motion.tr
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <img src={req.instructor.avatar} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                        <div>
                            <div className="font-bold text-white">{req.instructor.name}</div>
                            <div className="text-xs text-slate-500">{req.instructor.email}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-lg font-bold text-purple-400">
                        {formatCurrency(req.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                        Sold: {req.stats.totalSold} courses
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <span className="font-bold">{req.bankName}</span>
                            <button onClick={() => copyToClipboard(req.accountNumber)} className="p-1 hover:text-purple-400 transition-colors">
                                <Copy size={12} />
                            </button>
                        </div>
                        <div className="text-xs text-slate-400">{req.accountNumber}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">{req.accountName}</div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                </td>
                <td className="px-6 py-4">
                    {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleProcessRequest(req.id, 'APPROVE')}
                                disabled={actionLoading === req.id}
                                className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                                title="Approve & Send Money"
                            >
                                <CheckCircle size={18} />
                            </button>
                            <button
                                onClick={() => setShowRejectModal(req.id)}
                                disabled={actionLoading === req.id}
                                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                title="Reject Request"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>
                    )}
                </td>
            </motion.tr>
        ));
    };

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Payout Management</h1>
                    <p className="text-slate-400">Review and process instructor withdrawal requests</p>
                </div>
                
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
                        <button
                            key={status}
                            onClick={() => handleStatusFilter(status)}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                                statusFilter === status ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </header>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Instructor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount & Stats</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableContent()}
                        </tbody>
                    </table>
                </div>

                {!isLoading && requests.length > 0 && (
                    <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <p className="text-xs text-slate-500">
                            Total {totalItems} requests found
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs text-white px-3 font-bold">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Reject Request</h3>
                        <p className="text-slate-400 text-sm mb-6">Please provide a reason for rejecting this payout request. This will be visible to the instructor.</p>
                        
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500/50 mb-6"
                            placeholder="Reason for rejection..."
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(null)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleProcessRequest(showRejectModal, 'REJECT')}
                                disabled={!rejectReason.trim() || actionLoading}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject Request'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default PayoutRequests;
