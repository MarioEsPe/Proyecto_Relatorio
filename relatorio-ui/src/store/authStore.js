// relatorio-ui/src/store/authStore.js

import { create } from 'zustand';
import api from '../services/api'; 


export const useAuthStore = create((set, get) => ({
  // --- STATE ---
  token: localStorage.getItem('relatorio_token') || null,
  user: null, 
  isLoading: false, 
  error: null,      

  // --- ACTIONS ---

  /**
   * Login Action:
   * 1. Requests the token from /token (using Form Data).
   * 2. Stores the token in state and localStorage.
   * 3. Requests the user's data from /users/me (now with the token).
   * 4. Stores the user data.
   */
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Prepare Form Data for OAuth2
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      // 2. Make the request to /token
      const response = await api.post('/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;

      // 3. Store the token
      localStorage.setItem('relatorio_token', access_token);
      set({ token: access_token });

      // 4. Get the user's data (the 'api' interceptor will inject the token)
      const userResponse = await api.get('/users/me');
      set({ user: userResponse.data, isLoading: false });

    } catch (err) {
      // Handle errors (e.g., "Incorrect username or password")
      const errorMessage = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: errorMessage });
      
      // Clean up on failure
      localStorage.removeItem('relatorio_token');
      set({ token: null, user: null });
    }
  },

  /**
   * Logout Action:
   * Clears the state and localStorage.
   */
  logout: () => {
    localStorage.removeItem('relatorio_token');
    set({ token: null, user: null, error: null });
  },

  /**
   * "Re-hydration" Action:
   * Used on app load. If a token exists, fetch the user.
   */
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

// --- INITIALIZATION ---
useAuthStore.getState().checkAuth();