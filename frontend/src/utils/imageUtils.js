const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    // Remove /api from API_URL to get base URL
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    // Ensure path doesn't start with / if we are appending to public/
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/public/${cleanPath}`;
};
