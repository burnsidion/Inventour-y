<template>
  <div class="min-h-screen flex flex-col items-center justify-center">
    <h1 class="text-3xl font-bold mb-6">Enter Show Details</h1>

    <form @submit.prevent="submitShow" class="w-full max-w-lg p-6 bg-white rounded-lg shadow">
      <div class="mb-4">
        <label class="block text-sm font-medium">Venue</label>
        <input v-model="venue" type="text" required class="input input-bordered w-full" />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium">City</label>
        <input v-model="city" type="text" required class="input input-bordered w-full" />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium">State</label>
        <input v-model="state" type="text" required class="input input-bordered w-full" />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium">Date</label>
        <input v-model="date" type="date" required class="input input-bordered w-full" />
      </div>

      <button type="submit" class="btn btn-primary w-full">Create Show</button>
      <button
        @click.prevent="cancelSubmit"
        class="btn btn-primary mt-4 w-full bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition"
      >
        Cancel
      </button>
    </form>
  </div>
</template>
  
  <script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTourStore } from '@/stores/tour';

const router = useRouter();
const route = useRoute();
const tourStore = useTourStore();

const tourId = ref(null);
const venue = ref('');
const city = ref('');
const state = ref('');
const date = ref('');

onMounted(() => {
  tourId.value = route.query.tour_id;
  if (!tourId.value) {
    console.error('No tour ID provided');
    router.push('/');
  }
});

const submitShow = async () => {
  const payload = {
    tour_id: tourId.value,
    venue: venue.value,
    city: city.value,
    state: state.value,
    date: date.value,
  };
  await tourStore.addShow(payload);
};

const cancelSubmit = () => {
  router.push(`/`);
};
</script>