export default {
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark px-3" style="background-color: #1f2d3d; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
      <!--  Changed <a> to <span> -->
      <span class="navbar-brand fw-bold" style="letter-spacing: 1px; font-size: 1.4rem;">
        🚗 Vehicle Parking App
      </span>
      
      <div class="collapse navbar-collapse">
        <!-- Left Side Links -->
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#" @click.prevent="goToDashboard">Dashboard</a>
          </li>
        </ul>

        <!-- Right Side Links -->
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/login">Login</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/register">Register</router-link>
          </li>
        </ul>
      </div>
    </nav>
  `,
  methods: {
    goToDashboard() {
      const userRole = localStorage.getItem('role');
      if (userRole === 'admin') {
        this.$router.push('/admindashboard');
      } else if (userRole === 'customer' || userRole === 'professional') {
        this.$router.push('/userdashboard');
      } else {
        alert('Please log in to access the dashboard!');
        this.$router.push('/login');
      }
    }
  }
};