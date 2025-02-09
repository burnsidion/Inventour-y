<template>
  <div>
    <div class="flex flex-col mb-2">
      <h2 class="text-xl font-semibold mb-4 text-center">🎸 Hard Items</h2>
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
          v-for="item in hardItems"
          :key="item.id"
          class="grid grid-cols-4 gap-4 border-b py-2 items-center text-center"
        >
          <span class="whitespace-nowrap text-left">{{ item.name }}</span>
          <span :class="lowStockAlert(item.quantity) ? 'text-red-600 animate-pulse' : ''">{{
            item.quantity
          }}</span>
          <span>${{ formattedPrice(item.price) }}</span>
          <div class="flex justify-center">
            <input
              type="number"
              class="border rounded py-1 px-3 w-full lg:w-[50%] text-center text-sm"
              :value="getSaleQuantity(item.id)"
              @input="updateSale(item.id, item.name, item.price, $event.target.value)"
              min="0"
              :placeholder="getSalePlaceholder(item.id)"
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
  hardItems: Array,
});

const expanded = ref(true);

const getSaleQuantity = computed(() => {
  return (id) => salesStore.transactionSales[id]?.quantity ?? null;
});

const getSalePlaceholder = computed(() => {
  return (id) => (salesStore.transactionSales[id] === undefined ? 'Qty' : '');
});

const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const updateSale = (id, name, price, quantity) => {
  if (!salesStore.transactionSales[id]) {
    salesStore.transactionSales[id] = {
      id,
      name,
      price: parseFloat(price).toFixed(2),
      quantity: 0,
    };
  }

  salesStore.transactionSales[id].quantity = Number(quantity) || 0;
};

const lowStockAlert = (quantity) => {
  return quantity < 30;
};
</script>
