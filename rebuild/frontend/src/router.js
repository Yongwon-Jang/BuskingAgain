import { createRouter, createWebHistory } from 'vue-router';
import store from './store';
import BuskingListView from './views/BuskingListView.vue';
import LoginView from './views/LoginView.vue';
import SignupView from './views/SignupView.vue';
import CreateBuskingView from './views/CreateBuskingView.vue';
import BuskingRoomView from './views/BuskingRoomView.vue';
import MyPageView from './views/MyPageView.vue';

const routes = [
  { path: '/', name: 'home', component: BuskingListView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/buskings/new', name: 'create', component: CreateBuskingView, meta: { auth: true } },
  { path: '/buskings/:id', name: 'room', component: BuskingRoomView, props: true },
  { path: '/me', name: 'me', component: MyPageView, meta: { auth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

// Pages that need login redirect to /login and come back afterwards
router.beforeEach((to) => {
  if (to.meta.auth && !store.getters.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
});

export default router;
