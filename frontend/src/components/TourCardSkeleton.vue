<template>
  <div class="p-4 bg-gray-200 rounded-lg shadow animate-pulse">
    <!-- Tour Name & Band Name -->
    <div class="flex justify-between mb-2">
      <div class="h-6 bg-gray-300 rounded w-1/3"></div>
      <div class="h-6 bg-gray-300 rounded w-1/3"></div>
    </div>

    <!-- Tour Dates -->
    <div class="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>

    <!-- Total Sales -->
    <div class="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>

    <!-- Shows Section -->
    <div class="h-5 bg-gray-300 rounded w-1/4 mb-2"></div>
    <div class="h-4 bg-gray-300 rounded w-full mb-2"></div>

    <!-- Buttons -->
    <div class="flex flex-col md:flex-row gap-2 mt-4">
      <div class="h-10 bg-gray-300 rounded flex-1"></div>
      <div class="h-10 bg-gray-300 rounded flex-1"></div>
      <div class="h-10 bg-gray-300 rounded flex-1"></div>
    </div>
  </div>
</template>
  
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