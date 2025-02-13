<template>
  <div class="p-6">
    <!-- Dynamic tour name -->
    <h1 class="text-3xl font-bold my-6 text-center">
      Inventory for {{ tourStore.tourName || 'Tour' }}
    </h1>

    <div class="flex flex-col sm:flex-row gap-4 mb-4 justify-center sm:justify-center">
      <!-- Back to Home Page Button -->
      <router-link to="/" class="btn btn-primary"> ← Back to Home Page </router-link>

      <!-- Add Inventory Button -->
      <router-link :to="`/inventory/add?tour_id=${route.params.id}`" class="btn btn-primary">
        ➕ Add Inventory Item
      </router-link>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <HardItems />

      <SoftItems :isLoading="isLoading" />

      <BundleItems />
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import { storeToRefs } from 'pinia';

import { useTourStore } from '@/stores/tour';

import HardItems from '@/components/HardItems.vue';
import SoftItems from '@/components/SoftItems.vue';
import BundleItems from '@/components/BundleItems.vue';

const route = useRoute();
const inventoryStore = useInventoryStore();
const tourStore = useTourStore();

const { inventory } = storeToRefs(inventoryStore);
const { fetchInventory } = inventoryStore;

const hardItemsList = ref([]);
const softItemsList = ref([]);
const isLoading = ref(true);

const tourId = route.params.id;

const hardItems = computed(() => {
  return inventory.value
    .filter((item) => item.type === 'hard')
    .map((item) => ({
      ...item,
      quantity: item.quantity || 0,
    }));
});

const softItemsGrouped = computed(() => {
  const grouped = {};

  inventory.value.forEach((item) => {
    if (item.type === 'soft') {
      if (!grouped[item.name]) {
        grouped[item.name] = {
          name: item.name,
          price: item.price,
          sizes: [],
        };
      }

      if (item.sizes && item.sizes.length > 0) {
        grouped[item.name].sizes = item.sizes.map((s) => ({
          size: s.size,
          quantity: s.quantity,
        }));
      } else {
        grouped[item.name].sizes.push({
          size: 'One Size',
          quantity: 0,
        });
      }
    }
  });

  return grouped;
});

watchEffect(() => {
  hardItemsList.value = [...hardItems.value];

  softItemsList.value = Object.values(softItemsGrouped.value).map((item) => ({
    id: inventory.value.find((i) => i.name === item.name)?.id,
    name: item.name,
    price: item.price,
    sizes: [...item.sizes],
  }));
});

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([tourStore.fetchTourDetails(route.params.id), fetchInventory(tourId)]);
  isLoading.value = false;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
