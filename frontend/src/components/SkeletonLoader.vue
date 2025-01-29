<template>
    <div class="space-y-4 animate-pulse" :style="{ height: `${containerHeight}px` }">
      <div 
        v-for="i in rows" 
        :key="i" 
        class="bg-gray-300 rounded w-full" 
        :style="{ height: `${heights[i % heights.length]}px` }">
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps } from 'vue';
  
  defineProps({
    rows: { type: Number, default: 5 },
    heights: { type: Array, default: () => [48, 48, 48, 48, 48] }, // Match form field heights
    containerHeight: { type: Number, default: 400 } // Approximate form height
  });
  </script>