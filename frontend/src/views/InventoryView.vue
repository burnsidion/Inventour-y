<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">Inventory Management</h1>

    <!-- Display Inventory -->
    <div v-if="inventory.length > 0" class="grid gap-4">
      <div v-for="item in inventory" :key="item.id" class="p-4 bg-white rounded-lg shadow">
        <h2 class="text-xl font-semibold">{{ item.name }}</h2>
        <p class="text-gray-600">Type: {{ item.type }} | Size: {{ item.size || 'N/A' }}</p>
        <p class="text-gray-600">Stock: {{ item.quantity }}</p>
        <p class="text-gray-600">Price: ${{ item.price.toFixed(2) }}</p>
      </div>
    </div>

    <div v-else class="text-gray-500">No inventory items added yet.</div>

    <!-- Add Inventory Button -->
    <button @click="openInventoryModal" class="btn btn-primary mt-4">➕ Add Inventory</button>
  </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const inventory = ref([])
const loading = ref(true)

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
    console.warn('No inventory found for this tour.', error)
  } finally {
    loading.value = false
  }
}

const openInventoryModal = () => {
  console.log('Open inventory form (to be implemented)')
}

onMounted(fetchInventory)
</script>