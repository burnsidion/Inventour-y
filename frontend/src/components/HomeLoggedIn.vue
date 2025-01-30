<template>
  <div class="flex min-h-screen">
    <SidebarMenu />
    <div class="flex-1 p-6">
      <h1 class="text-3xl font-bold mb-6">Your Tours</h1>

      <div v-if="tours.length > 0" class="grid gap-4">
        <div v-for="tour in tours" :key="tour.id" class="p-4 bg-white rounded-lg shadow">
          <div>
            <h2 class="text-xl font-semibold text-[#393f4d]">{{ tour.name }}</h2>
            <p class="text-gray-600">
              📅 {{ formatTourDate(tour.start_date) }} - {{ formatTourDate(tour.end_date) }}
            </p>

            <div class="flex justify-between gap-4">
              <div class="flex gap-4">
                <router-link :to="`/inventory/${tour.id}`" class="btn btn-secondary mt-2">
                  📦 Manage Inventory
                </router-link>
                <!-- "Create Show" Button -->
                <button @click="createShow(tour.id)" class="btn btn-primary mt-2">
                  ➕ Create Show
                </button>
              </div>
              <div>
                <button @click="deleteTour(tour.id)" class="btn btn-error text-white mt-2">
                  🗑  Delete Tour
                </button>
              </div>
            </div>

            <!-- Shows List -->
            <div v-if="tour.shows && tour.shows.length > 0" class="mt-4">
              <h3 class="text-lg font-semibold text-[#393f4d]">Shows:</h3>
              <ul>
                <li v-for="show in tour.shows" :key="show.id">
                  <router-link :to="`/shows/${show.id}`" class="text-blue-500 hover:underline">
                    📍 {{ show.venue }} - {{ formatTourDate(show.date) }}
                  </router-link>
                </li>
              </ul>
            </div>
            <p v-else class="text-gray-500 mt-2">No shows added yet.</p>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center">
        <p class="text-gray-500 text-lg">No tours yet.</p>
        <button @click="createTour" class="btn btn-primary mt-4 animate-pulse">
          + Create Your First Tour
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue'
import SidebarMenu from '@/components/SidebarMenu.vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'

const authStore = useAuthStore()
const router = useRouter()
const tours = ref([])

const fetchShows = async (tourId) => {
  try {
    const token = authStore.token
    const response = await axios.get(`http://localhost:5002/api/shows?tour_id=${tourId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`No shows found for tour ${tourId}.`)
      return []
    } else {
      console.error(
        `Error fetching shows for tour ${tourId}:`,
        error.response?.data || error.message
      )
      return []
    }
  }
}

const fetchTours = async () => {
  try {
    const token = authStore.token
    const response = await axios.get('http://localhost:5002/api/tours', {
      headers: { Authorization: `Bearer ${token}` },
    })

    tours.value = await Promise.all(
      response.data.map(async (tour) => ({
        ...tour,
        shows: await fetchShows(tour.id),
      }))
    )
  } catch (error) {
    console.error('Error fetching tours:', error.response?.data || error.message)
  }
}

const createShow = (tourId) => {
  router.push(`/shows/create?tour_id=${tourId}`)
}

const deleteTour = async (tourId) => {
  if (!confirm('Are you sure you want to delete this tour?')) return

  try {
    const token = authStore.token
    await axios.delete(`http://localhost:5002/api/tours/${tourId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    tours.value = tours.value.filter((tour) => tour.id !== tourId)
  } catch (error) {
    console.error('Error deleting tour:', error.response?.data || error.message)
  }
}

const formatTourDate = (dateString) => {
  return format(new Date(dateString), 'MMM dd, yyyy')
}

const createTour = () => {
  router.push('/create-tour')
}

onMounted(fetchTours)
</script>