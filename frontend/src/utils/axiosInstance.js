import axios from 'axios';
import logger from './logger';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    withCredentials: true, 
});

axiosInstance.interceptors.request.use(
    (config) => {
        logger.debug(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        logger.error(`[API Request Error]`, error);
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        logger.debug(`[API Response] ${response.status} from ${response.config.url}`);
        return response;
    },
    (error) => {
        logger.error(`[API Response Error]`, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosInstance;