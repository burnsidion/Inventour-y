<template>
  <aside class="w-64 h-screen bg-secondary p-6 text-white">
    <button
      @click="$emit('closeMenu')"
      class="absolute top-4 right-4 md:hidden bg-gray-700 text-white p-2 rounded"
    >
      ❌
    </button>
    <h2 class="text-lg font-bold mb-6">Menu</h2>

    <nav class="space-y-2">
      <RouterLink
        to="/profile"
        class="block px-4 py-2 rounded hover:bg-gray-200 hover:text-[#393f4d]"
      >
        👤 Profile
      </RouterLink>
      <RouterLink
        to="/shows/closed"
        class="block px-4 py-2 rounded hover:bg-gray-200 hover:text-[#393f4d]"
        >📊 Closed Shows</RouterLink
      >
      <RouterLink
        to="/tours/mapview"
        class="block px-4 py-2 rounded hover:bg-gray-200 hover:text-[#393f4d]"
        >🗺️ Map Views</RouterLink
      >
      <LogoutButton class="block px-4 py-2 hover:bg-red-500 rounded">🚪 Logout</LogoutButton>
    </nav>
  </aside>
</template>
  
  <script setup>
import LogoutButton from './LogoutButton.vue';

defineProps({
  menuOpen: Boolean,
});
</script>