<template>
  <div class="min-h-screen flex flex-col items-center p-6 bg-primary">
    <!-- Profile Header -->
    <div class="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 text-center">
      <div class="flex flex-col items-center">
        <!-- Profile Picture -->
        <img
          :src="previewImage"
          alt="Profile"
          class="w-24 h-24 rounded-full object-cover border-4 border-gray-300"
        />

        <!-- Upload Button -->
        <input
          type="file"
          @change="handleFileUpload"
          accept="image/*"
          class="mt-2 hidden"
          ref="fileInput"
        />
        <button @click="fileInput.click()" class="text-blue-500 mt-2">📸 Upload Photo</button>

        <!-- Save & Cancel Buttons -->
        <button
          v-if="editing.profilePic"
          @click="saveEdit('profilePic')"
          class="text-green-500 mt-2"
        >
          ✅ Save
        </button>
        <button
          v-if="editing.profilePic"
          @click="cancelEdit('profilePic')"
          class="text-red-500 mt-2"
        >
          ❌ Cancel
        </button>

        <!-- Username -->
        <div class="mt-4 flex items-center gap-2">
          <input
            v-if="editing.username"
            v-model="userName"
            class="border border-gray-300 rounded px-3 py-1 text-center"
          />
          <h1 v-else class="text-2xl font-semibold text-[#393f4d]">{{ userName }}</h1>

          <button v-if="!editing.username" @click="toggleEdit('username')" class="text-blue-500">
            ✏ Edit
          </button>
          <button v-if="editing.username" @click="saveEdit('username')" class="text-green-500">
            ✅ Save
          </button>
          <button v-if="editing.username" @click="cancelEdit('username')" class="text-red-500">
            ❌ Cancel
          </button>
        </div>
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
        <div class="flex gap-2">
          <button v-if="editing.bio" @click="saveEdit('bio')" class="btn-primary mt-3">
            ✅ Save
          </button>
          <button v-if="editing.bio" @click="cancelEdit('bio')" class="text-red-500 mt-3">
            ❌ Cancel
          </button>
        </div>
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
          <button @click="saveEdit('bands')" class="btn-primary mt-3">✅ Save</button>
          <button @click="cancelEdit('bands')" class="text-red-500 mt-3">❌ Cancel</button>
        </div>
      </div>

      <!-- Past Tours Section -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-700">Tours</h2>
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
          <button @click="saveEdit('tours')" class="btn-primary mt-3">✅ Save</button>
          <button @click="cancelEdit('tours')" class="text-red-500 mt-3">❌ Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTourStore } from '@/stores/tour';
import axios from 'axios';

const authStore = useAuthStore();
const tourStore = useTourStore();

const userName = ref('');
const userEmail = ref('');
const profilePic = ref('https://via.placeholder.com/100');
const bio = ref('');
const currentValues = ref({});
const pastTours = ref(['Tour A - 2023', 'Tour B - 2022']);
const selectedFile = ref(null);
const fileInput = ref(null);

const editing = ref({
  bio: false,
  username: false,
  profilePic: false,
});

const previewImage = computed(() => {
  return selectedFile.value
    ? URL.createObjectURL(selectedFile.value)
    : getProfilePicUrl(authStore.user?.profile_pic);
});

const toggleEdit = (section) => {
  if (!editing.value[section]) {
    if (section === 'profilePic') {
      currentValues.value.profilePic = profilePic.value;
    } else if (section === 'username') {
      currentValues.value.username = userName.value.trim();
    } else if (section === 'bio') {
      currentValues.value.bio = bio.value;
    }
  }

  editing.value[section] = !editing.value[section];
};

const cancelEdit = (section) => {
  if (currentValues.value[section] !== undefined) {
    if (section === 'profilePic') {
      profilePic.value = currentValues.value[section];
      selectedFile.value = null;
    } else if (section === 'username') {
      userName.value = currentValues.value[section];
    } else if (section === 'bio') {
      bio.value = currentValues.value[section];
    }
  }
  editing.value[section] = false;
};

const saveEdit = async (section) => {
  try {
    if (section === 'username') {
      await authStore.updateUsername(userName.value);
    } else if (section === 'bio') {
      await authStore.updateBio(bio.value);
    } else if (section === 'profilePic') {
      await saveProfilePic();
    }
    editing.value[section] = false;
  } catch (error) {
    console.error(`Failed to update ${section}:`, error);
    alert(`Could not update ${section}. Try again.`);
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePic.value = e.target.result;
    };
    reader.readAsDataURL(file);
    toggleEdit('profilePic');
  }
};

const saveProfilePic = async () => {
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append('profilePic', selectedFile.value);

  try {
    const response = await axios.put('http://localhost:5002/api/users', formData, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': undefined,
      },
    });

    profilePic.value = response.data.user.profile_pic;
    selectedFile.value = null;

    authStore.user.profile_pic = response.data.user.profile_pic;
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    alert('Could not update profile picture. Try again.');
  }
};

const getProfilePicUrl = (path) => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value);
  }
  return path && path.startsWith('/uploads')
    ? `http://localhost:5002${path}`
    : 'https://via.placeholder.com/100';
};

onMounted(async () => {
  await authStore.fetchUserData();
  userName.value = authStore.user?.name || 'Unknown User';
  userEmail.value = authStore.user?.email || 'No email found';
  profilePic.value = authStore.user?.profile_pic || 'https://via.placeholder.com/100';
  bio.value = authStore.user?.bio || '';
  await tourStore.fetchTours();
  pastTours.value = tourStore.tours.filter((tour) => tour.user_id === authStore.user.id);
});
</script>