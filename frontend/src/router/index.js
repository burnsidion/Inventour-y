import { createRouter, createWebHistory } from 'vue-router';
import SignupView from '@/views/SignupView.vue';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import TourForm from '@/components/TourForm.vue';
import ShowView from '@/views/ShowView.vue';
import CreateShowView from '@/views/CreateShowView.vue';
import InventoryView from '@/views/InventoryView.vue';
import InventoryForm from '@/components/InventoryForm.vue';
import ProfileView from '@/views/ProfileView.vue';
import ShowSummaryView from '@/views/ShowSummaryView.vue';
import ClosedShowsView from '@/views/ClosedShowsView.vue';

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
      path: '/profile',
      name: 'ProfileView',
      component: ProfileView,
    },
    {
      path: '/tours/create',
      name: 'CreateTour',
      component: TourForm,
    },
    {
      path: '/tours/:id/edit',
      name: 'EditTour',
      component: TourForm,
      props: true,
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
      props: true,
    },
    {
      path: '/tours/:id/inventory',
      name: 'InventoryView',
      component: InventoryView,
      props: true,
    },
    {
      path: '/inventory/add',
      name: 'AddInventory',
      component: InventoryForm,
    },
    {
      path: '/shows/closed',
      name: 'ClosedShowsView',
      component: ClosedShowsView,
    },
    {
      path: '/shows/:id/summary',
      name: 'ShowSummaryView',
      component: ShowSummaryView,
    },
  ],
});

export default router;
