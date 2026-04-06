import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = "https://hrms-api.whilmarbitoco.qzz.io"

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; status_code?: number }>) => {
    const originalRequest = error.config as RetriableRequest | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post<{ access_token: string }>(
          `${API_BASE_URL}auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('access_token', data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data ?? error);
  }
);
