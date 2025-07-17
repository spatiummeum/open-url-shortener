import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para agregar token de autorización
    this.api.interceptors.request.use(
      (config) => {
        const { tokens } = useAuthStore.getState();
        if (tokens?.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejar tokens expirados
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const { tokens, logout, updateTokens } = useAuthStore.getState();
          
          if (tokens?.refreshToken) {
            try {
              // Create a new axios instance to avoid interceptor loops
              const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken: tokens.refreshToken,
              });

              const { accessToken, refreshToken } = refreshResponse.data;
              const newTokens = { accessToken, refreshToken };
              
              updateTokens(newTokens);

              // Reintentar la petición original
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.api(originalRequest);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              logout();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
              return Promise.reject(refreshError);
            }
          } else {
            logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Métodos HTTP genéricos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }
}

export const apiService = new ApiService();

// Métodos específicos para URLs
export const urlApi = {
  // Crear URL corta
  createUrl: (data: {
    originalUrl: string;
    customCode?: string;
    password?: string;
    title?: string;
    description?: string;
    expiresAt?: string;
  }) => apiService.post('/urls', data),

  // Obtener URLs del usuario
  getUrls: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => apiService.get('/urls', { params }),

  // Obtener URL específica
  getUrl: (id: string) => apiService.get(`/urls/${id}`),

  // Actualizar URL
  updateUrl: (id: string, data: {
    title?: string;
    description?: string;
    isActive?: boolean;
  }) => apiService.put(`/urls/${id}`, data),

  // Eliminar URL
  deleteUrl: (id: string) => apiService.delete(`/urls/${id}`),

  // Verificar contraseña de URL protegida
  verifyPassword: (shortCode: string, password: string) => 
    apiService.post(`/urls/verify-password/${shortCode}`, { password }),
};

// Métodos específicos para autenticación
export const authApi = {
  // Registro
  register: (data: {
    email: string;
    password: string;
    name?: string;
  }) => apiService.post('/auth/register', data),

  // Login
  login: (data: {
    email: string;
    password: string;
  }) => apiService.post('/auth/login', data),

  // Refresh token
  refreshToken: (refreshToken: string) => 
    apiService.post('/auth/refresh', { refreshToken }),

  // Logout
  logout: () => apiService.post('/auth/logout'),
};

// Métodos específicos para usuarios
export const userApi = {
  // Obtener perfil
  getProfile: () => apiService.get('/users/profile'),

  // Actualizar perfil
  updateProfile: (data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => apiService.put('/users/profile', data),
};

// Métodos específicos para analytics
export const analyticsApi = {
  // Obtener analytics de una URL
  getUrlAnalytics: (urlId: string, params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) => apiService.get(`/analytics/${urlId}`, { params }),

  // Obtener dashboard de analytics
  getDashboardAnalytics: (params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) => apiService.get('/analytics/dashboard', { params }),
};

// Métodos específicos para dominios
export const domainApi = {
  // Obtener dominios del usuario
  getDomains: () => apiService.get('/domains'),

  // Agregar dominio
  addDomain: (data: { domain: string }) => apiService.post('/domains', data),

  // Eliminar dominio
  deleteDomain: (id: string) => apiService.delete(`/domains/${id}`),
};
