// File: CustomerDashboard.vue
export default {
    template: `
      <div class="d-flex min-vh-100">
        <!-- Sidebar -->
        <div class="sidebar p-3" style="width: 250px; min-width: 200px; max-width: 25%; background: linear-gradient(180deg, #1abc9c, #16a085);">
          <h4 class="text-white text-center mb-4 fw-bold" style="letter-spacing: 1px;">Vehicle Parking Customer</h4>
          <ul class="nav flex-column">
            <li class="nav-item mb-2">
              <router-link class="nav-link text-white" to="/customerdashboard/home" active-class="bg-primary">
                <i class="bi bi-house-door me-2"></i>Home
              </router-link>
            </li>
            <li class="nav-item mb-2">
              <router-link class="nav-link text-white" to="/customerdashboard/history" active-class="bg-primary">
                <i class="bi bi-clock-history me-2"></i>History
              </router-link>
            </li>
            <li class="nav-item mb-2">
              <router-link class="nav-link text-white" to="/customerdashboard/ongoing" active-class="bg-primary">
                <i class="bi bi-ticket-perforated me-2"></i>Ongoing
              </router-link>
            </li>
            <li class="nav-item mb-2">
              <router-link class="nav-link text-white" to="/customerdashboard/profile" active-class="bg-primary">
                <i class="bi bi-person me-2"></i>Profile
              </router-link>
            </li>
            <li class="nav-item mb-2">
              <router-link class="nav-link text-white" to="/customerdashboard/analytics" active-class="bg-primary">
                <i class="bi bi-pie-chart me-2"></i>Analytics
              </router-link>
            </li>            
            <li class="nav-item mt-auto">
              <a href="#" class="nav-link text-danger" @click.prevent="logout">
                <i class="fas fa-sign-out-alt me-2"></i>Logout
              </a>
            </li>
          </ul>
        </div>
  
        <!-- Main Content -->
        <div class="flex-grow-1 p-4" style="background: #f4f6f6;">
          <div class="container mt-4">
            <!-- User Info Top-Right -->
            <div class="user-info position-absolute end-0 p-3" style="top: 100px;">
              <div class="card shadow-sm border-0" style="width: 200px; background: #16a085;">
                <div class="card-body p-2 text-center text-white">
                  <h6 class="mb-0 fw-bold">{{ username }}</h6>
                  <p class="mb-0">Rating: {{ userRating || 'Not Rated' }}</p>
                </div>
              </div>
            </div>
            <!-- Children Routes Render Here -->
            <router-view></router-view>
          </div>
        </div>
      </div>
    `,
    data() {
        return {
            username: localStorage.getItem("username") || "Unknown User",
            userRating: null
        };
    },
    mounted() {
        this.fetchUserInfo();
    },
    methods: {
        async fetchUserInfo() {
            try {
                const response = await fetch('/userinfo', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Authentication-Token': localStorage.getItem('authToken') || ''
                    }
                });
                if (!response.ok) throw new Error('Failed to fetch user info');
                const data = await response.json();
                this.username = data.username || this.username;
                this.userRating = data.user_rating;
                localStorage.setItem('username', this.username);
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        },
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