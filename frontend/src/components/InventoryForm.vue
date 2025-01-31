<template>
  <div class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-semibold mb-4">Add Inventory</h1>

    <form @submit.prevent="submitInventory">
      <label class="block mb-2">Item Name</label>
      <input v-model="name" type="text" class="input input-bordered w-full" required />

      <label class="block mt-4 mb-2">Type</label>
      <select v-model="type" class="select select-bordered w-full">
        <option value="hard">Hard Item (CD, Vinyl, Posters)</option>
        <option value="soft">Soft Item (T-Shirts, Hoodies)</option>
      </select>

      <label class="block mt-4 mb-2">Size (if applicable)</label>
      <input
        v-model="size"
        type="text"
        class="input input-bordered w-full"
        placeholder="Leave blank if not applicable"
      />

      <label class="block mt-4 mb-2">Quantity</label>
      <input v-model="quantity" type="number" class="input input-bordered w-full" required />

      <label class="block mt-4 mb-2">Price ($)</label>
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
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const name = ref('');
const type = ref('hard');
const size = ref('');
const quantity = ref(0);
const price = ref(0);

const submitInventory = async () => {
  console.log('Submitting Inventory:', {
    tour_id: route.query.tour_id,
    name: name.value,
    type: type.value,
    size: size.value || null,
    quantity: quantity.value,
    price: price.value,
  });

  try {
    const token = authStore.token;
    await axios.post(
      'http://localhost:5002/api/inventory',
      {
        tour_id: route.query.tour_id,
        name: name.value,
        type: type.value,
        size: size.value || null,
        quantity: quantity.value,
        price: price.value,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    router.push(`/tours/${route.query.tour_id}/inventory`);
  } catch (error) {
    console.error('Error adding inventory:', error);
  }
};

const cancelSubmit = () => {
  router.push(`/tours/${route.query.tour_id}/inventory`);
};
</script>