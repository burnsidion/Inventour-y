<template>
  <div v-if="isLoading" class="flex justify-center">
    <p>Loading...</p>
  </div>

  <div v-else-if="summary" class="flex flex-col justify-center items-center gap-2">
    <button v-if="isSingleShowPage" @click="exportPDF" class="btn btn-primary w-[155px]">
      📄 Export to PDF
    </button>
    <div ref="summaryCard" class="bg-ivory p-4 rounded shadow text-[#393f4d] max-w-[800px]">
      <!-- Top Section: Venue & Date -->
      <div class="flex justify-between mb-2 border-b-2 border-[#393f4d] sales-summary">
        <h2 class="text-xl font-bold">{{ summary.venue }}</h2>
        <h3 class="text-xl">{{ formatDate(summary.date) }}</h3>
      </div>

      <!-- Top Section: Sales Overview -->
      <div
        class="grid grid-cols-2 md:flex md:justify-between border-b-2 border-[#393f4d] gap-4 text-center md:text-left sales-summary"
      >
        <p><strong>Total Sales:</strong> ${{ summary.total_sales }}</p>
        <p><strong>Total Cash:</strong> ${{ summary.total_cash }}</p>
        <p><strong>Total Card:</strong> ${{ summary.total_card }}</p>
        <p class="mb-2"><strong>Total Purchases:</strong> {{ summary.total_transactions }}</p>
      </div>

      <!-- Bottom Section: Items Layout -->
      <div class="flex flex-col md:flex-row-reverse justify-between mt-4 gap-6 items-summary">
        <div class="w-1/2">
          <h2 class="text-xl font-semibold text-center md:text-left">Best Selling Items (Top 3)</h2>
          <ul class="text-center md:text-left">
            <li v-for="item in summary.best_selling_items" :key="item.name">
              {{ item.name }} - {{ item.total_sold }} sold
            </li>
          </ul>
        </div>
        <div class="w-1/2">
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
import { ref, watchEffect, computed } from 'vue';
import { useShowSummariesStore } from '@/stores/showSummariesStore';
import { useRoute } from 'vue-router';
import printJS from 'print-js';

const props = defineProps({ showId: Number });
const showSummariesStore = useShowSummariesStore();
const route = useRoute();
const isLoading = ref(true);
const summary = ref(null);
const summaryCard = ref(null);

const isSingleShowPage = computed(
  () => route.path.startsWith('/shows/') && route.path.endsWith('/summary')
);

watchEffect(async () => {
  if (props.showId) {
    summary.value = await showSummariesStore.fetchShowSummary(props.showId);
    isLoading.value = false;
  }
});

const exportPDF = () => {
  if (summaryCard.value) {
    printJS({
      printable: summaryCard.value.innerHTML,
      type: 'raw-html',
      style: `
        body { font-family: Arial, sans-serif; font-size: 12px; }

        /* Ensure Top Sales Summary is in a Single Line */
        .sales-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          padding-bottom: 5px;
          margin-bottom: 10px;
          border-bottom: 2px solid #393f4d;
        }

        /* Ensure Bottom Section is Two Equal Columns with Swapped Order */
        .items-summary {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 20px;
          flex-direction: row-reverse; /* Swaps the order for the PDF */
        }

        .items-summary div {
          width: 48%;
        }

        /* Styling for headers */
        h2 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        /* Lists */
        ul {
          padding-left: 20px;
          margin-top: 5px;
        }

        /* Bold text */
        strong {
          font-weight: bold;
        }
      `,
      documentTitle: `Show-Summary-${summary.value.venue}-${formatDate(summary.value.date)}`,
    });
  }
};

const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
</script>