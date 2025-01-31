<template>
  <div class="p-6">
    <!-- Show Header -->
    <h1 class="text-3xl font-bold mb-4 text-center">📊 Sales Tracker for {{ showVenue }}</h1>
    <p class="text-ivory-600 mb-6 text-center">{{ formatShowDate(showDate) }}</p>

    <!-- Inventory Table (Responsive Grid) -->
    <div class="grid md:grid-cols-2 sm:grid-cols-1 gap-6">
      <!-- Hard Items -->
      <div>
        <h2 class="text-xl font-semibold mb-4 text-center">🎸 Hard Items</h2>
        <div
          class="grid grid-cols-4 md:grid-cols-4 sm:grid-cols-2 gap-4 text-ivory border-b pb-2 font-bold text-center"
        >
          <span>Item</span>
          <span>Stock</span>
          <span>Price</span>
          <span class="text-center">Sold</span>
        </div>

        <div
          v-for="item in hardItems"
          :key="item.id"
          class="grid grid-cols-4 md:grid-cols-4 sm:grid-cols-2 gap-4 border-b py-2 items-center text-center"
        >
          <span class="text-center">{{ item.name }}</span>
          <span class="text-center">{{ item.quantity }}</span>
          <span class="text-center">${{ formattedPrice(item.price) }}</span>
          <div class="flex justify-center">
            <input
              type="number"
              class="border rounded py-1 px-3 w-full lg:w-[50%] text-center text-sm sm:text-xs lg:text-base min-h-[40px] lg:min-h-[35px]"
              v-model.number="sales[item.id]"
              min="0"
              placeholder="Qty"
            />
          </div>
        </div>
      </div>

      <!-- Soft Items -->
      <div>
        <h2 class="text-xl font-semibold mb-4 text-center">👕 Soft Items</h2>

        <!-- Table Header -->
        <div class="grid grid-cols-3 gap-4 text-ivory border-b pb-2 font-bold text-center">
          <span>Item</span>
          <span>Sizes (Stock)</span>
          <span>Sold</span>
        </div>
        <div
          v-for="(sizes, itemName) in groupedSoftItems"
          :key="itemName"
          class="grid grid-cols-3 gap-4 border-b py-2 items-start"
        >
          <div class="font-semibold text-lg self-start text-center">{{ itemName }}</div>

          <!-- Sizes Column -->
          <div class="flex flex-col gap-2 items-center self-start w-full">
            <span
              v-for="size in sizes"
              :key="size.id"
              class="bg-gray-700 content-center text-white px-3 py-1 rounded text-center w-full text-sm sm:text-xs lg:text-base min-h-[40px] lg:min-h-[35px] lg:w-[50%]"
            >
              {{ size.size }} ({{ size.quantity }})
            </span>
          </div>

          <!-- Sold Quantity Inputs -->
          <div class="flex flex-col gap-2 items-center self-start w-full">
            <input
              v-for="size in sizes"
              :key="size.id"
              v-model.number="sales[size.id]"
              type="number"
              class="border rounded py-1 px-3 w-full lg:w-[50%] text-center text-sm sm:text-xs lg:text-base min-h-[40px] lg:min-h-[35px]"
              min="0"
              placeholder="Qty"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Start Transaction Button -->
    <div class="text-center mt-6">
      <button
        class="btn btn-primary px-6 py-2 w-full md:w-auto"
        :disabled="!Object.values(sales).some((qty) => qty > 0)"
        @click="openCart"
      >
        🛒 Start Transaction
      </button>
    </div>

    <!-- Transaction Modal -->
    <div
      v-if="cartOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full sm:w-11/12">
        <h2 class="text-2xl font-semibold mb-4">🛒 Transaction Summary</h2>

        <div v-for="sale in filteredSales" :key="sale.id">
          <p>{{ getItemName(sale.id) }} x {{ sale.qty }} - ${{ getItemTotal(sale.id) }}</p>
        </div>

        <p class="font-bold mt-4">Subtotal: ${{ subtotal }}</p>

        <div class="flex gap-4 mt-4">
          <label><input type="radio" v-model="paymentMethod" value="cash" /> Cash</label>
          <label><input type="radio" v-model="paymentMethod" value="card" /> Card</label>
        </div>

        <div v-if="paymentMethod === 'card'" class="mt-4">
          <label>Stripe Total:</label>
          <input type="number" class="border rounded p-1 w-full" v-model.number="stripeTotal" />
        </div>

        <div class="mt-6 flex justify-between">
          <button class="btn btn-error" @click="cartOpen = false">Cancel</button>
          <button class="btn btn-success" @click="submitSale">✅ Submit Sale</button>
        </div>
      </div>
    </div>

    <!-- Sales Summary -->
    <div class="mt-8 p-4 bg-gray-100 text-[#393f4d] rounded-lg shadow-md">
      <h2 class="text-xl font-semibold">📈 Sales Summary</h2>
      <p>Total Sales: ${{ salesStore.totalSales }}</p>
      <p>Cash Sales: ${{ salesStore.cashSales }}</p>
      <p>Card Sales: ${{ salesStore.cardSales }}</p>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSalesStore } from '@/stores/salesStore';
