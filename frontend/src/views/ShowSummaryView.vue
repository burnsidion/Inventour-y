<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-semibold mb-4 text-center">Show Summary</h1>

    <div v-if="isLoading" class="flex justify-center">
      <p>Loading...</p>
    </div>

    <div v-else-if="summary">
      <div class="bg-ivory p-4 rounded shadow text-[#393f4d]">
        <!-- Adjust Total Sales Layout for Mobile -->
        <div
          class="grid grid-cols-2 md:flex md:justify-between border-b-2 border-[#393f4d] gap-4 text-center md:text-left"
        >
          <p><strong>Total Sales:</strong> ${{ summary.total_sales }}</p>
          <p><strong>Total Cash:</strong> ${{ summary.total_cash }}</p>
          <p><strong>Total Card:</strong> ${{ summary.total_card }}</p>
          <p><strong>Total Purchases:</strong> {{ summary.total_transactions }}</p>
        </div>

        <!-- Adjust Items Layout for Mobile -->
        <div class="flex flex-col justify-between md:flex-row-reverse mt-4 gap-6">
          <div>
            <h2 class="text-xl font-semibold text-center md:text-left">
              Best Selling Items (Top 3S)
            </h2>
            <ul class="text-center md:text-left">
              <li v-for="item in summary.best_selling_items" :key="item.name">
                {{ item.name }} - {{ item.total_sold }} sold
              </li>
            </ul>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-center md:text-left">All Items Sold</h2>
            <ul class="text-center md:text-left">
              <li v-for="item in summary.items_sold" :key="`${item.name}-${item.size || 'any'}`">
                {{ item.name }}
                <span v-if="item.size">({{ item.size }})</span> - {{ item.total_sold }} sold
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <p>No summary found for this show.</p>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useShowSummariesStore } from '@/stores/showSummariesStore';

const route = useRoute();
const showSummariesStore = useShowSummariesStore();
const isLoading = ref(true);
const summary = ref(null);

onMounted(async () => {
  const showId = route.params.id;
  summary.value = await showSummariesStore.fetchShowSummary(showId);
  isLoading.value = false;
});
</script>
  
  <style scoped>
.container {
  max-width: 800px;
}
</style>