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
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/signup">Sign Up</RouterLink>
        <LogoutButton v-if="authStore.token" />
      </nav>
    </header>
    <RouterView />
  </div>
</template>
