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
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const name = ref('');
const type = ref('hard');
const quantity = ref(0);
const price = ref(0);

const availableSizes = ref(['S', 'M', 'L', 'XL', 'XXL']);
const sizesSelected = reactive({});
const sizes = reactive({});

const updateSizes = () => {
  for (const size in sizes) {
    if (!sizesSelected[size]) {
      delete sizes[size];
    }
  }
};

const submitInventory = async () => {
  updateSizes();

  const payload = {
    tour_id: route.query.tour_id,
    name: name.value,
    type: type.value,
    sizes: type.value === 'soft' ? sizes : null,
    quantity: type.value === 'hard' ? quantity.value : null,
    price: price.value,
  };

  console.log('Submitting Inventory:', payload);

  try {
    const token = authStore.token;
    await axios.post('http://localhost:5002/api/inventory', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    router.push(`/tours/${route.query.tour_id}/inventory`);
  } catch (error) {
    console.error('Error adding inventory:', error.response?.data || error);
  }
};

const cancelSubmit = () => {
  router.push(`/tours/${route.query.tour_id}/inventory`);
};
</script>