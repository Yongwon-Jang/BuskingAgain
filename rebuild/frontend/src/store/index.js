import { createStore } from 'vuex';
import { api } from '../api/http';

// Global state: login token + current user.
// Screens read state from here and only render it.
export default createStore({
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') ?? 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    followGenres: (s) => s.user?.followGenres ?? [],
  },
  mutations: {
    setAuth(state, { token, user }) {
      state.token = token;
      state.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    setUser(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  actions: {
    async login({ commit }, credentials) {
      commit('setAuth', await api.login(credentials));
    },
    async logout({ commit }) {
      try { await api.logout(); } finally { commit('clearAuth'); }
    },
    async toggleFollow({ commit, getters }, genre) {
      const user = getters.followGenres.includes(genre) ? await api.unfollow(genre) : await api.follow(genre);
      commit('setUser', user);
    },
  },
});
