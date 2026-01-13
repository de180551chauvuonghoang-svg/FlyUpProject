const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    if (token) return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    return { 'Content-Type': 'application/json' };
};

export const toggleWishlist = async (courseId) => {
    const res = await fetch(`${API_URL}/wishlist/toggle`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ courseId })
    });
    
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to toggle wishlist');
    }
    return res.json();
};

export const getWishlist = async () => {
    const res = await fetch(`${API_URL}/wishlist`, {
        headers: getAuthHeader()
    });

    if (!res.ok) {
        throw new Error('Failed to fetch wishlist');
    }
    return res.json();
};


