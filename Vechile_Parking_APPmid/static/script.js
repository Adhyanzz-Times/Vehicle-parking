// File: script.js
import Home from './component/Home.js';
import Login from './component/Login.js';
import Register from './component/Register.js';
import AdminDashboard from './component/AdminDashboard.js';
import AdminHome from './component/AdminHome.js';
import AdminUsers from './component/AdminUsers.js';
import AdminHistory from './component/AdminHistory.js';
import AdminOngoing from './component/AdminOngoing.js';
import AdminAnalytics from './component/AdminAnalytics.js';

import CustomerDashboard from './component/CustomerDashboard.js';
import CustomerHome from './component/CustomerHome.js';
import CustomerHistory from './component/CustomerHistory.js';
import CustomerOngoing from './component/CustomerOngoing.js';
import CustomerProfile from './component/CustomerProfile.js';

import Navbar from './component/Navbar.js';
import Footer from './component/Footer.js';

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/admindashboard',
    component: AdminDashboard,
    children: [
      { path: 'home', component: AdminHome },
      { path: 'users', component: AdminUsers },
      { path: 'history', component: AdminHistory },
      { path: 'ongoing', component: AdminOngoing },
      { path: 'analytics', component: AdminAnalytics },
      { path: '', redirect: 'home' }
    ]
  },
  {
    path: '/customerdashboard',
    component: CustomerDashboard,
    children: [
      { path: '', redirect: 'home' }, // Default to home
      { path: 'home', component: CustomerHome },
      { path: 'history', component: CustomerHistory },
      { path: 'ongoing', component: CustomerOngoing },
      { path: 'profile', component: CustomerProfile },
    ]
  },
];

const router = new VueRouter({
  routes
});

const app = new Vue({
  el: '#app',
  router,
  template: `
    <div class="d-flex flex-column min-vh-100">
      <nav-bar></nav-bar>
      <div class="flex-grow-1">
        <router-view></router-view>
      </div>
      <foot></foot>
    </div>
  `,
  components: {
    'nav-bar': Navbar,
    'foot': Footer
  }
});