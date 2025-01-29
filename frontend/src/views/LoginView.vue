<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-primary">
    <div class="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 class="text-2xl font-bold mb-4 text-center text-[#393f4d]">Login</h2>
      <form @submit.prevent="submitLogin">
        <div class="mb-4">
          <label class="block text-gray-700">Email</label>
          <input v-model="email" type="email" required class="w-full px-4 py-2 border rounded-lg">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700">Password</label>
          <input v-model="password" type="password" required class="w-full px-4 py-2 border rounded-lg">
        </div>
        <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg">
          Login
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const authStore = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");

const submitLogin = async () => {
    try {
        const response = await axios.post("http://localhost:5002/api/users/login", {
            email: email.value,
            password: password.value 
        });
        console.log("RESPONSE:    ", response);
        console.log('Login Successfull!', response.data);

        authStore.setUser(response.data.user, response.data.token);
        router.push("/");
    } catch(error) {
        console.log('Error logging in', error.response?.data || error.message);
    }
};
</script>