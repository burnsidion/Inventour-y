<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

authStore.loadUserFromStorage();
</script>

<template>
  <div id="app">
    <header>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/signup">Sign Up</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
