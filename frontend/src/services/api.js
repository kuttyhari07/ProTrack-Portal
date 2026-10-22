import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization Bearer token & active Workspace ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('protrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const currentWorkspaceId = localStorage.getItem('protrack_workspace_id');
    if (currentWorkspaceId) {
      config.headers['x-workspace-id'] = currentWorkspaceId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear and redirect to login
      if (!window.location.pathname.startsWith('/auth')) {
        localStorage.removeItem('protrack_token');
        localStorage.removeItem('protrack_user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
