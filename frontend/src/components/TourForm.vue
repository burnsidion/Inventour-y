<template>
  <div class="min-h-screen flex items-center justify-center bg-primary">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
      <h1 class="text-2xl font-bold mb-4 text-[#393f4d]">
        {{ isEditing ? 'Edit Tour' : 'Create Tour' }}
      </h1>

      <form @submit.prevent="handleSubmit(tour)" class="space-y-4">
        <!-- Tour Name -->
        <div>
          <label for="name" class="block text-gray-700 font-medium">Tour Name</label>
          <Field
            id="name"
            name="name"
            v-model="tour.name"
            type="text"
            placeholder="Enter tour name"
            class="input input-bordered w-full"
            rules="required|min:3|max:50"
          />
          <ErrorMessage name="name" class="text-red-500 text-sm" />
        </div>

        <!-- Band Name -->
        <div>
          <label for="band_name" class="block text-gray-700 font-medium">Band Name</label>
          <Field
            id="band_name"
            name="band_name"
            v-model="tour.band_name"
            type="text"
            placeholder="Enter band name"
            class="input input-bordered w-full"
            rules="required|min:2|max:50"
          />
          <ErrorMessage name="band_name" class="text-red-500 text-sm" />
        </div>

        <!-- Start Date -->
        <div>
          <label for="start_date" class="block text-gray-700 font-medium">Start Date</label>
          <Field
            id="start_date"
            name="start_date"
            v-model="tour.start_date"
            type="date"
            placeholder="Select start date"
            class="input input-bordered w-full"
            rules="required"
          />
          <ErrorMessage name="start_date" class="text-red-500 text-sm" />
        </div>

        <!-- End Date -->
        <div>
          <label for="end_date" class="block text-gray-700 font-medium">End Date</label>
          <Field
            id="end_date"
            name="end_date"
            v-model="tour.end_date"
            type="date"
            placeholder="Select end date"
            class="input input-bordered w-full"
            rules="required"
          />
          <ErrorMessage name="end_date" class="text-red-500 text-sm" />
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary w-full mt-4" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner"></span>
          <span v-else> {{ isEditing ? 'Edit Tour' : 'Create Tour' }}</span>
        </button>

        <!-- Error Message -->
        <p v-if="errorMessage" class="text-red-500 text-sm mt-2">{{ errorMessage }}</p>
      </form>
      <button
        @click="cancelSubmit"
        class="btn btn-primary mt-4 w-full bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition"
      >
        Cancel
      </button>
      <button
        v-if="isEditing"
        @click="tourStore.deleteTour(tourId)"
        class="btn btn-primary mt-4 w-full bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition"
      >
        🗑 Delete Tour
      </button>
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Field, ErrorMessage, defineRule } from 'vee-validate';
import { required, min, max } from '@vee-validate/rules';

import { useTourStore } from '@/stores/tour';

defineRule('required', required);
defineRule('min', min);
defineRule('max', max);

const tourStore = useTourStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const tourId = route.params.id;

const errorMessage = ref('');

const tour = ref({
  name: '',
  band_name: '',
  start_date: '',
  end_date: '',
});

const isEditing = computed(() => {
  return tourId !== undefined && tourStore.tours.some((tour) => tour.id === Number(tourId));
});

const handleSubmit = async (tourData) => {
  if (isEditing.value) {
    console.log('update');
    await tourStore.updateTour(tourId, tourData);
  } else {
    console.log('create');
    await tourStore.createTour(tourData);
  }
  router.push('/');
};

const cancelSubmit = () => {
  router.push(`/`);
};

onMounted(async () => {
  if (isEditing.value) {
    const tourData = tourStore.tours.find((t) => t.id === Number(tourId));
    if (tourData) {
      tour.value = {
        name: tourData.name || '',
        band_name: tourData.band_name || '',
        start_date: tourData.start_date
          ? new Date(tourData.start_date).toISOString().split('T')[0]
          : '',
        end_date: tourData.end_date ? new Date(tourData.end_date).toISOString().split('T')[0] : '',
      };
    }
  }
});
</script>