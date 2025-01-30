<template>
  <div class="space-y-4 animate-pulse"
    :style="{ minHeight: `${minHeight}px`, height: `${computedContainerHeight}px` }">
    <div 
      v-for="i in rows" 
      :key="i" 
      class="bg-gray-300 rounded w-full mb-2" 
      :style="{ height: `${heights[i % heights.length]}px` }">
    </div>
  </div>
</template>
  
<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  rows: { type: Number, default: 5 },
  heights: { type: Array, default: () => [48, 48, 48, 48, 48] }, 
  padding: { type: Number, default: 40 },
  minHeight: { type: Number, default: 250 }
});

const computedContainerHeight = computed(() => {
  const totalHeight = props.heights.reduce((acc, height) => acc + height, 0) + props.padding;
  return Math.max(totalHeight, props.minHeight) + "px";
});
</script>