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
              v-model.number="sales[item.id]"
              min="0"
              placeholder="Qty"
              @input="emitQuantityChange(item)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, defineEmits } from 'vue';
import { useSalesStore } from '@/stores/salesStore';
import { useInventoryStore } from '@/stores/inventory';
import { storeToRefs } from 'pinia';

const expanded = ref(true);
const collapsedRows = ref({});

const salesStore = useSalesStore();
const inventoryStore = useInventoryStore();
const { inventory } = storeToRefs(inventoryStore);

const emit = defineEmits(['quantity-updated']);

const sales = computed(() => salesStore.sales);

const hardItems = computed(() => inventory.value.filter((item) => item.type === 'hard'));

const formattedPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) ? numPrice.toFixed(2) : 'N/A';
};

const emitQuantityChange = (item) => {
    emit('quantity-updated', item.id, item.name, item.price, sales.value[item.id] || 0);
};

onMounted(() => {
  const storedState = localStorage.getItem('collapsedRows');
  if (storedState) {
    collapsedRows.value = JSON.parse(storedState);
  }
});
</script>