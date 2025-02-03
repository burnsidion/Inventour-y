import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  let inactivityTimer = null;
  const router = useRouter();

  const setUser = (userData, userToken) => {
    user.value = userData;
    token.value = userToken;
    localStorage.setItem('token', userToken);
    startInactivityTimer();
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    clearInactivityTimer();
    router.push('/login');
  };

  const loadUserFromStorage = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      token.value = storedToken;
      startInactivityTimer();
    }
  };

  const startInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimer = setTimeout(
      () => {
        console.log('User inactive, logging out...');
        logout();
      },
      30 * 60 * 1000,
    );
  };

  const clearInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  };

  // ✅ New Signup Method (Now Consistent with Other Stores)
  const signupUser = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5002/api/users', userData);

      console.log('✅ User created:', response.data);
      return { success: true, message: 'User created successfully' };
    } catch (error) {
      console.error('🚨 Error signing up:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.',
      };
    }
  };

  return {
    user,
    token,
    setUser,
    logout,
    loadUserFromStorage,
    startInactivityTimer,
    clearInactivityTimer,
    signupUser,
  };
});
