import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export const useSalesStore = defineStore('sales', () => {
  const authStore = useAuthStore();
  const recordedSales = ref([]);
  const transactionSales = ref({});
  const totalSales = ref({});
  const cashSales = ref(0);
  const cardSales = ref(0);

  const fetchSales = async (showId) => {
    if (!showId) {
      console.error('🚨 fetchSales called without showId');
      return;
    }

    try {
      const token = authStore.token;
      const response = await axios.get(`http://localhost:5002/api/sales?show_id=${showId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.length > 0) {
        recordedSales.value = response.data;
        calculateTotals();
      } else {
        console.log('No sales found for this show. Resetting sales data.');
        resetSales();
      }
    } catch (error) {
      console.error('Error fetching sales:', error.response?.data || error.message);
    }
  };

  const resetSales = () => {
    recordedSales.value = [];
    totalSales.value = 0;
    cashSales.value = 0;
    cardSales.value = 0;
  };

  const fetchTourTotalSales = async (tourId) => {
    if (!tourId) {
      console.error('🚨 fetchTourTotalSales called without tourId');
      return;
    }

    try {
      const token = authStore.token;
      const response = await axios.get(`http://localhost:5002/api/sales/tour?tour_id=${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (typeof totalSales.value !== 'object' || totalSales.value === null) {
        totalSales.value = {};
      }

      totalSales.value[tourId] = Number(response.data.total_sales) || 0;
    } catch (error) {
      console.error('Error fetching total tour sales:', error.response?.data || error.message);

      if (typeof totalSales.value !== 'object' || totalSales.value === null) {
        totalSales.value = {};
      }

      totalSales.value[tourId] = 0;
    }
  };

  const calculateTotals = () => {
    totalSales.value =
      recordedSales.value.length > 0
        ? recordedSales.value
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
            .toFixed(2)
        : 0;

    cashSales.value = recordedSales.value
      .filter((sale) => sale.payment_method === 'cash')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
      .toFixed(2);

    cardSales.value = recordedSales.value
      .filter((sale) => sale.payment_method === 'card')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
      .toFixed(2);
  };

  const addSale = async (inventory_id, show_id, quantity_sold, total_amount, payment_method) => {
    try {
      const token = authStore.token;
      const response = await axios.post(
        'http://localhost:5002/api/sales',
        { inventory_id, show_id, quantity_sold, total_amount, payment_method },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      recordedSales.value.push(response.data.sale);
      calculateTotals();
    } catch (error) {
      console.error('Error recording sale:', error.response?.data || error.message);
    }
  };

  const updateTransactionSale = (id, name, price, quantity) => {
    if (quantity <= 0) {
      delete transactionSales.value[id];
    } else {
      transactionSales.value[id] = { id, name, price, quantity };
    }
  };

  const submitTransaction = async (showId, paymentMethod) => {
    try {
      const token = authStore.token;

      for (const sale of Object.values(transactionSales.value)) {
        await axios.post(
          'http://localhost:5002/api/sales',
          {
            inventory_id: sale.id,
            show_id: showId,
            quantity_sold: sale.quantity,
            total_amount: sale.quantity * sale.price,
            payment_method: paymentMethod,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      transactionSales.value = {};
      await fetchSales(showId);
    } catch (error) {
      console.error('Error submitting sales:', error);
    }
  };

  const resetTransactionSales = () => {
    transactionSales.value = {};
  };

  return {
    recordedSales,
    transactionSales,
    totalSales,
    cashSales,
    cardSales,
    fetchSales,
    addSale,
    fetchTourTotalSales,
    updateTransactionSale,
    submitTransaction,
    resetTransactionSales,
  };
});
