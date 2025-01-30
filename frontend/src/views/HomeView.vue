<template>
  <component :is="authStore.token ? HomeLoggedIn : HomeLoggedOut" />
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import HomeLoggedOut from "@/components/HomeLoggedOut.vue";
import HomeLoggedIn from "@/components/HomeLoggedIn.vue";

const authStore = useAuthStore();
</script>
