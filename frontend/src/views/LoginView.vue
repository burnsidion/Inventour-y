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
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

import SkeletonLoader from '@/components/SkeletonLoader.vue';

const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(true);
const showPage = ref(false);
const errorMessage = ref('');

const submitLogin = async () => {
  try {
    await authStore.loginUser({ email: email.value, password: password.value });
  } catch (error) {
    errorMessage.value = error.message;
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