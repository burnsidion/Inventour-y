import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    setUser(userData, userToken) {
      this.user = userData;
      this.token = userToken;
      localStorage.setItem('token', userToken);
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
    },
    loadUserFromStorage() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        this.token = storedToken;
      }
    }
  }
});