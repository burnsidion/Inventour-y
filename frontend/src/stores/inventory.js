import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useInventoryStore = defineStore('inventory', () => {
  const authStore = useAuthStore();
  const inventory = ref([]);

  const fetchInventory = async (tourId) => {
    try {
      const token = authStore.token;
      const response = await axios.get(`http://localhost:5002/api/inventory?tour_id=${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      inventory.value = response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = authStore.token;
      await axios.delete(`http://localhost:5002/api/inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      inventory.value = inventory.value.filter((item) => item.id !== itemId);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };

  return {
    inventory,
    fetchInventory,
    deleteItem,
  };
});
