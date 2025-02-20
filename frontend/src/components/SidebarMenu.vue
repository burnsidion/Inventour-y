<template>
  <aside class="w-64 h-screen bg-secondary p-6 text-white">
    <h2 class="text-lg font-bold mb-6">Menu</h2>

    <button @click="createTour" class="btn btn-primary w-full mb-4">+ Create New Tour</button>

    <nav class="space-y-2">
      <RouterLink to="/" class="block px-4 py-2 hover:bg-gray-700 rounded">🏠 Home</RouterLink>
      <RouterLink to="/profile" class="block p-2 rounded hover:bg-gray-200">
        👤 Profile
      </RouterLink>
      <RouterLink to="/inventory" class="block px-4 py-2 hover:bg-gray-700 rounded"
        >📦 Inventory</RouterLink
      >
      <RouterLink to="/shows/closed" class="block px-4 py-2 hover:bg-gray-700 rounded"
        >📊 Closed Shows</RouterLink
      >
      <LogoutButton class="block px-4 py-2 hover:bg-red-500 rounded">🚪 Logout</LogoutButton>
    </nav>
  </aside>
</template>
  
  <script setup>
import { useRouter } from 'vue-router';
import LogoutButton from './LogoutButton.vue';

const router = useRouter();

const createTour = () => {
  router.push('/create-tour');
};
</script>