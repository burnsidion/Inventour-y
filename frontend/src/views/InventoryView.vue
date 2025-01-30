<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">Inventory for Tour</h1>

    <div v-if="loading" class="text-gray-500">Loading inventory...</div>
    <div v-else-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Hard Items Column -->
        <div>
          <h2 class="text-2xl font-semibold mb-4 text-center md:text-left">🎸 Hard Items</h2>
          <div v-if="hardItems.length > 0" class="space-y-4">
            <div v-for="item in hardItems" :key="item.id" class="p-4 bg-white shadow rounded-lg">
              <h3 class="text-lg font-bold text-[#393f4d]">{{ item.name }}</h3>
              <p>Quantity: {{ item.quantity }}</p>
              <p>Price: ${{ item.price.toFixed(2) }}</p>
            </div>
          </div>
          <p v-else class="text-gray-500">No hard items added yet.</p>
        </div>

        <!-- Soft Items Column -->
        <div>
          <h2 class="text-2xl font-semibold mb-4 text-center md:text-left">👕 Soft Items</h2>
          <div v-if="softItems.length > 0" class="space-y-4">
            <div v-for="item in softItems" :key="item.id" class="p-4 bg-white shadow rounded-lg text-[#393f4d]">
              <h3 class="text-lg font-bold">{{ item.name }}</h3>
              <p>Size: {{ item.size || 'N/A' }}</p>
              <p>Quantity: {{ item.quantity }}</p>
              <p>Price: ${{ item.price.toFixed(2) }}</p>
            </div>
          </div>
          <p v-else class="text-gray-500">No soft items added yet.</p>
        </div>
      </div>
    </div>

    <!-- Button to Add Inventory -->
    <div class="mt-6 flex justify-center">
      <router-link :to="`/inventory/add?tour_id=${route.params.id}`" class="btn btn-primary">
        ➕ Add Inventory
      </router-link>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const inventory = ref([])
const loading = ref(true)
const errorMessage = ref('')

const fetchInventory = async () => {
  try {
    const token = authStore.token
    const response = await axios.get(
      `http://localhost:5002/api/inventory?tour_id=${route.params.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    inventory.value = response.data
  } catch (error) {
    errorMessage.value = 'Failed to load inventory.'
    console.error('Error fetching inventory:', error)
  } finally {
    loading.value = false
  }
}

// **Computed properties with type safety**
const hardItems = computed(() =>
  inventory.value
    .filter((item) => item.type === 'hard')
    .map((item) => ({
      ...item,
      price: Number(item.price) || 0, // Ensure price is a number
    }))
)

const softItems = computed(() =>
  inventory.value
    .filter((item) => item.type === 'soft')
    .map((item) => ({
      ...item,
      price: Number(item.price) || 0, // Ensure price is a number
    }))
)

onMounted(fetchInventory)
</script>
