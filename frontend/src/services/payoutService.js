import api from './admin/api';

const payoutService = {
    /**
     * Get instructor wallet dashboard data
     */
    getWalletDashboard: async () => {
        return api.get('/payouts/wallet');
    },

    /**
     * Update instructor bank details
     */
    updateBankDetails: async (bankData) => {
        return api.put('/payouts/bank-details', bankData);
    },

    /**
     * Submit a withdrawal request
     */
    requestWithdrawal: async (amount) => {
        return api.post('/payouts/withdraw', { amount });
    },

    /**
     * Get instructor withdrawal history
     */
    getWithdrawalHistory: async (page = 1, limit = 10) => {
        return api.get(`/payouts/history?page=${page}&limit=${limit}`);
    },

    /**
     * ADMIN: Get all withdrawal requests
     */
    getAllWithdrawalRequests: async (status = 'PENDING', page = 1, limit = 10) => {
        return api.get(`/payouts/admin/requests?status=${status}&page=${page}&limit=${limit}`);
    },

    /**
     * ADMIN: Process a withdrawal request
     */
    processWithdrawalRequest: async (requestId, action, reason = '') => {
        return api.put(`/payouts/admin/requests/${requestId}`, { action, reason });
    }
};

export default payoutService;
