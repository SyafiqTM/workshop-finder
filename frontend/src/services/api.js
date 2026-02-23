import axios from 'axios';
import { pushToast } from './toastBus.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      (error?.code === 'ERR_NETWORK' ? 'Unable to reach API server' : 'Request failed. Please try again.');

    if (!error?.config?._toastShown) {
      error.config._toastShown = true;
      pushToast({ message });
    }

    return Promise.reject(error);
  }
);

export default api;
