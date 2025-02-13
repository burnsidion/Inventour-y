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
      <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">
        🎸 Hard Items
      </h2>
      <button @click="expanded = !expanded" class="text-sm text-blue-500 mb-2">
        {{ expanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <!-- Only render content if not loading -->
    <template v-if="!isLoading">
      <!-- Check if there are hard items -->
      <template v-if="hardItemsList.length > 0">
        <draggable v-if="expanded" v-model="hardItemsList" item-key="id" class="grid gap-4">
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
                      :class="lowStockAlert(item.quantity) ? 'text-red-600 animate-pulse' : ''"
                    >
                      {{
                        lowStockAlert(item.quantity) ? `${item.quantity} LOW STOCK` : item.quantity
                      }}
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
          No hard items found in inventory. Click the "Add Inventory Item" button to add some merch!
        </p>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import draggable from 'vuedraggable';
import EditInventoryForm from './EditInventoryForm.vue';

const route = useRoute();
const inventoryStore = useInventoryStore();
const { saveInventoryChanges, fetchInventory } = inventoryStore;

const expanded = ref(true);
const editingItem = ref(null);
const modalOpen = ref(false);
const isLoading = ref(true);

fetchInventory(route.params.id).finally(() => {
  isLoading.value = false;
});

const hardItemsList = computed(() =>
  inventoryStore.inventory.filter((item) => item.type === 'hard')
);

const lowStockAlert = (quantity) => {
  return quantity < 30;
};
const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const toggleEditForm = (item) => {
  const selectedItem = hardItemsList.value.find((inventoryItem) => inventoryItem.id === item.id);
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