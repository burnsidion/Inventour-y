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
    if (!sales.value || !Array.isArray(sales.value)) {
      console.warn('⚠️ Sales data is empty or invalid.');
      sales.value = [];
    }

    let total = 0;
    let cash = 0;
    let card = 0;

    sales.value.forEach((sale) => {
      total += sale.total_amount;
      if (sale.payment_method === 'cash') {
        cash += sale.total_amount;
      } else if (sale.payment_method === 'card') {
        card += sale.total_amount;
      }
    });

    totalSales.value = total;
    cashSales.value = cash;
    cardSales.value = card;
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
