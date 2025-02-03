import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useInventoryStore = defineStore('inventory', () => {
  const authStore = useAuthStore();
  const inventory = ref([]);

  const fetchInventory = async (tourId) => {
    if (!tourId) {
      console.error('❌ No tour ID provided to fetchInventory.');
      return;
    }

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

  const updateSizes = (sizes, sizesSelected) => {
    const updatedSizes = { ...sizes };

    for (const size in updatedSizes) {
      if (!sizesSelected[size]) {
        delete updatedSizes[size];
      }
    }

    return updatedSizes;
  };

  const addInventoryItem = async (tourId, itemData) => {
    try {
      const token = authStore.token;

      const existingInventoryResponse = await axios.get(
        `http://localhost:5002/api/inventory?tour_id=${tourId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const duplicateItem = existingInventoryResponse.data.find(
        (item) =>
          item.name.toLowerCase().trim() === itemData.name.toLowerCase().trim() &&
          item.type === itemData.type,
      );

      if (duplicateItem) {
        alert(
          `An item with name "${itemData.name}" already exists in inventory. Please edit the name so that this is recorded as a new item. To edit already existing inventory, press the 'edit' button on the inventory card.`,
        );
        return;
      }

      await axios.post('http://localhost:5002/api/inventory', itemData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchInventory(tourId);

      return true;
    } catch (error) {
      console.error('❌ Error adding inventory:', error.response?.data || error);
      return false;
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

  const editInventoryItem = async (updatedData, tourId) => {
    if (!tourId) {
      console.log('No tour ID provided to editInventoryItem!!!');
    }
    try {
      const token = authStore.token;
      await axios.put(`http://localhost:5002/api/inventory/${updatedData.id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchInventory(tourId);
    } catch (error) {
      console.error('Error updating inventory:', error.response?.data || error);
    }
  };

  return {
    inventory,
    fetchInventory,
    deleteItem,
    addInventoryItem,
    updateSizes,
    editInventoryItem,
  };
});
