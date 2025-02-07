import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useInventoryStore } from './inventory';

export const useSalesStore = defineStore('sales', () => {
  const authStore = useAuthStore();
  const inventoryStore = useInventoryStore();
  const sales = ref([]);
  const totalSales = ref(0);
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
      sales.value.length > 0
        ? sales.value.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0).toFixed(2)
        : 0;

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

  const getItemTotal = (id, sales) => {
    const [itemId, size] = id.split('-');

    const allItems = [...inventoryStore.inventory];

    const item = allItems.find((i) => Number(i.id) === Number(itemId));

    if (!item) return '0.00';

    if (item.type === 'soft' && size) {
      const sizeEntry = item.sizes.find((s) => s.size === size);
      if (sizeEntry) {
        return sales[id] ? (sales[id] * item.price).toFixed(2) : '0.00';
      }
    }

    return sales[id] ? (sales[id] * item.price).toFixed(2) : '0.00';
  };

  const submitSale = async (salesData, showId, paymentMethod) => {
    try {
      for (const [id, qty] of Object.entries(salesData)) {
        if (qty > 0) {
          const item = [...inventoryStore.inventory].find((i) => i.id === Number(id));

          if (item) {
            await axios.post(
              'http://localhost:5002/api/sales',
              {
                inventory_id: item.id,
                show_id: showId,
                quantity_sold: qty,
                total_amount: qty * item.price,
                payment_method: paymentMethod,
              },
              { headers: { Authorization: `Bearer ${authStore.token}` } },
            );
          }
        }
      }

      sales.value = {};
      successMessage.value = '✅💰 Sale Recorded Successfully! 💰✅';

      setTimeout(() => {
        successMessage.value = '';
      }, 2000);

      await fetchSales(showId);
    } catch (error) {
      console.error('Error submitting sale:', error);
    }
  };

  const updateSale = (id, name, price, quantity) => {
    if (quantity === null || quantity === undefined || isNaN(quantity)) {
      console.error('🚨 Invalid quantity passed to updateSale:', quantity);
      return;
    }

    sales.value[id] = Number(quantity);
  };

  return {
    sales,
    totalSales,
    cashSales,
    cardSales,
    fetchSales,
    addSale,
    fetchTourTotalSales,
    getItemTotal,
    submitSale,
    updateSale,
  };
});
