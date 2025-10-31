// relatorio-ui/src/store/authStore.js
import { create } from 'zustand';
import api from '../services/api'; 

let _queryClient = null;

export const initializeAuthStore = (client) => {
  _queryClient = client;
};

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('relatorio_token') || null,
  user: null, 
  isLoading: false, 
  error: null,      

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await api.post('/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      localStorage.setItem('relatorio_token', access_token);
      set({ token: access_token });

      const userResponse = await api.get('/users/me');
      set({ user: userResponse.data, isLoading: false });

    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: errorMessage });
      
      localStorage.removeItem('relatorio_token');
      set({ token: null, user: null });
    }
  },

  logout: () => {
    localStorage.removeItem('relatorio_token');
    set({ token: null, user: null, error: null });
    if (_queryClient) {
      _queryClient.clear();
    }
  },

  checkAuth: async () => {
    const token = get().token; 
    if (token && !get().user) { 
      try {
        set({ isLoading: true });
        const userResponse = await api.get('/users/me'); 
        set({ user: userResponse.data, isLoading: false });
      } catch (err) {        
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false }); 
    }
  },
}));

