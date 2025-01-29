<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-4">
            <label class="block text-gray-700">Name</label>
            <input v-model="name" type="text" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Email</label>
            <input v-model="email" type="email" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Password</label>
            <input v-model="password" type="password" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Role (optional)</label>
            <select v-model="role" class="w-full px-4 py-2 border rounded-lg">
                <option value="user" selected>User</option>
                <option value="manager">Manager</option>
            </select>
           </div>
          <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg">
            Sign Up
          </button>
        </form>
      </div>
    </div>
</template>
  
<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();


const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('user');

const submitForm = async () => {
    try {
        const response = await axios.post("http://localhost:5002/api/users", {
            name: name.value,
            email: email.value,
            password: password.value,
            role: role.value
        })
        console.log('User created', response.data);

        authStore.setUser(response.data.user, response.data.token);
        router.push("/");
    } catch(error) {
        console.log('Error signging up', error.response?.data || error.message);
    }
};
</script>