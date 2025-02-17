<template>
  <div>
    <div class="flex flex-col mb-2">
      <h2 class="text-xl font-semibold mb-4 text-center">Soft Items</h2>
      <button @click="expanded = !expanded" class="text-sm text-blue-500 mb-2">
        {{ expanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <Transition name="fade">
      <div v-if="expanded">
        <!-- Table Header (4 Columns) -->
        <div class="grid grid-cols-4 gap-4 text-ivory border-b pb-2 font-bold text-center">
          <span></span>
          <!-- Collapse Button Column -->
          <span>Item</span>
          <span>Sizes</span>
          <span>Sold</span>
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
              class="w-4 h-4 flex items-center py-4 px-4 justify-center rounded bg-gray-700 text-white text-lg"
            >
              {{ collapsedRows[itemName] ? '+' : '-' }}
            </button>
          </div>

          <!-- Item Name & Price -->
          <div class="font-semibold text-md text-center">
            {{ itemName }} ${{ sizes.length > 0 ? sizes[0].price : 'N/A' }}
          </div>

          <!-- Sizes Column -->
          <div
            v-if="!collapsedRows[itemName]"
            class="w-sales-input flex flex-col gap-2 items-center"
          >
            <span
              v-for="size in sizes"
              :key="size.id"
              class="bg-gray-700 px-1 py-1 rounded text-center content-center text-sm sm:text-xs w-16 md:w-16 lg:w-20 min-h-[40px] whitespace-nowrap"
              :class="lowStockAlert(size.quantity) ? 'text-red-600 animate-pulse' : ''"
            >
              {{ size.size }} ({{ size.quantity }})
            </span>
          </div>

          <!-- Sold Quantity Inputs -->
          <div
            v-if="!collapsedRows[itemName]"
            class="flex flex-col gap-2 items-center w-sales-input"
          >
            <input
              v-for="size in sizes"
              :key="`${itemName}-${size.size}`"
              :value="getSaleQuantity(size.id, size.size)"
              @input="
                updateTransaction(size.id, size.size, itemName, size.price, $event.target.value)
              "
              type="number"
              class="w-sales-input md:w-9 lg:w-20 border rounded py-1 text-center text-sm min-h-[40px]"
              min="0"
              placeholder="Qty"
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

const props = defineProps({
  softItems: Array,
});

const salesStore = useSalesStore();
const expanded = ref(true);
const collapsedRows = ref({});

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const groupedSoftItems = computed(() => {
  const grouped = {};

  props.softItems.forEach((item) => {
    if (!grouped[item.name]) {
      grouped[item.name] = [];
    }

    if (Array.isArray(item.sizes)) {
      item.sizes.forEach((sizeObj) => {
        grouped[item.name].push({
          id: item.id,
          name: item.name,
          size: sizeObj.size,
          quantity: sizeObj.quantity,
          price: Number(item.price),
        });
      });
    }
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));
  });
  return grouped;
});

const getSaleQuantity = (id, size) => {
  return salesStore.transactionSales[id]?.sizes?.[size]?.quantity ?? null;
};

const toggleCollapse = (itemKey) => {
  collapsedRows.value[itemKey] = !collapsedRows.value[itemKey];
  localStorage.setItem('collapsedRows', JSON.stringify(collapsedRows.value));
};

const updateTransaction = (id, size, itemName, price, quantity) => {
  if (!salesStore.transactionSales[id]) {
    salesStore.transactionSales[id] = {
      id,
      name: itemName,
      price,
      sizes: {},
    };
  }

  if (!salesStore.transactionSales[id].sizes[size]) {
    salesStore.transactionSales[id].sizes[size] = { quantity: 0 };
  }

  salesStore.transactionSales[id].sizes[size].quantity = Number(quantity) || 0;
};

const lowStockAlert = (quantity) => {
  return quantity < 30;
};
</script>