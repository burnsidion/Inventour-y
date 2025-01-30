<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-primary text-white">
      <h1 class="text-4xl font-bold mb-4">Welcome to Inventour-y</h1>
      <p class="text-lg mb-6">Easily track your tour’s merchandise inventory and sales.</p>
      
      <div class="flex space-x-4">
        <RouterLink to="/signup" class="btn btn-primary">Sign Up</RouterLink>
        <RouterLink to="/login" class="btn btn-secondary">Log In</RouterLink>
      </div>
    </div>
  </template>