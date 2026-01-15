
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchTransactionHistory = async () => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_URL}/transactions`, {
        headers
    });
    
    if (!res.ok) {
        throw new Error('Failed to fetch transaction history');
    }
    const json = await res.json();
    return json.data;
};
