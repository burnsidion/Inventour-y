<template>
  <div>
    <div class="flex flex-col mb-2">
      <h2 class="text-xl font-semibold mb-4 text-center">Bundles (Limit 1 per Transaction)</h2>
      <button @click="expanded = !expanded" class="text-sm text-blue-500 mb-2">
        {{ expanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>
    <Transition name="fade">
      <div v-if="expanded">
        <div class="grid grid-cols-4 gap-4 text-ivory border-b pb-2 font-bold text-center">
          <span>Item</span>
          <span>Stock</span>
          <span>Price</span>
          <span>Sold</span>
        </div>
        <div
          v-for="item in bundles"
          :key="item.id"
          class="grid grid-cols-4 gap-4 border-b py-2 items-center text-center"
        >
          <span class="text-left overflow-hidden text-ellipsis">{{ item.name }}</span>
          <span :class="lowStockAlert(item.quantity) ? 'text-red-600 animate-pulse' : ''">
            {{ item.quantity }}
          </span>
          <span>${{ formattedPrice(item.price) }}</span>
          <div class="flex justify-center">
            <input
              type="checkbox"
              class="w-5 h-5 cursor-pointer"
              :checked="getSaleQuantity(item.id) === 1"
              @change="toggleBundleSale(item.id, item.name, item.price, $event.target.checked)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSalesStore } from '@/stores/salesStore';

const salesStore = useSalesStore();

defineProps({
  bundles: {
    type: Array,
  },
});

const expanded = ref(true);

const getSaleQuantity = computed(() => {
  return (id) => salesStore.transactionSales[id]?.quantity ?? null;
});

const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const toggleBundleSale = (id, name, price, checked) => {
  if (checked) {
    salesStore.transactionSales[id] = {
      id,
      name,
      price: parseFloat(price).toFixed(2),
      quantity: 1,
    };
  } else {
    delete salesStore.transactionSales[id];
  }
};

const lowStockAlert = (quantity) => {
  return quantity < 30;
};
</script>