<template>
  <Transition name="fade">
    <div v-if="showPage" class="flex justify-center items-center min-h-screen bg-primary">
      <div class="card w-96 bg-ivory shadow-xl p-6">
        <h2 class="text-2xl font-bold text-center text-bg-primary text-[#393f4d]">Sign Up</h2>
        <SkeletonLoader v-if="loading" :rows="5" :heights="[48, 48, 48, 48, 48]" :containerHeight="450" />
        <form v-else @submit.prevent="submitForm">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Name</span>
            </label>
            <input v-model="name" type="text" class="input input-bordered w-full" required />
          </div>
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Email</span>
            </label>
            <input v-model="email" type="email" class="input input-bordered w-full" required />
          </div>
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input v-model="password" type="password" class="input input-bordered w-full" required />
          </div>
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Role (optional)</span>
            </label>
            <select v-model="role" class="select select-bordered w-full">
              <option value="user">User</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary w-full">Sign Up</button>
        </form>
      </div>
    </div>
  </Transition>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

import SkeletonLoader from './SkeletonLoader.vue';

const authStore = useAuthStore();
const router = useRouter();


const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('user');
const loading = ref(true);
const showPage = ref(false);

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

onMounted(() => {
  showPage.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1000)
})
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>