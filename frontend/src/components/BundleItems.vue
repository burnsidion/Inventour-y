<template>
  <div>
    <!-- Inventory Form Component -->
    <EditInventoryForm
      v-if="modalOpen && editingItem"
      :inventory-item="editingItem"
      :modal-open="modalOpen"
      @close="closeEditForm"
      @save="handleSaveChanges"
    />
    <!-- Expand/Collapse Buttons -->
    <div class="flex flex-col gap-1">
      <h2 class="text-xl font-semibold flex items-center gap-2 mb-2 justify-center">Bundles</h2>
      <button @click="expanded = !expanded" class="text-sm text-blue-500 mb-2">
        {{ expanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <!-- Skeleton Card Component  -->
    <template v-if="isLoading">
      <div class="flex flex-col space-y-4">
        <SkeletonCard v-for="n in (bundlesList.length || 3, 6)" :key="n" :height="120" />
      </div>
    </template>

    <!-- Only render content if not loading -->
    <template v-if="!isLoading">
      <!-- Check if there are hard items -->
      <template v-if="bundlesList.length > 0">
        <draggable
          v-if="expanded"
          v-model="bundlesList"
          item-key="id"
          class="flex flex-col space-y-4"
        >
          <template #item="{ element: item }">
            <div
              :key="item.id"
              class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce cursor-move text-[#393f4d]"
            >
              <!-- Table -->
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
              <!-- Buttons -->
              <div class="flex justify-center mt-2 gap-2">
                <button @click="toggleEditForm(item)" class="btn btn-error text-white">
                  📝 Edit Item
                </button>
                <button @click="deleteItem(item.id)" class="btn btn-error text-white">
                  🗑 Delete
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import draggable from 'vuedraggable';
import EditInventoryForm from './EditInventoryForm.vue';
import SkeletonCard from './SkeletonCard.vue';

const inventoryStore = useInventoryStore();
const { saveInventoryChanges, fetchInventory } = inventoryStore;
const route = useRoute();

const expanded = ref(true);
const isLoading = ref(true);
const editingItem = ref(false);
const modalOpen = ref(true);

const bundlesList = computed(() =>
  inventoryStore.inventory
    .filter((item) => item.type === 'bundle')
    .map((bundle) => ({
      ...bundle,
      items: inventoryStore.inventory.find((b) => b.id === bundle.id)?.items || [],
    }))
);

const bundleQuantity = (bundle) => {
  if (!bundle || !bundle.items || bundle.items.length === 0) {
    console.log('🚨 No items found in bundle, returning N/A');
    return 'N/A';
  }
  const availableQuantities = bundle.items.map((item) => {
    if (item.type === 'hard') {
      return item.quantity;
    } else if (item.type === 'soft' && Array.isArray(item.sizes)) {
      const sizeQuantities = item.sizes.map((size) => size.quantity);
      return sizeQuantities.length ? Math.min(...sizeQuantities) : Infinity;
    }
    return Infinity;
  });

  return availableQuantities.length ? Math.min(...availableQuantities) : 'N/A';
};

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
  isLoading.value = true;

  const success = await saveInventoryChanges(updatedData, route.params.id);

  if (!success) {
    alert('Failed to update item, please try again');
  }

  await fetchInventory(route.params.id);

  setTimeout(() => {
    isLoading.value = false;
  }, 300);
};

const closeEditForm = () => {
  editingItem.value = null;
  modalOpen.value = false;
};

const deleteItem = async (itemId) => {
  const confirmed = confirm('🚨 Deleting this item will also delete any existing bundles that conatin this item, are you sure you want to proceed?');
  if (!confirmed) return;

  const success = await inventoryStore.deleteInventoryItem(itemId);
  if (success) {
    console.log(`✅ Item ${itemId} deleted successfully.`);
    await inventoryStore.fetchInventory(route.params.id);
  } else {
    alert('Failed to delete item, please try again.');
  }
};

onMounted(async () => {
  await fetchInventory(route.params.id);

  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
});
</script>