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
      <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">Soft Items</h2>
      <button @click="expanded = !expanded" class="text-sm text-blue-500 mb-2">
        {{ expanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <template v-if="!isLoading">
      <template v-if="softItemsList.length > 0">
        <draggable
          v-if="expanded"
          v-model="softItemsList"
          item-key="name"
          class="flex flex-col space-y-4"
        >
          <template #item="{ element: item }">
            <div
              class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce cursor-move text-[#393f4d]"
            >
              <h3 class="font-semibold">{{ item.name }}</h3>
              <p class="text-gray-600 mb-2">Price: ${{ getSoftItemPrice(item.name) }}</p>
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
                      :class="lowStockAlert(sizeEntry.quantity) ? 'text-red-600 animate-pulse' : ''"
                    >
                      {{
                        lowStockAlert(sizeEntry.quantity)
                          ? `${sizeEntry.quantity} LOW STOCK!!!`
                          : sizeEntry.quantity
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="flex justify-center mt-2">
                <button
                  @click="toggleEditForm(item)"
                  class="btn btn-error text-white hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                >
                  📝 Edit Item
                </button>
              </div>
            </div>
          </template>
        </draggable>
      </template>
      <template v-else>
        <p class="text-gray-500 text-center">
          No soft items found in inventory. Click the "Add Inventory Item" button to add some merch!
        </p>
      </template>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import EditInventoryForm from './EditInventoryForm.vue';
import draggable from 'vuedraggable';

const inventoryStore = useInventoryStore();
const { fetchInventory, saveInventoryChanges } = inventoryStore;

const route = useRoute();
const tourId = route.params.id;

const expanded = ref(true);
const editingItem = ref(null);
const modalOpen = ref(false);
const isLoading = ref(false);

const softItemsList = computed(() => {
  return inventoryStore.inventory.filter((item) => item.type === 'soft');
});

const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const lowStockAlert = (quantity) => {
  return quantity < 30;
};

const toggleEditForm = (item) => {
  const selectedItem = inventoryStore.inventory.find(
    (inventoryItem) => inventoryItem.id === item.id
  );

  if (!selectedItem) {
    console.error('No item found for:', item);
    return;
  }

  editingItem.value = { ...selectedItem, sizes: [...(selectedItem.sizes || [])] };
  modalOpen.value = true;
};

const getSoftItemPrice = (name) => {
  const item = inventoryStore.inventory.find((i) => i.name === name && i.type === 'soft');
  return formattedPrice(item ? item.price : 'N/A');
};

const closeEditForm = () => {
  editingItem.value = null;
  modalOpen.value = false;
};

const handleSaveChanges = async (updatedData) => {
  if (updatedData.sizes) {
    updatedData.sizes = updatedData.sizes.map((sizeObj) => ({
      size: sizeObj.size,
      quantity: sizeObj.quantity !== undefined ? sizeObj.quantity : sizeObj.new_quantity || 0,
    }));
  }

  editingItem.value = null;
  modalOpen.value = false;

  const success = await saveInventoryChanges(updatedData, tourId);
  if (!success) {
    alert('Failed to update item, please try again');
  }
};

onMounted(async () => {
  isLoading.value = true;
  await fetchInventory(route.params.id);
  isLoading.value = false;
});
</script>