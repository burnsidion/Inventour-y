<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth';

import LogoutButton from './components/LogoutButton.vue';

const authStore = useAuthStore();

authStore.loadUserFromStorage();
</script>

<template>
  <div id="app">
    <header>
      <nav class="flex space-x-4">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink v-if="!authStore.token" to="/signup">Sign Up</RouterLink>
        <RouterLink v-if="!authStore.token" to="/login">Login</RouterLink>
        <LogoutButton v-if="authStore.token" />
      </nav>
    </header>
    <RouterView />
  </div>
</template>