import { useAuthStore } from '@/stores/auth';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { format } from 'date-fns';

const authStore = useAuthStore();
const salesStore = useSalesStore();
const route = useRoute();

const tourId = route.query.tour_id || null;

const inventory = ref([]);
const sales = ref({});
const paymentMethod = ref('cash');
const stripeTotal = ref(0);
const cartOpen = ref(false);
const showVenue = ref('');
const showDate = ref('');

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

onMounted(async () => {
  if (!tourId) {
    console.error('🚨 No tourId found in query params');
  } else {
    await Promise.all([fetchInventory(), salesStore.fetchSales(tourId), fetchShowDetails()]);
  }
});

const hardItems = computed(() => inventory.value.filter((item) => item.type === 'hard'));
const softItems = computed(() => inventory.value.filter((item) => item.type === 'soft'));

const filteredSales = computed(() => {
  return (
    Object.entries(sales.value)
      // eslint-disable-next-line no-unused-vars
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, qty }))
  );
});

const groupedSoftItems = computed(() => {
  const grouped = {};

  softItems.value.forEach((item) => {
    if (!grouped[item.name]) {
      grouped[item.name] = [];
    }
    grouped[item.name].push(item);
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));
  });

  return grouped;
});

const formatShowDate = (dateString) => {
  if (!dateString) return 'Unknown Date';
  const parsedDate = new Date(dateString);
  return isNaN(parsedDate) ? 'Invalid Date' : format(parsedDate, 'MMM dd, yyyy');
};

const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const fetchShowDetails = async () => {
  try {
    const token = authStore.token;
    const response = await axios.get(`http://localhost:5002/api/shows/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data) {
      showVenue.value = response.data.venue;
      showDate.value = response.data.date;
    }
  } catch (error) {
    console.error('Error fetching show details:', error.response?.data || error.message);
  }
};

const fetchInventory = async () => {
  try {
    const token = authStore.token;
    const response = await axios.get(`http://localhost:5002/api/inventory?tour_id=${tourId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    inventory.value = response.data;
  } catch (error) {
    console.error('Error fetching inventory:', error.response?.data || error.message);
  }
};

const getItemName = (id) => {
  return [...hardItems.value, ...softItems.value].find((item) => item.id === id)?.name || 'Unknown';
};

const getItemTotal = (id) => {
  const item = [...hardItems.value, ...softItems.value].find((item) => item.id === id);
  return item ? (sales.value[id] * item.price).toFixed(2) : '0.00';
};

const submitSale = async () => {
  for (const [id, qty] of Object.entries(sales.value)) {
    if (qty > 0) {
      const item = [...hardItems.value, ...softItems.value].find((i) => i.id === Number(id));
      if (item) {
        await salesStore.addSale(item.id, qty, qty * item.price, paymentMethod.value);
      }
    }
  }

  sales.value = {};
  cartOpen.value = false;
};
</script>