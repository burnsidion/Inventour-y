<template>
  <div class="min-h-screen flex flex-col items-center p-6 bg-primary">
    <!-- Profile Header -->
    <div class="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 text-center">
      <div class="flex flex-col items-center">
        <img
          :src="profilePic"
          alt="Profile"
          class="w-24 h-24 rounded-full object-cover border-4 border-gray-300"
        />
        <h1 class="text-2xl font-semibold mt-4 text-[#393f4d]">{{ userName }}</h1>
      </div>
    </div>

    <!-- Profile Sections -->
    <div class="w-full max-w-3xl mt-6 space-y-6">
      <!-- Bio Section -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-700">About Me</h2>
          <button @click="toggleEdit('bio')" class="text-blue-500">✏ Edit</button>
        </div>
        <textarea
          v-if="editing.bio"
          v-model="bio"
          class="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <p v-else class="mt-2 text-gray-600">{{ bio || 'No bio available' }}</p>
        <button v-if="editing.bio" @click="saveBio" class="btn-primary mt-3">Save</button>
      </div>

      <!-- Bands Worked With Section -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-700">Bands Worked With</h2>
        </div>
        <ul v-if="!editing.bands" class="mt-2 space-y-2">
          <li v-for="(tour, index) in pastTours" :key="index" class="p-2 bg-gray-200 rounded-lg">
            {{ tour.band_name }}
          </li>
        </ul>
        <div v-else>
          <div class="flex gap-2 mt-2">
            <input v-model="newBand" placeholder="Add a band..." class="input" />
            <button @click="addBand" class="btn-primary">+</button>
          </div>
          <ul class="mt-3 space-y-2">
            <li
              v-for="(band, index) in bands"
              :key="index"
              class="flex justify-between items-center p-2 bg-gray-200 rounded-lg"
            >
              <span>{{ band }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Past Tours Section -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-700">Past Tours</h2>
        </div>
        <ul v-if="!editing.tours" class="mt-2 space-y-2">
          <li v-for="(tour, index) in pastTours" :key="index" class="p-2 bg-gray-200 rounded-lg">
            {{ tour.name }}
          </li>
        </ul>
        <div v-else>
          <div class="flex gap-2 mt-2">
            <input v-model="newTour" placeholder="Add a tour..." class="input" />
            <button @click="addTour" class="btn-primary">+</button>
          </div>
          <ul class="mt-3 space-y-2">
            <li
              v-for="(tour, index) in pastTours"
              :key="index"
              class="flex justify-between items-center p-2 bg-gray-200 rounded-lg"
            >
              <span>{{ tour }}</span>
              <button @click="removeTour(index)" class="text-red-500 hover:text-red-700">✖</button>
            </li>
          </ul>
          <button @click="saveTours" class="btn-primary mt-3">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTourStore } from '@/stores/tour';

const authStore = useAuthStore();
const tourStore = useTourStore();

const userName = ref('');
const userEmail = ref('');

const profilePic = ref('https://via.placeholder.com/100');
const bio = ref('');
const pastTours = ref(['Tour A - 2023', 'Tour B - 2022']);

const editing = ref({
  bio: false,
});

const toggleEdit = (section) => {
  editing.value[section] = !editing.value[section];
};

const saveBio = () => {
  console.log('Bio saved:', bio.value);
  toggleEdit('bio');
};


onMounted(async () => {
  if (!authStore.user) {
    console.warn('Fetching user data as user is not set in authStore.');
    await authStore.fetchUserData();

    if (!authStore.user) {
      console.error('❌ User data still not found after fetching.');
    }
  }

  if (authStore.user) {
    userName.value = authStore.user.name || 'Unknown User';
    userEmail.value = authStore.user.email || 'No email found';
    await tourStore.fetchTours();

    pastTours.value = tourStore.tours.filter((tour) => tour.user_id === authStore.user.id);
  }
});
</script>