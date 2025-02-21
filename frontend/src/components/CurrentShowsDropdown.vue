<template>
  <div>
    <h3 class="text-[#393f4d] font-semibold text-center md:text-left">
      Active Shows:
      <span class="text-blue-500 cursor-pointer hover:underline" @click="expandShows(tour.id)">
        {{ activeDropdown === tour.id ? 'Close' : 'Open' }}
      </span>
    </h3>
    <div
      v-if="activeDropdown === tour.id"
      :class="`tour-dropdown-${tour.id}`"
      class="absolute md:absolute left-1/2 md:left-auto transform -translate-x-1/2 md:translate-x-0 mt-1 bg-ivory border border-gray-300 shadow-md rounded-md p-2 min-w-[18rem] max-w-[24rem] overflow-y-auto z-50"
      :style="{ maxHeight: getMaxHeight }"
    >
      <div
        v-for="show in tour.shows"
        :key="show.id"
        class="flex items-center justify-between whitespace-nowrap px-2 py-1"
      >
        <router-link
          :to="`/shows/${show.id}?tour_id=${tour.id}`"
          class="text-blue-500 hover:underline block"
        >
          📍 {{ show.venue }} - {{ formatShowDate(show.date) }}
        </router-link>
        <button
          @click="tourStore.deleteShow(tour.id, show.id)"
          class="text-red-500 hover:text-red-700 ml-6 px-2"
        >
          🗑
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from 'vue';
import { format } from 'date-fns';
import { useTourStore } from '@/stores/tour';

const tourStore = useTourStore();
const props = defineProps({ tour: Object });
const activeDropdown = ref(null);

const getMaxHeight = computed(() => {
  if (!props.tour || !props.tour.shows) return '0';
  return props.tour.shows.length > 5 ? '12rem' : `${props.tour.shows.length * 3}rem`;
});

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(`.tour-dropdown-${activeDropdown.value}`);

  if (!dropdown || !dropdown.contains(event.target)) {
    activeDropdown.value = null;
    document.removeEventListener('click', handleClickOutside);
  }
};

const expandShows = () => {
  if (activeDropdown.value === props.tour.id) {
    activeDropdown.value = null;
    document.removeEventListener('click', handleClickOutside);
  } else {
    activeDropdown.value = props.tour.id;
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }
};

const formatShowDate = (dateString) => {
  if (!dateString) return 'N/A';
  const parsedDate = new Date(dateString);
  return isNaN(parsedDate) ? 'Invalid Date' : format(parsedDate, 'MMM dd, yyyy');
};
</script>