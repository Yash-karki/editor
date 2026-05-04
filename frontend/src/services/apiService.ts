import axios, { AxiosInstance } from 'axios';
import { store } from '../store/appStore';
import { setTokens, logout } from '../store/slices/userSlice';

class APIService {
  private api: AxiosInstance;

  constructor() {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

    this.api = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const state = store.getState();
      const accessToken = state.user.accessToken;

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          const state = store.getState();
          const refreshToken = state.user.refreshToken;

          // Guard: Only try to refresh if we have a token
          if (!refreshToken) {
            store.dispatch(logout());
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const response = await this.api.post('/auth/refresh', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            store.dispatch(logout());
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async register(data: { email: string; username: string; password: string; fullName: string }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async createDocument(title: string, description?: string) {
    const response = await this.api.post('/documents', { title, description });
    return response.data;
  }

  async getDocument(documentId: string) {
    const response = await this.api.get(`/documents/${documentId}`);
    return response.data;
  }

  async updateDocument(documentId: string, data: any) {
    const response = await this.api.put(`/documents/${documentId}`, data);
    return response.data;
  }

  async listUserDocuments() {
    const response = await this.api.get('/documents');
    return response.data;
  }

  async shareDocument(documentId: string, email: string, permissionLevel: string) {
    const response = await this.api.post(`/documents/${documentId}/share`, {
      email,
      permissionLevel,
    });
    return response.data;
  }

  async getCollaborators(documentId: string) {
    const response = await this.api.get(`/documents/${documentId}/collaborators`);
    return response.data;
  }

  async getComments(documentId: string) {
    const response = await this.api.get(`/comments/documents/${documentId}`);
    return response.data;
  }

  async createComment(data: any) {
    const response = await this.api.post('/comments', data);
    return response.data;
  }

  async updateComment(commentId: string, content: string) {
    const response = await this.api.put(`/comments/${commentId}`, { content });
    return response.data;
  }

  async deleteComment(commentId: string) {
    const response = await this.api.delete(`/comments/${commentId}`);
    return response.data;
  }

  async exportDocument(documentId: string, format: 'pdf' | 'markdown' | 'docx') {
    const response = await this.api.get(`/export/documents/${documentId}?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getVersionHistory(documentId: string) {
    const response = await this.api.get(`/documents/${documentId}/versions`);
    return response.data;
  }

  async restoreVersion(documentId: string, versionNumber: number) {
    const response = await this.api.post(`/documents/${documentId}/restore-version`, {
      versionNumber,
    });
    return response.data;
  }

  async searchUsers(query: string) {
    const response = await this.api.get(`/users/search?query=${query}`);
    return response.data;
  }

  async updateProfile(data: { username?: string; fullName?: string; avatarUrl?: string }) {
    const response = await this.api.put('/users/profile', data);
    return response.data;
  }

  async getNotifications() {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async getActivityLogs(documentId: string) {
    const response = await this.api.get(`/activity/documents/${documentId}`);
    return response.data;
  }

  // Generic methods
  async get(url: string, config?: any) {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }
}

export const apiService = new APIService();
