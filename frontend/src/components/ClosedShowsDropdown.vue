<template>
  <div class="mt-4">
    <h3 class="text-[#393f4d] font-semibold text-center md:text-left">
      Closed Shows:
      <span class="text-blue-500 cursor-pointer hover:underline" @click="toggleDropdown">
        {{ activeDropdown ? 'Collapse' : 'Expand' }}
      </span>
    </h3>

    <div
      v-if="activeDropdown"
      class="absolute md:absolute left-1/2 md:left-auto transform -translate-x-1/2 md:translate-x-0 mt-1 bg-ivory border border-gray-300 shadow-md rounded-md p-2 min-w-[18rem] max-w-[24rem] overflow-y-auto z-50"
    >
      <div
        v-for="show in closedShows"
        :key="show.show_id"
        class="flex items-center justify-between whitespace-nowrap px-2 py-1"
      >
        <router-link
          :to="`/shows/${show.show_id}/summary`"
          class="text-blue-500 hover:underline block"
        >
          📍 {{ show.venue }} - {{ formatTourDate(show.date) }}
        </router-link>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useShowSummariesStore } from '@/stores/showSummariesStore';

const showSummariesStore = useShowSummariesStore();
const { closedShows } = storeToRefs(showSummariesStore);

const activeDropdown = ref(false);

const toggleDropdown = () => {
  activeDropdown.value = !activeDropdown.value;
  if (activeDropdown.value) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
};

const handleClickOutside = (event) => {
  if (!event.target.closest('.closed-shows-dropdown')) {
    activeDropdown.value = false;
    document.removeEventListener('click', handleClickOutside);
  }
};

onMounted(async () => {
  await showSummariesStore.fetchClosedShows();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const formatTourDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};
</script>
  
  <style scoped>
.closed-shows-dropdown {
  position: absolute;
  z-index: 50;
}
</style>