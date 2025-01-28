<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <header>
      <nav>
        <RouterLink to="/signup">Sign Up</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
