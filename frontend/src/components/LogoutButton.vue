<template>
  <div>
    <button
      @click="handleLogout"
      class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
    >
      Logout
    </button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
}
</script>