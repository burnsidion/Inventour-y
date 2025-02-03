<template>
  <div class="p-6">
    <!-- Show Header -->
    <h1 class="text-3xl font-bold mb-4 text-center">📊 Sales Tracker for {{ showVenue }}</h1>
    <p class="text-ivory-600 mb-6 text-center">{{ formatShowDate(showDate) }}</p>

    <!-- Button Container -->
    <div
      class="flex flex-col sm:flex-row gap-4 mb-4 justify-center sm:justify-center content-center items-center"
    >
      <div class="flex justify-center">
        <router-link to="/" class="btn btn-primary"> ← Back to Home Page </router-link>
      </div>
      <div class="text-center">
        <button
          class="btn btn-primary px-6 py-2"
          :disabled="!Object.values(sales).some((qty) => qty > 0)"
          @click="openCart"
        >
          🛒 Start Transaction
        </button>
      </div>
      <div>
        <button @click="clearAll()" class="btn btn-primary px-6 py-2">Clear All Quantities</button>
      </div>
    </div>

    <!-- Sales Summary -->
    <div class="my-8 p-4 bg-gray-800 text-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-center mb-4">💰 Sales Summary</h2>
      <div class="grid grid-cols-3 gap-4 text-center font-medium">
        <div class="bg-gray-700 p-4 rounded flex flex-col items-center">
          <p class="text-sm">Total Sales</p>
          <p class="text-lg font-bold">${{ salesStore.totalSales }}</p>
        </div>
        <div class="bg-gray-700 p-4 rounded flex flex-col items-center">
          <p class="text-sm">Cash Sales</p>
          <p class="text-lg font-bold">${{ salesStore.cashSales }}</p>
        </div>
        <div class="bg-gray-700 p-4 rounded flex flex-col items-center">
          <p class="text-sm">Card Sales</p>
          <p class="text-lg font-bold">${{ salesStore.cardSales }}</p>
        </div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="grid md:grid-cols-2 sm:grid-cols-1 gap-6">
      <!-- Hard Items -->
      <div>
        <div class="flex flex-col mb-2">
          <h2 class="text-xl font-semibold mb-4 text-center">🎸 Hard Items</h2>
          <button @click="hardExpanded = !hardExpanded" class="text-sm text-blue-500 mb-2">
            {{ hardExpanded ? 'Collapse' : 'Expand' }}
          </button>
        </div>
        <Transition name="fade">
          <div v-if="hardExpanded">
            <div class="grid grid-cols-4 gap-4 text-ivory border-b pb-2 font-bold text-center">
              <span>Item</span>
              <span>Stock</span>
              <span>Price</span>
              <span>Sold</span>
            </div>
            <div
              v-for="item in hardItems"
              :key="item.id"
              class="grid grid-cols-4 gap-4 border-b py-2 items-center text-center"
            >
              <span class="whitespace-nowrap text-left">{{ item.name }}</span>
              <span :class="item.quantity < 30 ? 'text-red-600 animate-pulse' : ''">{{
                item.quantity
              }}</span>
              <span>${{ formattedPrice(item.price) }}</span>
              <div class="flex justify-center">
                <input
                  type="number"
                  class="border rounded py-1 px-3 w-full lg:w-[50%] text-center text-sm"
                  v-model.number="sales[item.id]"
                  min="0"
                  placeholder="Qty"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Soft Items -->
      <div>
        <div class="flex flex-col mb-2">
          <h2 class="text-xl font-semibold mb-4 text-center">👕 Soft Items</h2>
          <button @click="softExpanded = !softExpanded" class="text-sm text-blue-500 mb-2">
            {{ softExpanded ? 'Collapse' : 'Expand' }}
          </button>
        </div>

        <Transition name="fade">
          <div v-if="softExpanded">
            <!-- Table Header (4 Columns) -->
            <div class="grid grid-cols-4 gap-4 text-ivory border-b pb-2 font-bold text-center">
              <span></span>
              <!-- Collapse Button Column -->
              <span>Item</span>
              <span>Sizes</span>
              <span>Amount</span>
            </div>

            <!-- Item Rows -->
            <div
              v-for="(sizes, itemName) in groupedSoftItems"
              :key="itemName"
              class="grid grid-cols-4 gap-4 border-b py-2"
            >
              <!-- Collapse Button -->
              <div class="flex justify-center py-4">
                <button
                  @click="toggleCollapse(itemName)"
                  class="w-8 h-8 flex items-center py-8 px-8 justify-center rounded bg-gray-700 text-white text-lg"
                >
                  {{ collapsedRows[itemName] ? '+' : '-' }}
                </button>
              </div>

              <!-- Item Name & Price -->
              <div class="font-semibold text-md text-center">
                {{ itemName }} ${{ sizes.length > 0 ? sizes[0].price : 'N/A' }}
              </div>

              <!-- Sizes Column -->
              <div v-if="!collapsedRows[itemName]" class="flex flex-col gap-2 items-center w-full">
                <span
                  v-for="size in sizes"
                  :key="size.id"
                  class="bg-gray-700 px-1 py-1 rounded text-center content-center w-[80px] text-sm sm:text-xs lg:text-base min-h-[40px] whitespace-nowrap"
                  :class="size.quantity < 30 ? 'text-red-600 animate-pulse' : ''"
                >
                  {{ size.size }} ({{ size.quantity }})
                </span>
              </div>

              <!-- Sold Quantity Inputs -->
              <div v-if="!collapsedRows[itemName]" class="flex flex-col gap-2 items-center w-full">
                <input
                  v-for="size in sizes"
                  :key="size.id"
                  v-model.number="sales[size.id]"
                  type="number"
                  class="border rounded py-1 px-3 w-[80px] text-center text-sm min-h-[40px]"
                  min="0"
                  placeholder="Qty"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="text-center text-green-500 font-semibold mt-4">
        {{ successMessage }}
      </div>
    </div>

    <!-- Transaction Modal -->
    <Transition name="fade">
      <div
        v-if="cartOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-[#393f4d] text-center">
          <h2 class="text-2xl font-semibold mb-4">🛒 Transaction Summary</h2>
          <div v-for="sale in filteredSales" :key="sale.id">
            <p>{{ getItemName(sale.id) }} x {{ sale.qty }} - ${{ getItemTotal(sale.id) }}</p>
          </div>
          <p class="font-bold mt-4">Subtotal: ${{ subtotal }}</p>
          <div class="flex gap-4 mt-4 justify-center">
            <label><input type="radio" v-model="paymentMethod" value="cash" /> Cash</label>
            <label><input type="radio" v-model="paymentMethod" value="card" /> Card</label>
          </div>
          <div class="mt-6 flex justify-between">
            <button class="btn btn-error" @click="cartOpen = false">Cancel</button>
            <button class="btn btn-success" @click="submitSale">✅ Submit Sale</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSalesStore } from '@/stores/salesStore';
