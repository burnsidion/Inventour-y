import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  let inactivityTimer = null;
  const router = useRouter();

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    clearInactivityTimer();
    router.push('/login');
  };

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        console.warn('🚨 Token expired or invalid. Logging out user.');
        logout();
      }
      return Promise.reject(error);
    },
  );

  const setUser = (userData, userToken) => {
    user.value = userData;
    token.value = userToken;
    localStorage.setItem('token', userToken);
    startInactivityTimer();
  };

  const fetchUserData = async () => {
    if (!token.value) return;

    try {
      const decodedToken = JSON.parse(atob(token.value.split('.')[1]));
      const userId = decodedToken.id;

      const response = await axios.get(`http://localhost:5002/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      user.value = response.data;
    } catch (error) {
      console.error('Error fetching user data:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        console.warn('Session expired. Logging out...');
        logout();
      }
    }
  };

  const loadUserFromStorage = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    try {
      const decodedToken = JSON.parse(atob(storedToken.split('.')[1]));
      const exp = decodedToken.exp * 1000; // Convert expiration time to milliseconds

      if (Date.now() >= exp) {
        console.warn('Stored token is expired. Logging out...');
        logout();
        return;
      }

      token.value = storedToken;
      startInactivityTimer();
    } catch (error) {
      console.error('Error validating stored token:', error);
      logout();
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

  const signupUser = async (userData) => {
    try {
      await axios.post('http://localhost:5002/api/users', userData);
      return { success: true, message: 'User created successfully' };
    } catch (error) {
      console.error('🚨 Error signing up:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.',
      };
    }
  };

  const loginUser = async ({ email, password }) => {
    try {
      const response = await axios.post('http://localhost:5002/api/users/login', {
        email,
        password,
      });

      setUser(response.data.user, response.data.token);
      router.push('/');
    } catch (error) {
      console.log('Error logging in', error.response?.data || error.message);

      const message = error.response?.data?.error || 'Something went wrong. Please try again.';

      if (error.response.data.message === 'Invalid password') {
        throw new Error('Invalid Password');
      } else if (error.response?.status === 404) {
        throw new Error('User not found. Please check your email.');
      } else {
        throw new Error(message);
      }
    }
  };

  const deleteUserAccount = async () => {
    try {
      await axios.delete(`http://localhost:5002/api/users/${user.value.id}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });

      alert("Your account has been deleted successfully.");
      logout();
    } catch (error) {
      console.error("Error deleting account:", error.response?.data || error.message);
      alert("Failed to delete account. Please try again.");
    }
  };

  const updateUsername = async (newUsername) => {
    try {
      await axios.put(
        'http://localhost:5002/api/users',
        { name: newUsername },
        {
          headers: { Authorization: `Bearer ${token.value}` },
        },
      );

      user.value.name = newUsername;
    } catch (error) {
      console.error('Error updating username:', error.response?.data || error.message);
      throw error;
    }
  };

  const updateBio = async (newBio) => {
    try {
      const response = await axios.put(
        'http://localhost:5002/api/users',
        { bio: newBio },
        {
          headers: { Authorization: `Bearer ${token.value}` },
        },
      );

      user.value.bio = response.data.user.bio;
    } catch (error) {
      console.error('Error updating bio:', error);
      throw error;
    }
  };

  const saveProfilePic = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const response = await axios.put('http://localhost:5002/api/users', formData, {
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      user.value.profile_pic = response.data.user.profile_pic;
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert('Could not update profile picture. Try again.');
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
    loginUser,
    fetchUserData,
    updateUsername,
    updateBio,
    saveProfilePic,
    deleteUserAccount
  };
});
