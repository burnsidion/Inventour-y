<template>
  <div>
    <EditInventoryForm
      v-if="modalOpen && editingItem"
      :inventory-item="editingItem"
      :modal-open="modalOpen"
      @close="closeEditForm"
      @save="handleSaveChanges"
    />

    <div class="flex flex-col gap-1">
      <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">Bundles</h2>
      <button @click="expanded = !expanded" class="text-sm text-blue-500 mb-2">
        {{ expanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <!-- Only render content if not loading -->
    <template v-if="!isLoading">
      <!-- Check if there are hard items -->
      <template v-if="bundlesList.length > 0">
        <draggable v-if="expanded" v-model="bundlesList" item-key="id" class="flex flex-col space-y-4">
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
                      :class="
                        lowStockAlert(bundleQuantity(item)) ? 'text-red-600 animate-pulse' : ''
                      "
                    >
                      {{ bundleQuantity(item) }}
                    </td>
                    <td class="p-2 text-right">${{ formattedPrice(item.price) }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="flex justify-center mt-2 gap-2">
                <button @click="toggleEditForm(item)" class="btn btn-error text-white">
                  📝 Edit Item
                </button>
              </div>
            </div>
          </template>
        </draggable>
      </template>

      <!-- Show this message only if no hard items exist -->
      <template v-else>
        <p class="text-gray-500 text-center">
          No bundles found in inventory. Click the "Add Inventory Item" button to add some merch!
        </p>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import draggable from 'vuedraggable';
import { useInventoryStore } from '@/stores/inventory';
import EditInventoryForm from './EditInventoryForm.vue';
import { useRoute } from 'vue-router';

const inventoryStore = useInventoryStore();
const { saveInventoryChanges, fetchInventory } = inventoryStore;
const route = useRoute();

const expanded = ref(true);
const isLoading = ref(true);
const editingItem = ref(false);
const modalOpen = ref(false);

const bundlesList = computed(() =>
  inventoryStore.inventory
    .filter((item) => item.type === 'bundle')
    .map((bundle) => ({
      ...bundle,
      items: inventoryStore.inventory.find((b) => b.id === bundle.id)?.items || [],
    }))
);

fetchInventory(route.params.id).finally(() => {
  isLoading.value = false;
});

const bundleQuantity = computed(() => {
  return (bundle) => {
    if (!bundle.items || bundle.items.length === 0) return 'N/A';
    return Math.min(...bundle.items.map((item) => item.quantity));
  };
});

const lowStockAlert = (quantity) => {
  return quantity < 30;
};
const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const toggleEditForm = (item) => {
  const selectedItem = bundlesList.value.find((inventoryItem) => inventoryItem.id === item.id);
  if (!selectedItem) {
    console.error('No item found for:', item);
    return;
  }

  editingItem.value = { ...selectedItem, sizes: [...(selectedItem.sizes || [])] };
  modalOpen.value = true;
};

const handleSaveChanges = async (updatedData) => {
  editingItem.value = null;
  modalOpen.value = false;

  const success = await saveInventoryChanges(updatedData, route.params.id);
  if (!success) {
    alert('Failed to update item, please try again');
  }
};

const closeEditForm = () => {
  editingItem.value = null;
  modalOpen.value = false;
};
</script>