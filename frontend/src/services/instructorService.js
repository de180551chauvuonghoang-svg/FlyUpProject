import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchInstructors = async () => {
  try {
    const response = await axios.get(`${API_URL}/instructors`);
    return response.data.instructors;
  } catch (error) {
    console.error('Fetch instructors error:', error);
    throw error;
  }
};
