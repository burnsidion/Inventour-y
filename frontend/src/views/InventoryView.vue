<template>
  <div class="p-6">
    <!-- Dynamic tour name -->
    <h1 class="text-3xl font-bold my-6 text-center">Inventory for {{ tourName || 'Tour' }}</h1>

    <div class="flex gap-4 mb-4 justify-center">
      <!-- Back to Home Page Button -->
      <div class="flex justify-center mt-6 mb-4">
        <router-link to="/" class="btn btn-primary"> ← Back to Home Page </router-link>
      </div>
      <!-- Add Inventory Button -->
      <div class="flex justify-center mt-6 mb-4">
        <router-link :to="`/inventory/add?tour_id=${route.params.id}`" class="btn btn-primary">
          ➕ Add Inventory Item
        </router-link>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Hard Items Section -->
      <div>
        <div class="flex flex-col gap-1">
          <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">
            🎸 Hard Items
          </h2>
          <button @click="hardExpanded = !hardExpanded" class="text-sm text-blue-500 mb-2">
            {{ hardExpanded ? 'Collapse' : 'Expand' }}
          </button>
        </div>

        <div v-if="hardItems.length > 0" class="grid gap-4 text-[#393f4d]">
          <Transition name="fade">
            <div v-if="hardExpanded" class="grid gap-4">
              <div
                v-for="item in hardItems"
                :key="item.id"
                class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce"
              >
                <h3 class="font-semibold">{{ item.name }}</h3>
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left p-2">Quantity</th>
                      <th class="text-right p-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b">
                      <td class="p-2" :class="item.quantity < 30 ? 'text-red-600' : ''">
                        {{ item.quantity < 30 ? `${item.quantity} LOW STOCK!!` : item.quantity }}
                      </td>
                      <td class="p-2 text-right">${{ formattedPrice(item.price) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="flex justify-center">
                  <button @click="deleteItem(item.id)" class="btn btn-error text-white mt-2">
                    🗑 Delete Item
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
        <p v-else class="text-gray-500">No hard items in inventory.</p>
      </div>

      <!-- Soft Items Section -->
      <div>
        <div class="flex flex-col gap-1">
          <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">
            👕 Soft Items
          </h2>
          <button @click="softExpanded = !softExpanded" class="text-sm text-blue-500 mb-2">
            {{ softExpanded ? 'Collapse' : 'Expand' }}
          </button>
        </div>

        <div v-if="Object.keys(softItemsGrouped).length > 0" class="grid gap-4 text-[#393f4d]">
          <Transition name="fade">
            <div v-if="softExpanded" class="grid gap-4">
              <div
                v-for="(sizes, name) in softItemsGrouped"
                :key="name"
                class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce"
              >
                <h3 class="font-semibold">{{ name }}</h3>
                <p class="text-gray-600 mb-2">Price: ${{ getSoftItemPrice(name) }}</p>
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left p-2">Size</th>
                      <th class="p-2">Quantity</th>
                      <th class="text-end pr-7">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(quantity, size) in sizes"
                      :key="size"
                      class="border-b hover:bg-gray-100 transition duration-200"
                    >
                      <td class="p-2">{{ size }}</td>
                      <td
                        class="p-2 text-center"
                        :class="quantity.quantity < 30 ? 'text-red-600' : ''"
                      >
                        {{ quantity.quantity < 30 ? `${quantity.quantity} LOW STOCK!!!`: quantity.quantity }}
                      </td>
                      <td class="p-2 text-right">
                        <button
                          @click="deleteItemBySize(name, size)"
                          class="btn btn-error text-white hover:opacity-100 transition-opacity duration-200"
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Transition>
        </div>
        <p v-else class="text-gray-500">No soft items in inventory.</p>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();

const inventory = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const softExpanded = ref(true);
const hardExpanded = ref(true);
const tourName = ref('');

const fetchInventory = async () => {
  try {
    const token = authStore.token;
    const response = await axios.get(
      `http://localhost:5002/api/inventory?tour_id=${route.params.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    inventory.value = response.data;
  } catch (error) {
    errorMessage.value = 'Failed to load inventory.';
    console.error('Error fetching inventory:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTourDetails = async () => {
  try {
    const token = authStore.token;
    const response = await axios.get(`http://localhost:5002/api/tours/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data && response.data.name) {
      tourName.value = response.data.name;
    }
  } catch (error) {
    console.error('Error fetching tour details', error);
  }
};

const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const getSoftItemPrice = (name) => {
  const item = inventory.value.find((i) => i.name === name && i.type === 'soft');
  return formattedPrice(item ? item.price : 'N/A');
};

const deleteItem = async (itemId) => {
  if (!confirm('Are you sure you want to delete this item?')) return;

  try {
    const token = authStore.token;
    await axios.delete(`http://localhost:5002/api/inventory/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Update inventory after deletion
    inventory.value = inventory.value.filter((item) => item.id !== itemId);
  } catch (error) {
    console.error('Error deleting inventory item:', error);
  }
};

const deleteItemBySize = (name, size) => {
  const itemToDelete = inventory.value.find((item) => item.name === name && item.size === size);

  if (!itemToDelete) {
    console.error('Item not found.');
    return;
  }

  deleteItem(itemToDelete.id);
};

const hardItems = computed(() => {
  return inventory.value.filter((item) => item.type === 'hard');
});

const softItemsGrouped = computed(() => {
  const grouped = {};

  inventory.value.forEach((item) => {
    if (item.type === 'soft') {
      if (!grouped[item.name]) {
        grouped[item.name] = {};
      }
      grouped[item.name][item.size || 'One Size'] = {
        quantity: item.quantity,
        id: item.id,
      };
    }
  });
  return grouped;
});

onMounted(async () => {
  await Promise.all([fetchTourDetails(), fetchInventory()]);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
