<template>
  <div class="p-6">
    <EditInventoryForm
      v-if="editingItem"
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

        <div v-if="hardItems.length > 0" class="grid gap-4 text-[#393f4d]">
          <Transition name="fade">
            <div v-if="hardExpanded" class="grid gap-4">
              <div
                v-for="item in hardItems"
                :key="`hard-${item.id}`"
                class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce"
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
                        class="p-2 z-[10]"
                        :class="item.quantity < 30 ? 'text-red-600 animate-pulse' : ''"
                      >
                        {{ item.quantity < 30 ? `${item.quantity} LOW STOCK!!` : item.quantity }}
                      </td>
                      <td class="p-2 text-right">${{ formattedPrice(item.price) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="flex justify-center mt-2 gap-2">
                  <button @click="deleteItem(item.id)" class="btn btn-error text-white">
                    🗑 Delete Item
                  </button>
                  <button
                    @click="toggleEditForm(item.name, item.size ? item.size : null)"
                    class="btn btn-error text-white hover:opacity-100 transition-opacity duration-200"
                  >
                    📝 Edit Item
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
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
                    <tr class="border-b border-gray-500">
                      <th class="text-left p-2">Size</th>
                      <th class="p-2">Quantity</th>
                      <th class="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="sizeEntry in sizes"
                      :key="sizeEntry.id"
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
                      <td class="p-2 text-right">
                        <div class="flex flex-col lg:flex-row gap-2 justify-end">
                          <button
                            @click="deleteItemBySize(name, sizeEntry.size)"
                            class="btn btn-error text-white hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                          >
                            🗑 Delete
                          </button>
                          <button
                            @click="toggleEditForm(name, sizeEntry.size)"
                            class="btn btn-error text-white hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                          >
                            📝 Edit Item
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Transition>
        </div>
        <p v-else class="text-gray-500 text-center">
          No soft items found in inventory. Click the "Add Inventory Item" button to add some merch!
        </p>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import { storeToRefs } from 'pinia';

import { useTourStore } from '@/stores/tour';

import EditInventoryForm from '@/components/EditInventoryForm.vue';

const route = useRoute();
const inventoryStore = useInventoryStore();
const tourStore = useTourStore();

const { inventory } = storeToRefs(inventoryStore);
const { fetchInventory, deleteItem } = inventoryStore;

const editingItem = ref(null);
const softExpanded = ref(true);
const hardExpanded = ref(true);
const modalOpen = ref(false);

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const toggleEditForm = (name, size = null) => {
  if (!name || typeof name !== 'string') return;
  const selectedItem = inventory.value.find(
    (item) => item.name.trim() === name.trim() && (size ? item.size === size : item.size === null)
  );

  if (!selectedItem) return;
  editingItem.value = { ...selectedItem };
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
        grouped[item.name] = [];
      }
      grouped[item.name].push({
        id: item.id,
        size: item.size || 'One Size',
        quantity: item.quantity,
        price: item.price,
      });
    }
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));
  });

  return grouped;
});

onMounted(async () => {
  await Promise.all([tourStore.fetchTourDetails(route.params.id), fetchInventory(route.params.id)]);
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
