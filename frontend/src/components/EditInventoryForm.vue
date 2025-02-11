<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]"
    :class="{ 'disable-hover': modalOpen }"
  >
    <div class="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 class="text-xl font-bold text-center">
        <input
          v-model="newItemName"
          type="text"
          class="w-full p-2 border rounded"
          :placeholder="inventoryItem.name"
        />
      </h2>

      <form @submit.prevent="updateInventory">
        <div class="mb-4">
          <label class="block text-gray-700">Price ($)</label>
          <input
            v-model="updatedPrice"
            type="number"
            step="0.01"
            class="w-full p-2 border rounded"
          />
        </div>

        <div v-if="inventoryItem.type === 'hard'" class="mb-4">
          <label class="block text-gray-700">Add Stock</label>
          <input v-model="addedQuantity" type="number" class="w-full p-2 border rounded" />
        </div>

        <div v-if="inventoryItem && inventoryItem.type === 'soft'" class="mb-4">
          <label class="block text-gray-700">Update Stock by Size</label>
          <div v-for="size in updatedSizes" :key="size.size" class="flex gap-2 items-center">
            <span class="w-1/3">{{ size.size }}</span>
            <input v-model="size.newStock" type="number" class="w-2/3 p-2 border rounded" />
          </div>
        </div>

        <div class="flex justify-between mt-4 gap-1">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button @click="deleteItem(itemId)" class="btn btn-error text-white">
            🗑 Delete Item
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
  
<script setup>
import { ref, watch } from 'vue';
import { useInventoryStore } from '@/stores/inventory';

const inventoryStore = useInventoryStore();

const { deleteInventoryItem } = inventoryStore;

const props = defineProps({
  inventoryItem: {
    type: Object,
    required: true,
  },
  modalOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['close', 'save']);

const itemId = props.inventoryItem.id;

const newItemName = ref('');
const updatedItem = ref({});
const updatedPrice = ref('');
const updatedSizes = ref([]);
const addedQuantity = ref([]);

watch(
  () => props.inventoryItem,
  (newVal) => {
    if (!newVal || !newVal.name) {
      return;
    }

    updatedItem.value = { ...newVal };
    updatedPrice.value = newVal.price || '';
    newItemName.value = newVal.name;

    if (newVal.type === 'soft' && Array.isArray(newVal.sizes)) {
      updatedSizes.value = newVal.sizes.map((sizeObj) => ({
        size: sizeObj.size,
        newStock: sizeObj.quantity,
      }));
      addedQuantity.value = new Array(newVal.sizes.length).fill(0);
    }

    if (newVal.type === 'hard') {
      addedQuantity.value = 0;
    }
  },
  { immediate: true }
);

const updateInventory = () => {
  const updatedData = {
    id: props.inventoryItem.id,
    name: newItemName.value,
    price: updatedPrice.value,
  };

  if (props.inventoryItem.type === 'soft') {
    updatedData.sizes = updatedSizes.value.map((sizeObj, index) => ({
      size: sizeObj.size,
      new_quantity: sizeObj.newStock + (addedQuantity.value[index] || 0),
    }));
  }

  if (props.inventoryItem.type === 'hard') {
    updatedData.quantity = (props.inventoryItem.quantity || 0) + addedQuantity.value;
  }

  emit('save', updatedData);
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
</script>