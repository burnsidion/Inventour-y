<template>
  <Transition>
    <div v-if="showPage" class="flex flex-col items-center justify-center min-h-screen bg-primary">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-2xl font-bold mb-4 text-center text-[#393f4d]">Login</h2>

        <SkeletonLoader
          v-if="loading"
          :rows="3"
          :heights="[48, 48, 48]"
          :padding="32"
          :minHeight="250"
        />

        <form v-else @submit.prevent="submitLogin">
          <div class="mb-4">
            <label class="block text-gray-700">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Password</label>
            <input
              v-model="password"
              @focus="clearError"
              type="password"
              required
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <p v-if="errorMessage" class="text-red-500 mt-2 text-center animate-bounce">
            {{ errorMessage }}
          </p>
          <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg">Login</button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';

import SkeletonLoader from '@/components/SkeletonLoader.vue';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(true);
const showPage = ref(false);
const errorMessage = ref('');

const submitLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5002/api/users/login', {
      email: email.value,
      password: password.value,
    });
    console.log('Login Successfull!', response.data);

    authStore.setUser(response.data.user, response.data.token);
    router.push('/');
  } catch (error) {
    console.log('Error logging in', error.response?.data || error.message);

    const message = error.response?.data?.error || "Something went wrong. Please try again.";

    if (error.response.data.message === 'Invalid password') {
      errorMessage.value = error.response.data.message;
    } else if (error.response?.status === 404) {
      errorMessage.value = 'User not found. Please check your email.';
    } else {
      errorMessage.value = message;
    }
  }
};

const clearError = () => {
  errorMessage.value = '';
};

onMounted(() => {
  setTimeout(() => {
    showPage.value = true;
  }, 500);

  setTimeout(() => {
    loading.value = false;
  }, 1500);
});
</script>


<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>