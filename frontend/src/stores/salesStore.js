import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export const useSalesStore = defineStore('sales', () => {
  const authStore = useAuthStore();
  const sales = ref([]);
  const totalSales = ref(0);
  const cashSales = ref(0);
  const cardSales = ref(0);

  const fetchSales = async (tourId) => {
    if (!tourId) {
      console.error('🚨 fetchSales called without tourId');
      return;
    }

    try {
      const token = authStore.token;
      const response = await axios.get(`http://localhost:5002/api/sales?tour_id=${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      sales.value = response.data;
      calculateTotals();
    } catch (error) {
      console.error('Error fetching sales:', error.response?.data || error.message);
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

  const addSale = async (inventory_id, quantity_sold, total_amount, payment_method) => {
    try {
      const token = authStore.token;
      const response = await axios.post(
        'http://localhost:5002/api/sales',
        { inventory_id, quantity_sold, total_amount, payment_method },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      sales.value.push(response.data.sale);
      calculateTotals();
    } catch (error) {
      console.error('Error recording sale:', error.response?.data || error.message);
    }
  };

  return { sales, totalSales, cashSales, cardSales, fetchSales, addSale };
});
