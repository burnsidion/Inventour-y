<template>
  <div class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-semibold mb-4 text-[#393f4d]">Add Inventory</h1>

    <form @submit.prevent="submitInventory">
      <label class="block mb-2 text-[#393f4d]">Item Name</label>
      <input v-model="name" type="text" class="input input-bordered w-full" required />

      <label class="block mt-4 mb-2 text-[#393f4d]">Type</label>
      <select v-model="type" class="select select-bordered w-full">
        <option value="hard">Hard Item (CD, Vinyl, Posters)</option>
        <option value="soft">Soft Item (T-Shirts, Hoodies)</option>
        <option value="bundle">Bundle (Multiple items for 1 price)</option>
      </select>

      <div v-if="type === 'soft'">
        <label class="block mt-4 mb-2">Select Sizes & Quantities</label>
        <div class="grid grid-cols-2 gap-4">
          <div v-for="size in availableSizes" :key="size" class="flex items-center">
            <input type="checkbox" :id="size" v-model="sizesSelected[size]" class="mr-2" />
            <label :for="size" class="font-medium">{{ size }}</label>

            <input
              v-if="sizesSelected[size]"
              type="number"
              v-model.number="sizes[size]"
              class="ml-4 border rounded p-1 w-16"
              placeholder="Qty"
              min="1"
            />
          </div>
        </div>
      </div>

      <div v-if="type === 'hard'">
        <label class="block mt-4 mb-2 text-[#393f4d]">Quantity</label>
        <input v-model="quantity" type="number" class="input input-bordered w-full" required />
      </div>

      <div v-if="type === 'bundle'">
        <label class="block mt-4 mb-2 text-[#393f4d]">Select Items for Bundle</label>
        <div class="grid grid-cols-2 gap-4">
          <div v-for="item in inventoryStore.inventory" :key="item.id" class="flex items-center">
            <input
              type="checkbox"
              :id="`item-${item.id}`"
              :value="item.id"
              v-model="selectedBundleItems"
              class="mr-2"
            />
            <label :for="`item-${item.id}`" class="font-medium">{{ item.name }}</label>
          </div>
        </div>
      </div>

      <label class="block mt-4 mb-2 text-[#393f4d]">Price ($)</label>
      <input
        v-model="price"
        type="number"
        step="0.01"
        class="input input-bordered w-full"
        required
      />

      <button type="submit" class="btn btn-primary mt-4 w-full">➕ Add Inventory Item</button>
    </form>

    <button
      @click="cancelSubmit"
      class="btn btn-primary mt-4 w-full bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition"
    >
      Cancel
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';

const route = useRoute();
const router = useRouter();
const inventoryStore = useInventoryStore();

const name = ref('');
const type = ref('hard');
const quantity = ref(0);
const price = ref(0);
const selectedBundleItems = ref([]);

const availableSizes = ref(['S', 'M', 'L', 'XL', 'XXL']);
const sizesSelected = reactive({});
const sizes = reactive({});

const submitInventory = async () => {
  const payload = {
    tour_id: route.query.tour_id,
    name: name.value.trim(),
    type: type.value,
    sizes:
      type.value === 'soft'
        ? Object.entries(sizes).map(([size, quantity]) => ({ size, quantity }))
        : null,
    quantity: type.value === 'hard' ? quantity.value : null,
    price: price.value,
    items:
      type.value === 'bundle' ? selectedBundleItems.value.map((id) => ({ item_id: id })) : null,
  };

  const success = await inventoryStore.addInventoryItem(payload, payload.tour_id);

  if (success && success.id) {
    router.push(`/tours/${route.query.tour_id}/inventory`);
  } else {
    console.error('❌ Error: Inventory item was not successfully created.');
  }
};

const cancelSubmit = () => {
  router.push(`/tours/${route.query.tour_id}/inventory`);
};

onMounted(async () => {
  if (route.query.tour_id) {
    await inventoryStore.fetchInventory(route.query.tour_id);
  } else {
    console.error('❌ No tour_id found when trying to fetch inventory.');
  }
});
</script>