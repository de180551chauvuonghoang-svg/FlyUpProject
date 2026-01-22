
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const sendMessage = async (message) => {
  try {
    const response = await axios.post(`${API_URL}/chatbot`, { message });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to send message';
  }
};
