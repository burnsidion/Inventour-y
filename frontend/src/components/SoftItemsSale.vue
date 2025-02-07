<template>
  <div>
    <div class="flex flex-col mb-2">
      <h2 class="text-xl font-semibold mb-4 text-center">👕 Soft Items</h2>
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
              :key="`${itemName}-${size.size}`"
              v-model.number="sales[`${size.id}-${size.size}`]"
              type="number"
              class="border rounded py-1 px-3 w-[80px] text-center text-sm min-h-[40px]"
              min="0"
              placeholder="Qty"
              @input="emitQuantityChange"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, defineEmits } from 'vue';
import { useSalesStore } from '@/stores/salesStore';
import { useInventoryStore } from '@/stores/inventory';
import { storeToRefs } from 'pinia';

const expanded = ref(true);
const collapsedRows = ref({});

const salesStore = useSalesStore();
const inventoryStore = useInventoryStore();
const { inventory } = storeToRefs(inventoryStore);

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const emit = defineEmits(['quantity-updated']);

const sales = computed(() => salesStore.sales);
const softItems = computed(() => inventory.value.filter((item) => item.type === 'soft'));

const groupedSoftItems = computed(() => {
  const grouped = {};

  softItems.value.forEach((item) => {
    if (!grouped[item.name]) {
      grouped[item.name] = [];
    }

    if (Array.isArray(item.sizes)) {
      item.sizes.forEach((sizeObj) => {
        grouped[item.name].push({
          id: `${item.id}-${sizeObj.size}`,
          name: item.name,
          size: sizeObj.size,
          quantity: sizeObj.quantity,
          price: item.price,
        });
      });
    }
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));
  });

  return grouped;
});

const toggleCollapse = (itemKey) => {
  collapsedRows.value[itemKey] = !collapsedRows.value[itemKey];
  localStorage.setItem('collapsedRows', JSON.stringify(collapsedRows.value));
};

const emitQuantityChange = () => {
  emit('quantity-updated');
};

onMounted(() => {
  const storedState = localStorage.getItem('collapsedRows');
  if (storedState) {
    collapsedRows.value = JSON.parse(storedState);
  }
});
</script>