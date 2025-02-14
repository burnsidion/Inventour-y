<template>
  <div class="p-4 bg-gray-200 rounded-lg shadow animate-pulse" :style="{ height: `${height}px` }">
    <div class="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div class="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div class="h-4 bg-gray-300 rounded w-full"></div>
  </div>
</template>

<script setup>
defineProps({
  height: {
    type: Number,
    default: 160,
  },
});
</script>
    
<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}
.animate-pulse {
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
</style>