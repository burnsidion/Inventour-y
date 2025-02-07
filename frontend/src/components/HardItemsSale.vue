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
          <span :class="item.quantity < 30 ? 'text-red-600 animate-pulse' : ''">{{
            item.quantity
          }}</span>
          <span>${{ formattedPrice(item.price) }}</span>
          <div class="flex justify-center">
            <input
              type="number"
              class="border rounded py-1 px-3 w-full lg:w-[50%] text-center text-sm"
              v-model.number="salesStore.transactionSales[item.id]"
              min="0"
              placeholder="Qty"
              @input="updateSale(item.id, item.name, item.price, $event.target.value)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSalesStore } from '@/stores/salesStore';

const salesStore = useSalesStore();
defineProps({
  hardItems: Array,
});

const expanded = ref(true);

const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};
</script>

<style lang="scss" scoped>
</style>