import { useTourStore } from '@/stores/tour';
import { useInventoryStore } from '@/stores/inventory';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';


const salesStore = useSalesStore();
const tourStore = useTourStore();
const inventoryStore = useInventoryStore();
const route = useRoute();

const tourId = route.query.tour_id || null;
const showId = route.params.id;

const { inventory } = storeToRefs(inventoryStore);

const sales = ref({});
const paymentMethod = ref('cash');
const cartOpen = ref(false);
const showVenue = ref('');
const showDate = ref('');
const softExpanded = ref(true);
const hardExpanded = ref(true);
const successMessage = ref('');
const collapsedRows = ref({});

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

onMounted(async () => {
  const storedState = localStorage.getItem('collapsedRows');
  if (storedState) {
    collapsedRows.value = JSON.parse(storedState);
  }
  if (!tourId) {
    console.error('🚨 No tourId found in query params');
  } else {
    await Promise.all([inventoryStore.fetchInventory(tourId), salesStore.fetchSales(showId), fetchShowDetails()]);
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
    grouped[item.name].push({
      id: item.id,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    });
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));
  });

  return grouped;
});

const subtotal = computed(() => {
  return filteredSales.value
    .reduce((sum, sale) => {
      const item = [...hardItems.value, ...softItems.value].find(
        (i) => Number(i.id) === Number(sale.id)
      );
      return sum + (item ? sale.qty * item.price : 0);
    }, 0)
    .toFixed(2);
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
  const details = await tourStore.getShowDetails(showId);
  if(details) {
    showVenue.value = details.venue,
    showDate.value = details.showDate
  }
};

const getItemName = (id) => {
  const item = [...hardItems.value, ...softItems.value].find((i) => Number(i.id) === Number(id));
  if (!item) return 'Unknown';
  return item.type === 'soft' ? `${item.name} (${item.size})` : item.name;
};

const getItemTotal = (id) => {
  const item = [...hardItems.value, ...softItems.value].find(
    (item) => Number(item.id) === Number(id)
  );
  return item && sales.value[id] ? (sales.value[id] * item.price).toFixed(2) : '0.00';
};

const submitSale = async () => {
  for (const [id, qty] of Object.entries(sales.value)) {
    if (qty > 0) {
      const item = [...hardItems.value, ...softItems.value].find((i) => i.id === Number(id));
      if (item) {
        await salesStore.addSale(item.id, showId, qty, qty * item.price, paymentMethod.value);
      }
    }
  }

  sales.value = {};
  cartOpen.value = false;

  successMessage.value = '✅💰 Sale Recorded Successfully! 💰✅';

  setTimeout(() => {
    successMessage.value = '';
  }, 2000);

  await salesStore.fetchSales(showId);
};

const openCart = () => {
  cartOpen.value = true;
};

const clearAll = () => {
  Object.keys(sales.value).forEach((id) => {
    sales.value[id] = 'Qty';
  });
};

const toggleCollapse = (itemKey) => {
  collapsedRows.value[itemKey] = !collapsedRows.value[itemKey];
  localStorage.setItem('collapsedRows', JSON.stringify(collapsedRows.value));
};
</script>