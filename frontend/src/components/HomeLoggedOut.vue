<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-primary text-white">
    <h1 class="text-4xl font-bold mb-4">Welcome to Inventour-y</h1>
    <p class="text-lg mb-6">Easily track your tour’s merchandise inventory and sales.</p>

    <div class="flex space-x-4 mb-8">
      <RouterLink to="/signup" class="btn btn-primary">Sign Up</RouterLink>
      <RouterLink to="/login" class="btn btn-secondary">Log In</RouterLink>
    </div>

    <section class="w-full max-w-3xl p-6 bg-secondary rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4 text-center">How It Works</h2>

      <div class="space-y-4">
        <div class="flex items-center">
          <div class="text-3xl mr-4">📦</div>
          <p><strong>Manage Inventory:</strong> Add, update, and track your tour merchandise.</p>
        </div>

        <div class="flex items-center">
          <div class="text-3xl mr-4">📊</div>
          <p><strong>Track Sales:</strong> Log purchases and view real-time sales reports.</p>
        </div>

        <div class="flex items-center">
          <div class="text-3xl mr-4">🚀</div>
          <p>
            <strong>Stay Organized:</strong> Keep everything in one place, accessible from any
            device.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>