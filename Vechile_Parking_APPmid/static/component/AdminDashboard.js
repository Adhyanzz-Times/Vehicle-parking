// File: AdminDashboard.vue
export default {
  template: `
    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar -->
        <nav class="col-md-3 col-lg-2 d-md-block sidebar" style="background: linear-gradient(180deg, #2c3e50, #34495e); min-height: 100vh;">
          <div class="position-sticky pt-3">
            <h4 class="text-white text-center mb-4 fw-bold" style="letter-spacing: 1px;">Vehicle Parking Admin</h4>
            <ul class="nav flex-column">
              <li class="nav-item">
                <router-link class="nav-link text-white py-2 px-3 rounded" to="/admindashboard/home" active-class="active-link">
                  <i class="bi bi-house-door me-2"></i>Home
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link text-white py-2 px-3 rounded" to="/admindashboard/users" active-class="active-link">
                  <i class="bi bi-people me-2"></i>Users
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link text-white py-2 px-3 rounded" to="/admindashboard/history" active-class="active-link">
                  History
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link text-white py-2 px-3 rounded" to="/admindashboard/ongoing" active-class="active-link">
                  Ongoing
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link text-white py-2 px-3 rounded" to="/admindashboard/analytics" active-class="active-link">
                  <i class="bi bi-bar-chart me-2"></i>Analytics
                </router-link>
              </li>
              <li class="nav-item mt-3">
                <button class="nav-link w-100 text-start py-2 px-3 rounded btn-logout" @click="logout">
                  <i class="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 mt-3">
          <router-view></router-view>
        </main>
      </div>
    </div>
  `,
  methods: {
    async logout() {
      try {
        await fetch('/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authentication-Token': localStorage.getItem('authToken') || ''
          }
        });
        localStorage.clear();
        this.$router.push('/login');
      } catch (error) {
        console.error('Logout Error:', error);
        alert('Failed to logout');
      }
    }
  }
};