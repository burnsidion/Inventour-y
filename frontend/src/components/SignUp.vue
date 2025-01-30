<template>
  <div class="flex justify-center items-center min-h-screen bg-primary">
    <div class="card w-96 bg-ivory shadow-xl p-6">
      <h2 class="text-2xl font-bold text-center text-bg-primary text-[#393f4d]">Sign Up</h2>

      <div v-if="signupSuccess" class="alert alert-success">
        Signup successful! Redirecting...
      </div>

      <SkeletonLoader v-if="loading" :rows="6" :heights="[48, 48, 48, 48, 48, 48]" :padding="50" :minHeight="400" />
      
      <form v-if="!signupSuccess && !loading" @submit.prevent="submitForm">
        <p class="text-red-500" v-if="formError">{{ formError }}</p>

        <div class="form-control mb-4">
          <label class="label"><span class="label-text">Name</span></label>
          <input v-model="name" type="text" class="input input-bordered w-full" />
          <p v-if="nameError" class="text-red-500 text-sm">{{ nameError }}</p>
        </div>

        <div class="form-control mb-4">
          <label class="label"><span class="label-text">Email</span></label>
          <input v-model="email" type="email" class="input input-bordered w-full" />
          <p v-if="emailError" class="text-red-500 text-sm">{{ emailError }}</p>
        </div>

        <div class="form-control mb-4">
          <label class="label"><span class="label-text">Password</span></label>
          <input v-model="password" type="password" class="input input-bordered w-full" />
          <p v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</p>
        </div>

        <div class="form-control mb-4">
          <label class="label"><span class="label-text">Role (optional)</span></label>
          <select v-model="role" class="select select-bordered w-full">
            <option value="user">User</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary w-full">Sign Up</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import axios from "axios";
import { useRouter } from "vue-router";

import SkeletonLoader from "./SkeletonLoader.vue";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const { handleSubmit } = useForm({ validationSchema: schema });

const { value: name, errorMessage: nameError } = useField("name");
const { value: email, errorMessage: emailError } = useField("email");
const { value: password, errorMessage: passwordError } = useField("password");

const role = "user"; 
const router = useRouter();

const signupSuccess = ref(false);
const formError = ref("");

const loading = ref(true);

const submitForm = handleSubmit(async (values) => {
  try {
    const response = await axios.post("http://localhost:5002/api/users", {
      name: values.name,
      email: values.email,
      password: values.password,
      role: role,
    });

    console.log("✅ User created:", response.data);
    signupSuccess.value = true;

    setTimeout(() => {
      router.push("/login"); 
    }, 2000);
  } catch (error) {
    console.error("🚨 Error signing up:", error.response?.data || error.message);
    formError.value = error.response?.data?.message || "Signup failed. Please try again.";
  }
});

onMounted(() => {
  setTimeout(() => {
  loading.value = false;
}, 1800);
})
</script>