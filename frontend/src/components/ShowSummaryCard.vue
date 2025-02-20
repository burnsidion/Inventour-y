<template>
  <div v-if="isLoading" class="flex justify-center">
    <p>Loading...</p>
  </div>

  <div v-else-if="summary" class="flex justify-center">
    <div class="bg-ivory p-4 rounded shadow text-[#393f4d] max-w-[800px]">
      <!-- Adjust Total Sales Layout for Mobile -->
      <div class="flex justify-around mb-2 border-b-2 border-[#393f4d]">
        <h2 class="text-xl font-bold">{{ summary.venue }}</h2>
        <h3 class="text-xl">{{ formatDate(summary.date) }}</h3>
      </div>
      <div
        class="grid grid-cols-2 md:flex md:justify-between border-b-2 border-[#393f4d] gap-4 text-center md:text-left"
      >
        <p><strong>Total Sales:</strong> ${{ summary.total_sales }}</p>
        <p><strong>Total Cash:</strong> ${{ summary.total_cash }}</p>
        <p><strong>Total Card:</strong> ${{ summary.total_card }}</p>
        <p class="mb-2"><strong>Total Purchases:</strong> {{ summary.total_transactions }}</p>
      </div>

      <!-- Adjust Items Layout for Mobile -->
      <div class="flex flex-col justify-between md:flex-row-reverse mt-4 gap-6">
        <div>
          <h2 class="text-xl font-semibold text-center md:text-left">Best Selling Items (Top 3)</h2>
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
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useShowSummariesStore } from '@/stores/showSummariesStore';

const props = defineProps({ showId: Number });
const showSummariesStore = useShowSummariesStore();
const isLoading = ref(true);
const summary = ref(null);

watchEffect(async () => {
  if (props.showId) {
    summary.value = await showSummariesStore.fetchShowSummary(props.showId);
    isLoading.value = false;
  }
});

const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
</script>