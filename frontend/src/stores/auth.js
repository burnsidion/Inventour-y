import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    inactivityTimer: null,
  }),
  actions: {
    setUser(userData, userToken) {
      this.user = userData;
      this.token = userToken;
      localStorage.setItem('token', userToken);
      this.startInactivityTimer();
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      this.clearInactivityTimer();
    },
    loadUserFromStorage() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        this.token = storedToken;
        this.startInactivityTimer();
      }
    },
    startInactivityTimer() {
      this.clearInactivityTimer();

      this.inactivityTimer = setTimeout(
        () => {
          console.log('User inactive, logging out...');
          this.logout();
          const router = useRouter();
          router.push('/login');
        },
        30 * 60 * 1000,
      );
    },
    clearInactivityTimer() {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }
    },
  },
});
