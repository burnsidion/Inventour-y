import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useInventoryStore = defineStore('inventory', () => {
  const inventory = ref([]);

  const fetchInventory = async (tourId) => {
    if (!tourId) {
      console.error('❌ Error: fetchInventory called with undefined tourId');
      return;
    }
    console.log('✅ Fetching inventory for tour:', tourId);
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      const response = await axios.get(`http://localhost:5002/api/inventory?tour_id=${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let inventoryData = response.data;

      inventory.value = inventoryData.filter((item) => !!item);
    } catch (error) {
      console.error('❌ Error fetching inventory:', error.response?.data || error);
    }
  };

  const addInventoryItem = async (newItem, tourId) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      let response;

      if (newItem.type === 'bundle') {
        response = await axios.post(
          `http://localhost:5002/api/inventory/bundles?tour_id=${tourId}`,
          newItem,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!response.data || !response.data.bundleId) {
          throw new Error('Unexpected API response for bundle creation');
        }

        const bundleId = response.data.bundleId;
        const bundleResponse = await axios.get(
          `http://localhost:5002/api/inventory/bundles/${bundleId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!bundleResponse.data || !bundleResponse.data.bundle) {
          throw new Error('Failed to retrieve newly created bundle');
        }

        const newBundle = {
          ...bundleResponse.data.bundle,
          items: bundleResponse.data.items || [],
          quantity: response.data.quantity || 0,
        };

        inventory.value.push(newBundle);
        return newBundle;
      }

      response = await axios.post(`http://localhost:5002/api/inventory`, newItem, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data || !response.data.inventory) {
        throw new Error('Unexpected API response for inventory creation');
      }

      const newInventoryItem = {
        ...response.data.inventory,
        sizes: response.data.inventory.sizes || [],
        quantity: response.data.inventory.quantity || 0,
      };

      inventory.value.push(newInventoryItem);
      return newInventoryItem;
    } catch (error) {
      console.error('❌ Error adding inventory:', error.response?.data || error);
      return null;
    }
  };

  const updateInventoryItem = async (updatedItem) => {
    if (!updatedItem || !updatedItem.id) {
      console.warn('🚨 Invalid update request, missing item ID');
      return false;
    }

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
      console.error('❌ ERROR UPDATING INVENTORY:', error.response?.data || error);
      return false;
    }
  };

  const deleteInventoryItem = async (itemId) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token;

      const response = await axios.delete(`http://localhost:5002/api/inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status !== 200) {
        console.error(`❌ DELETE request failed with status: ${response.status}`);
        return false;
      }

      inventory.value = inventory.value.filter((item) => item.id !== itemId);

      return true;
    } catch (error) {
      console.error(`❌ ERROR deleting inventory item ${itemId}:`, error.response?.data || error);
      return false;
    }
  };

  const saveInventoryChanges = async (updatedData, tourId) => {
    if (!updatedData || !updatedData.id) {
      console.warn('Skipping saveInventoryChanges: No valid updatedData');
      return false;
    }

    const existingItem = inventory.value.find((item) => item.id === updatedData.id);
    if (!existingItem) {
      console.warn(`🚨 Skipping update: item ${updatedData.id} was deleted.`);
      return false;
    }

    try {
      await updateInventoryItem(updatedData);
      await fetchInventory(tourId);
      return true;
    } catch (error) {
      console.error('❌ Error saving inventory changes:', error);
      return false;
    }
  };

  return {
    inventory,
    fetchInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    saveInventoryChanges,
  };
});
