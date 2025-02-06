<template>
  <div class="p-6">
    <EditInventoryForm
      v-if="modalOpen"
      :inventory-item="editingItem"
      :modal-open="modalOpen"
      @close="closeEditForm"
      @save="saveInventoryChanges"
    />
    <!-- Dynamic tour name -->
    <h1 class="text-3xl font-bold my-6 text-center">
      Inventory for {{ tourStore.tourName || 'Tour' }}
    </h1>

    <div class="flex flex-col sm:flex-row gap-4 mb-4 justify-center sm:justify-center">
      <!-- Back to Home Page Button -->
      <router-link to="/" class="btn btn-primary"> ← Back to Home Page </router-link>

      <!-- Add Inventory Button -->
      <router-link :to="`/inventory/add?tour_id=${route.params.id}`" class="btn btn-primary">
        ➕ Add Inventory Item
      </router-link>
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

        <template v-if="hardItemsList.length > 0">
          <draggable v-if="hardExpanded" v-model="hardItemsList" item-key="id" class="grid gap-4">
            <template #item="{ element: item }">
              <div
                :key="item.id"
                class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce cursor-move text-[#393f4d]"
              >
                <h3 class="font-semibold">{{ item.name }}</h3>
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="border-b border-gray-500">
                      <th class="text-left p-2">Quantity</th>
                      <th class="text-right p-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-gray-500">
                      <td
                        class="p-2"
                        :class="item.quantity < 30 ? 'text-red-600 animate-pulse' : ''"
                      >
                        {{ item.quantity < 30 ? `${item.quantity} LOW STOCK` : item.quantity }}
                      </td>
                      <td class="p-2 text-right">${{ formattedPrice(item.price) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="flex justify-center mt-2 gap-2">
                  <button @click="deleteItem(item.id)" class="btn btn-error text-white">
                    🗑 Delete Item
                  </button>
                  <button @click="toggleEditForm(item.name)" class="btn btn-error text-white">
                    📝 Edit Item
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </template>
        <p v-else class="text-gray-500 text-center">
          No hard items found in inventory. Click the "Add Inventory Item" button to add some merch!
        </p>
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

        <template v-if="softItemsList.length > 0">
          <draggable v-if="softExpanded" v-model="softItemsList" item-key="name" class="grid gap-4">
            <template #item="{ element: item }">
              <div
                class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce cursor-move text-[#393f4d]"
              >
                <h3 class="font-semibold">{{ item.name }}</h3>
                <p class="text-gray-600 mb-2">Price: ${{ getSoftItemPrice(item.name) }}</p>
                <div class="flex justify-between">
                  <button
                    @click="toggleEditForm(item)"
                    class="btn btn-error text-white hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                  >
                    📝 Edit Item
                  </button>
                  <button
                    @click="deleteItem(item.id)"
                    class="btn btn-error text-white hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                  >
                    🗑 Delete Item
                  </button>
                </div>
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="border-b border-gray-500">
                      <th class="text-left p-2">Size</th>
                      <th class="p-2">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="sizeEntry in item.sizes"
                      :key="sizeEntry.size"
                      class="border-b border-gray-500 hover:bg-gray-100 transition duration-200"
                    >
                      <td class="p-2">{{ sizeEntry.size }}</td>
                      <td
                        class="p-2 text-center"
                        :class="sizeEntry.quantity < 30 ? 'text-red-600 animate-pulse' : ''"
                      >
                        {{
                          sizeEntry.quantity < 30
                            ? `${sizeEntry.quantity} LOW STOCK!!!`
                            : sizeEntry.quantity
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </draggable>
        </template>
        <p v-else class="text-gray-500 text-center">
          No soft items found in inventory. Click the "Add Inventory Item" button to add some merch!
        </p>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue';
import draggable from 'vuedraggable';
import { useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import { storeToRefs } from 'pinia';

import { useTourStore } from '@/stores/tour';

import EditInventoryForm from '@/components/EditInventoryForm.vue';

const route = useRoute();
const inventoryStore = useInventoryStore();
const tourStore = useTourStore();

const { inventory } = storeToRefs(inventoryStore);
const { fetchInventory, deleteInventoryItem } = inventoryStore;

const editingItem = ref(null);
const softExpanded = ref(true);
const hardExpanded = ref(true);
const modalOpen = ref(false);
const hardItemsList = ref([]);
const softItemsList = ref([]);

const tourId = route.params.id;

const toggleEditForm = (item) => {
  const selectedItem = inventory.value.find((inventoryItem) => inventoryItem.name === item.name);

  if (!selectedItem) {
    console.error('No item found for:', item);
    return;
  }

  editingItem.value = { ...selectedItem, sizes: [...selectedItem.sizes] };
  modalOpen.value = true;
};
const saveInventoryChanges = async (updatedData) => {
  editingItem.value = null;
  await inventoryStore.editInventoryItem(updatedData, route.params.id);
};

const closeEditForm = () => {
  editingItem.value = null;
  modalOpen.value = false;
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
  if (!itemId) {
    console.error('❌ Item ID is undefined. Cannot proceed with deletion.');
    return;
  }
  const confirmed = confirm('Are you sure you want to delete this item?');
  if (!confirmed) return;

  const success = await deleteInventoryItem(itemId);

  if (!success) {
    alert('Failed to delete item, please try again');
  }
};

const hardItems = computed(() => {
  return inventory.value
    .filter((item) => item.type === 'hard')
    .map((item) => ({
      ...item,
      quantity: item.quantity || 0,
    }));
});

const softItemsGrouped = computed(() => {
  const grouped = {};

  inventory.value.forEach((item) => {
    if (item.type === 'soft') {
      if (!grouped[item.name]) {
        grouped[item.name] = {
          name: item.name,
          price: item.price,
          sizes: [],
        };
      }

      if (item.sizes && item.sizes.length > 0) {
        grouped[item.name].sizes = item.sizes.map((s) => ({
          size: s.size,
          quantity: s.quantity,
        }));
      } else {
        grouped[item.name].sizes.push({
          size: 'One Size',
          quantity: 0,
        });
      }
    }
  });

  return grouped;
});

watchEffect(() => {
  hardItemsList.value = [...hardItems.value];

  softItemsList.value = Object.values(softItemsGrouped.value).map((item) => ({
    id: inventory.value.find(i => i.name === item.name)?.id,
    name: item.name,
    price: item.price,
    sizes: [...item.sizes],
  }));
});

onMounted(async () => {
  await Promise.all([tourStore.fetchTourDetails(route.params.id), fetchInventory(tourId)]);
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
