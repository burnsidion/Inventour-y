import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export const useSalesStore = defineStore('sales', () => {
  const authStore = useAuthStore();
  const sales = ref([]);
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
        sales.value = response.data;
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
    sales.value = [];
    totalSales.value = {};
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
    totalSales.value = sales.value
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
      .toFixed(2);
    cashSales.value = sales.value
      .filter((sale) => sale.payment_method === 'cash')
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
      .toFixed(2);
    cardSales.value = sales.value
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

      sales.value.push(response.data.sale);
      calculateTotals();
    } catch (error) {
      console.error('Error recording sale:', error.response?.data || error.message);
    }
  };

  return { sales, totalSales, cashSales, cardSales, fetchSales, addSale, fetchTourTotalSales };
});
