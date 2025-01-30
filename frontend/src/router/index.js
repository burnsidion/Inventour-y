import { createRouter, createWebHistory } from 'vue-router'
import SignupView from '@/views/SignupView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import CreateTour from '@/components/CreateTour.vue'
import ShowView from '@/views/ShowView.vue'
import CreateShowView from '@/views/CreateShowView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/signup',
      name: 'Signup',
      component: SignupView,
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/create-tour',
      name: 'CreateTour',
      component: CreateTour,
    },
    {
      path: '/shows/create',
      name: 'CreateShow',
      component: CreateShowView,
    },
    {
      path: '/shows/:id',
      name: 'ShowDetails',
      component: ShowView,
    },
  ],
})

export default router
