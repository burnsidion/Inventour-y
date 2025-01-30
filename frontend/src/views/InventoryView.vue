<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">Inventory for Tour</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Hard Items -->
      <div>
        <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">🎸 Hard Items</h2>

        <div v-if="hardItems.length > 0" class="grid gap-4 text-[#393f4d]">
          <div v-for="item in hardItems" :key="item.id" class="p-4 bg-white rounded-lg shadow">
            <h3 class="font-semibold">{{ item.name }}</h3>
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">Quantity</th>
                  <th class="text-left p-2">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="p-2">{{ item.quantity }}</td>
                  <td class="p-2">${{ formattedPrice(item.price) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p v-else class="text-gray-500">No hard items in inventory.</p>
      </div>

      <!-- Soft Items -->
      <div>
        <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">👕 Soft Items</h2>

        <div v-if="Object.keys(softItemsGrouped).length > 0" class="grid gap-4 text-[#393f4d]">
          <div
            v-for="(sizes, name) in softItemsGrouped"
            :key="name"
            class="p-4 bg-white rounded-lg shadow"
          >
            <h3 class="font-semibold">{{ name }}</h3>
            <p class="text-gray-600 mb-2">Price: ${{ getSoftItemPrice(name) }}</p>
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">Size</th>
                  <th class="text-left p-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(quantity, size) in sizes" :key="size" class="border-b">
                  <td class="p-2">{{ size }}</td>
                  <td class="p-2">{{ quantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p v-else class="text-gray-500">No soft items in inventory.</p>
      </div>
    </div>

    <!-- Add Inventory Button -->
    <div class="flex justify-center mt-6">
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

const formattedPrice = (price) => {
  const numPrice = parseFloat(price)
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A'
}

const getSoftItemPrice = (name) => {
  const item = inventory.value.find(i => i.name === name && i.type === 'soft')
  return formattedPrice(item ? item.price : 'N/A')
}

const hardItems = computed(() => {
  return inventory.value.filter((item) => item.type === 'hard')
})

const softItemsGrouped = computed(() => {
  const grouped = {}

  inventory.value.forEach((item) => {
    if (item.type === 'soft') {
      if (!grouped[item.name]) {
        grouped[item.name] = {}
      }
      grouped[item.name][item.size || 'One Size'] = item.quantity
    }
  })
  return grouped
})

onMounted(fetchInventory)
</script>
