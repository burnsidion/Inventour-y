<template>
  <div>
    <div class="flex flex-col mb-2">
      <h2 class="text-xl font-semibold mb-4 text-center">👕 Soft Items</h2>
      <button @click="softExpanded = !softExpanded" class="text-sm text-blue-500 mb-2">
        {{ softExpanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <Transition name="fade">
      <div v-if="softExpanded">
        <!-- Table Header (4 Columns) -->
        <div class="grid grid-cols-4 gap-4 text-ivory border-b pb-2 font-bold text-center">
          <span></span>
          <!-- Collapse Button Column -->
          <span>Item</span>
          <span>Sizes</span>
          <span>Amount</span>
        </div>

        <!-- Item Rows -->
        <div
          v-for="(sizes, itemName) in groupedSoftItems"
          :key="itemName"
          class="grid grid-cols-4 gap-4 border-b py-2"
        >
          <!-- Collapse Button -->
          <div class="flex justify-center py-4">
            <button
              @click="toggleCollapse(itemName)"
              class="w-8 h-8 flex items-center py-8 px-8 justify-center rounded bg-gray-700 text-white text-lg"
            >
              {{ collapsedRows[itemName] ? '+' : '-' }}
            </button>
          </div>

          <!-- Item Name & Price -->
          <div class="font-semibold text-md text-center">
            {{ itemName }} ${{ sizes.length > 0 ? sizes[0].price : 'N/A' }}
          </div>

          <!-- Sizes Column -->
          <div v-if="!collapsedRows[itemName]" class="flex flex-col gap-2 items-center w-full">
            <span
              v-for="size in sizes"
              :key="size.id"
              class="bg-gray-700 px-1 py-1 rounded text-center content-center w-[80px] text-sm sm:text-xs lg:text-base min-h-[40px] whitespace-nowrap"
              :class="size.quantity < 30 ? 'text-red-600 animate-pulse' : ''"
            >
              {{ size.size }} ({{ size.quantity }})
            </span>
          </div>

          <!-- Sold Quantity Inputs -->
          <div v-if="!collapsedRows[itemName]" class="flex flex-col gap-2 items-center w-full">
            <input
              v-for="size in sizes"
              :key="`${itemName}-${size.size}`"
              v-model.number="sales[`${size.id}-${size.size}`]"
              type="number"
              class="border rounded py-1 px-3 w-[80px] text-center text-sm min-h-[40px]"
              min="0"
              placeholder="Qty"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>