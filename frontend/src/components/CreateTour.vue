<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
      <h1 class="text-2xl font-bold mb-4 text-[#393f4d]">Create a New Tour</h1>

      <form @submit.prevent="createTour" class="space-y-4">
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
            class="input input-bordered w-full"
            rules="required"
          />
          <ErrorMessage name="end_date" class="text-red-500 text-sm" />
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary w-full mt-4" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner"></span>
          <span v-else>+ Create Tour</span>
        </button>

        <!-- Error Message -->
        <p v-if="errorMessage" class="text-red-500 text-sm mt-2">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>
  
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { Field, ErrorMessage, defineRule } from 'vee-validate'
import { required, min, max } from '@vee-validate/rules'

defineRule('required', required)
defineRule('min', min)
defineRule('max', max)

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')

const tour = ref({
  name: '',
  band_name: '',
  start_date: '',
  end_date: '',
})

const createTour = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const token = authStore.token
    const response = await axios.post('http://localhost:5002/api/tours', tour.value, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 201) {
      router.push('/')
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to create tour'
  } finally {
    loading.value = false
  }
}
</script>