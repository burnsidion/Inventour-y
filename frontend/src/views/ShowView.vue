<template>
    <div class="min-h-screen p-6">
      <h1 class="text-3xl font-bold mb-4">Show Details</h1>
  
      <div v-if="loading">Loading show data...</div>
      <div v-else-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
      <div v-else>
        <h2 class="text-2xl font-semibold">{{ show.venue }}, {{ show.city }}, {{ show.state }}</h2>
        <p class="text-gray-600">📅 {{ formatShowDate(show.date) }}</p>
  
        <!-- Inventory Section -->
        <h3 class="text-xl font-bold mt-6">Inventory</h3>
        <div v-if="inventory.length > 0" class="grid gap-4 mt-2">
        <div v-for="item in inventory" :key="item.id" class="p-4 bg-white rounded-lg shadow">
            <h4 class="text-lg font-semibold">{{ item.name }} ({{ item.type }})</h4>
            <p class="text-gray-600">Stock: {{ item.quantity }}</p>
            <p class="text-gray-600">${{ item.price }} each</p>
        </div>
        </div>
        <p v-else class="text-gray-500">No inventory items added yet.</p>

        <h3 class="text-xl font-bold mt-6">Sales</h3>
        <div v-if="sales.length > 0" class="grid gap-4 mt-2">
        <div v-for="sale in sales" :key="sale.id" class="p-4 bg-white rounded-lg shadow">
            <p class="text-gray-600">{{ sale.quantity_sold }}x {{ sale.item_name }} sold</p>
            <p class="text-gray-600">Total: ${{ sale.total_amount }}</p>
        </div>
        </div>
        <p v-else class="text-gray-500">No sales recorded for this tour yet.</p>
      </div>
    </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const show = ref({});
const inventory = ref([]);
const sales = ref([]);
const loading = ref(true);
const errorMessage = ref('');

console.log("Route Params ID:", route.params.id);

  // Fetch Show Details
const fetchShowDetails = async () => {
    try {
        const token = authStore.token;
        const response = await axios.get(`http://localhost:5002/api/shows/${route.params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        show.value = response.data;
    } catch (error) {
        if (error.response?.status === 404) {
        errorMessage.value = 'This show does not exist.';
        router.push("/"); // Redirect to homepage
        } else {
        errorMessage.value = 'Failed to load show details.';
        }
    }
};
  
// Fetch Inventory for the Show's Tour
const fetchInventory = async () => {
  try {
    const token = authStore.token;
    const response = await axios.get(`http://localhost:5002/api/inventory?tour_id=${show.value.tour_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    inventory.value = response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn("No inventory found for this tour.");
      inventory.value = []; // Prevents failure messages
    } else {
      errorMessage.value = "Failed to load inventory.";
    }
  }
};

// Fetch Sales for the Show
const fetchSales = async () => {
  try {
    const token = authStore.token;
    const response = await axios.get(`http://localhost:5002/api/sales?show_id=${show.value.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    sales.value = response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn("No sales found for this show.");
      sales.value = [];
    } else {
      errorMessage.value = "Failed to load sales.";
    }
  }
};
  
const formatShowDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
};
  
onMounted(async () => {
  await fetchShowDetails();
  if (show.value.tour_id) {
    await fetchInventory();
  }
  if (show.value.id) { 
    await fetchSales();
  }
  loading.value = false;
});
  </script>