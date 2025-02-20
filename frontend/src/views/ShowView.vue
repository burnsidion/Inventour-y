<template>
  <div class="p-6">
    <!-- Show Header -->
    <h1 class="text-3xl font-bold mb-4 text-center">📊 Sales Tracker for {{ showVenue }}</h1>
    <p class="text-ivory-600 mb-6 text-center">{{ formatShowDate(showDate) }}</p>

    <!-- Button Container -->
    <div
      class="flex flex-col sm:flex-row gap-4 mb-4 justify-center sm:justify-center content-center items-center"
    >
      <router-link to="/" class="btn btn-primary"> ← Back to Home Page </router-link>

      <button class="btn btn-primary px-6 py-2" :disabled="!isTransactionValid" @click="openCart">
        🛒 Start Transaction
      </button>

      <button @click="clearAll()" class="btn btn-primary px-6 py-2">Clear All Quantities</button>
      <button @click="closeOutShow()" class="btn btn-primary px-6 py-2">Close Out Show</button>
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
    <div class="grid grid-cols-1 md:grid-cols-3 md:auto-cols-fr gap-2 md:gap-6 lg:gap-8">
      <HardItemsSale :hardItems="hardItems" />
      <SoftItemsSale :softItems="softItems" />
      <BundleItemsSale :bundles="bundles" />
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

          <div v-for="sale in filteredSales" :key="sale.id" class="mb-4">
            <p>
              {{ getItemName(sale.id, sale.size) }} x {{ sale.qty }} - ${{ getItemPrice(sale.id) }}
            </p>

            <!-- 🔽 Size Dropdown for Bundles with Soft Items -->
            <div v-if="sale.softItemSizes" class="mt-2">
              <label class="block text-sm font-medium text-gray-700">
                Select Size for Soft Item in Bundle:
              </label>
              <select v-model="sale.selectedSize" class="mt-1 p-2 border rounded w-full">
                <option value="" disabled selected>-- Select Size --</option>
                <option
                  v-for="size in Object.values(sale.softItemSizes).flat()"
                  :key="size.size"
                  :value="size.size"
                >
                  {{ size.size }} (Stock: {{ size.stock }})
                </option>
              </select>
            </div>
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
import { useShowSummariesStore } from '@/stores/showSummariesStore';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';

import HardItemsSale from '@/components/HardItemsSale.vue';
import SoftItemsSale from '@/components/SoftItemsSale.vue';
import BundleItemsSale from '@/components/BundleItemsSale.vue';

const salesStore = useSalesStore();
const tourStore = useTourStore();
const inventoryStore = useInventoryStore();
const showSummaryStore = useShowSummariesStore();
const route = useRoute();
const router = useRouter();

const tourId = route.query.tour_id || null;
const showId = route.params.id;

const { inventory } = storeToRefs(inventoryStore);

const paymentMethod = ref('cash');
const cartOpen = ref(false);
const showVenue = ref('');
const showDate = ref('');
const successMessage = ref('');

const hardItems = computed(() => inventory.value.filter((item) => item.type === 'hard'));
const softItems = computed(() => inventory.value.filter((item) => item.type === 'soft'));
const bundles = computed(() => inventory.value.filter((item) => item.type === 'bundle'));

onMounted(async () => {
  if (!tourId) {
    console.error('🚨 No tourId found in query params');
  } else {
    await Promise.all([
      inventoryStore.fetchInventory(tourId),
      salesStore.fetchSales(showId),
      fetchShowDetails(),
    ]);
  }
});

const hardItemsArray = computed(() => {
  return Object.values(salesStore.transactionSales)
    .filter((sale) => {
      const inventoryItem = inventory.value.find((item) => Number(item.id) === Number(sale.id));
      return inventoryItem && inventoryItem.type === 'hard';
    })
    .map((sale) => ({
      id: sale.id,
      name: sale.name || getItemName(sale.id),
      price: sale.price ? parseFloat(sale.price).toFixed(2) : getItemPrice(sale.id),
      qty: sale.quantity,
    }));
});

