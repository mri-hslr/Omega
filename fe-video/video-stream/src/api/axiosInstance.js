import axios from 'axios';

const api = axios.create({
    // Look for the Vercel variable. If it doesn't exist (like on your laptop), use localhost!
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', 
    withCredentials: true, 
});

export default api;