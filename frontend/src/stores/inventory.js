import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useInventoryStore = defineStore('inventory', () => {
  const inventory = ref([]);

  const fetchInventory = async (tourId) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      const response = await axios.get(`http://localhost:5002/api/inventory?tour_id=${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      inventory.value = response.data.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price,
        image_url: item.image_url,
        quantity: item.type === 'hard' ? item.quantity || 0 : null,
        sizes: item.type === 'soft' ? item.sizes || [] : [],
      }));
    } catch (error) {
      console.error('❌ Error fetching inventory:', error.response?.data || error);
    }
  };

  const addInventoryItem = async (newItem, tourId) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      const existingInventoryResponse = await axios.get(
        `http://localhost:5002/api/inventory?tour_id=${tourId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const duplicateItem = existingInventoryResponse.data.find(
        (item) =>
          item.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() &&
          item.type === newItem.type,
      );

      if (duplicateItem) {
        alert(
          `An item with name "${newItem.name}" already exists in inventory. Please edit the name so that this is recorded as a new item. To edit already existing inventory, press the 'edit' button on the inventory card.`,
        );
        return;
      }

      if (newItem.type === 'soft' && newItem.sizes) {
        newItem.sizes = Object.entries(newItem.sizes).map(([size, quantity]) => ({
          size,
          quantity,
        }));
      }

      const response = await axios.post('http://localhost:5002/api/inventory', newItem, {
        headers: { Authorization: `Bearer ${token}` },
      });

      inventory.value.push({
        ...response.data.inventory,
        sizes: response.data.inventory.sizes || [],
        quantity: response.data.inventory.quantity || 0,
      });

      return response.data.inventory;
    } catch (error) {
      console.error('❌ Error adding inventory:', error.response?.data || error);
    }
  };

  const updateInventoryItem = async (updatedItem) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      const response = await axios.put(
        `http://localhost:5002/api/inventory/${updatedItem.id}`,
        updatedItem,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const index = inventory.value.findIndex((item) => item.id === updatedItem.id);
      if (index !== -1) {
        inventory.value[index] = {
          ...response.data,
          sizes: response.data.sizes || [],
        };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error updating inventory:', error.response?.data || error);
    }
  };

  const deleteInventoryItem = async (itemId) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      await axios.delete(`http://localhost:5002/api/inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      inventory.value = inventory.value.filter((item) => item.id !== itemId);

      return true;
    } catch (error) {
      console.error('❌ Error deleting inventory item:', error.response?.data || error);
      return false;
    }
  };

  const editInventoryItem = async (updatedItem) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      const response = await axios.put(
        `http://localhost:5002/api/inventory/${updatedItem.id}`,
        updatedItem,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const index = inventory.value.findIndex((item) => item.id === updatedItem.id);
      if (index !== -1) {
        inventory.value[index] = {
          ...response.data,
          sizes: response.data.sizes || [],
          quantity: response.data.quantity || 0,
        };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error editing inventory item:', error.response?.data || error);
    }
  };

  const saveInventoryChanges = async (updatedData, tourId) => {
    try {
      await editInventoryItem(updatedData);
      await fetchInventory(tourId);
      return true;
    } catch (error) {
      console.error('❌ Error saving inventory changes:', error.response?.data || error);
      return false;
    }
  };

  return {
    inventory,
    fetchInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    editInventoryItem,
    saveInventoryChanges,
  };
});