const softItemsArray = computed(() => {
  let softSales = [];

  Object.entries(salesStore.transactionSales).forEach(([id, sale]) => {
    if (sale.sizes) {
      Object.entries(sale.sizes).forEach(([size, sizeData]) => {
        if (sizeData.quantity > 0) {
          const inventoryItem = inventory.value.find((item) => Number(item.id) === Number(id));

          if (!inventoryItem) {
            console.warn(`⚠️ No inventory item found for ID: ${id}`);
            return;
          }

          const sizeRecord = inventoryItem.sizes.find((s) => s.size === size);

          if (!sizeRecord) {
            console.warn(`⚠️ No matching size found for ${sale.name} size ${size}`);
            return;
          }

          softSales.push({
            id: Number(id),
            name: sale.name,
            size: size,
            price: parseFloat(sale.price || getItemPrice(id)).toFixed(2),
            qty: sizeData.quantity,
            remainingStock: sizeRecord.quantity - sizeData.quantity,
          });
        }
      });
    }
  });
  return softSales;
});

const bundlesArray = computed(() => {
  let bundleSales = [];
  let softItemSizes = {};

  Object.entries(salesStore.transactionSales).forEach(([id, sale]) => {
    if (sale.quantity > 0) {
      const inventoryItem = inventory.value.find((item) => Number(item.id) === Number(id));

      if (!inventoryItem) {
        console.warn(`⚠️ No inventory item found for Bundle ID: ${id}`);
        return;
      }

      if (!inventoryItem.items || !Array.isArray(inventoryItem.items)) {
        console.warn(`⚠️ No items array found for bundle ID ${id}, skipping...`);
        return;
      }

      inventoryItem.items.forEach((bundleItem) => {
        const foundItem = inventory.value.find((item) => Number(item.id) === Number(bundleItem.id));

        if (!foundItem) {
          console.warn(`⚠️ Missing inventory item in bundle: ${bundleItem.id}`);
          return;
        }

        if (foundItem.type === 'soft') {
          softItemSizes[bundleItem.id] = foundItem.sizes.map((sizeObj) => ({
            size: sizeObj.size,
            stock: sizeObj.quantity,
          }));
        }
      });

      bundleSales.push({
        id: Number(id),
        name: inventoryItem.name,
        price: parseFloat(inventoryItem.price).toFixed(2),
        qty: sale.quantity,
        softItemSizes,
      });
    }
  });

  return bundleSales;
});

const filteredSales = computed(() => [
  ...hardItemsArray.value,
  ...softItemsArray.value,
  ...bundlesArray.value,
]);

const subtotal = computed(() => {
  return filteredSales.value.reduce((sum, sale) => sum + sale.qty * sale.price, 0).toFixed(2);
});

const isTransactionValid = computed(() => {
  return Object.values(salesStore.transactionSales).some((sale) => {
    return sale.quantity > 0 || Object.values(sale.sizes || {}).some((size) => size.quantity > 0);
  });
});

const getItemName = (id, size) => {
  const item = [...hardItems.value, ...softItems.value, ...bundles.value].find(
    (i) => Number(i.id) === Number(id)
  );

  if (!item) {
    console.warn('⚠️ Item not found for ID:', id);
    return 'Unknown';
  }

  return item.type === 'soft' ? `${item.name} (${size})` : item.name;
};

const getItemPrice = (id) => {
  const item = [...hardItems.value, ...softItems.value, ...bundles.value].find(
    (i) => Number(i.id) === Number(id)
  );
  return item ? parseFloat(item.price).toFixed(2) : '0.00';
};

const formatShowDate = (dateString) => {
  if (!dateString) return 'N/A';

  const parsedDate = new Date(dateString);
  return isNaN(parsedDate.getTime()) ? 'Invalid Date' : format(parsedDate, 'MMM dd, yyyy');
};

const fetchShowDetails = async () => {
  const details = await tourStore.getShowDetails(showId);
  if (details) {
    showVenue.value = details.venue;
    showDate.value = details.date;
  }
};

const submitSale = async () => {
  for (const sale of filteredSales.value) {
    const saleSize = sale.size || sale.selectedSize || undefined;

    await salesStore.addSale(
      sale.id,
      showId,
      sale.qty,
      sale.qty * sale.price,
      paymentMethod.value,
      saleSize
    );
  }

  salesStore.resetTransactionSales();
  cartOpen.value = false;
  successMessage.value = '✅💰 Sale Recorded Successfully! 💰✅';

  setTimeout(() => {
    successMessage.value = '';
  }, 2000);

  await Promise.all([salesStore.fetchSales(showId), inventoryStore.fetchInventory(tourId)]);
};

const openCart = () => {
  cartOpen.value = true;
};

const clearAll = () => {
  salesStore.transactionSales = {};
};

const closeOutShow = async () => {
  try {
    await showSummaryStore.closeShow(showId);
    router.push(`/shows/${showId}/summary`);
  } catch (error) {
    console.error('Error closing out show', error);
  }
};
</script>