<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import LogoutButton from './components/LogoutButton.vue'

const authStore = useAuthStore()

authStore.loadUserFromStorage()
</script>

<template>
  <div class="min-h-screen bg-primary">
    <nav class="navbar bg-base-100 px-4 py-2 shadow">
      <div class="flex-1">
        <RouterLink to="/" class="text-lg font-bold">Inventour-y</RouterLink>
      </div>

      <div class="flex space-x-4">
        <RouterLink to="/" class="btn btn-ghost">Home</RouterLink>

        <RouterLink v-if="!authStore.token" to="/signup" class="btn btn-ghost">Sign Up</RouterLink>
        <RouterLink v-if="!authStore.token" to="/login" class="btn btn-ghost">Login</RouterLink>

        <LogoutButton v-if="authStore.token" />
      </div>
    </nav>
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>