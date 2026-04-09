// File: CustomerAnalytics.js
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

// File: component/CustomerDashboard.js
// File: component/CustomerDashboard.js
export default {
  template: `
    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar Navigation -->
        <div class="col-md-3 col-lg-2 bg-light p-3">
          <h4>Customer Menu</h4>
          <ul class="nav flex-column">
            <li class="nav-item">
              <router-link class="nav-link" to="/customerdashboard/home">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/customerdashboard/history">History</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/customerdashboard/ongoing">Ongoing</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/customerdashboard/profile">Profile</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/customerdashboard/analytics">Analytics</router-link>
            </li>
          </ul>
        </div>

        <!-- Main Content Area -->
        <div class="col-md-9 col-lg-10 p-4">
          <!-- This is where child routes will appear -->
          <router-view></router-view>
        </div>
      </div>
    </div>
  `,


  data() {
    return {
      analytics: { usage_per_month: { labels: [], counts: [] }, payment_status_counts: {} },
      chartInstances: {}
    };
  },
  computed: {
    hasUsageData() {
      return this.analytics.usage_per_month.labels?.length > 0;
    },
    hasPaymentData() {
      return Object.values(this.analytics.payment_status_counts || {}).some(v => v > 0);
    }
  },
  mounted() {
    this.fetchAnalytics();
  },
  methods: {
    async fetchAnalytics() {
      try {
        const response = await fetch('/api/customer/analytics', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authentication-Token': localStorage.getItem('authToken') || ''
          }
        });
        if (!response.ok) throw new Error(`Failed to fetch analytics: ${response.status}`);

        this.analytics = await response.json();
        console.log("User Analytics:", this.analytics);

        this.$nextTick(() => {
          if (this.hasUsageData || this.hasPaymentData) {
            this.renderCharts();
          }
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
        alert(error.message);
      }
    },
    destroyExistingCharts() {
      Object.values(this.chartInstances).forEach(chart => chart.destroy());
      this.chartInstances = {};
    },
    renderCharts() {
      this.destroyExistingCharts();

      if (this.hasUsageData) {
        const usageCtx = document.getElementById('usageChart').getContext('2d');
        this.chartInstances.usageChart = new ChartJS(usageCtx, {
          type: 'bar',
          data: {
            labels: this.analytics.usage_per_month.labels,
            datasets: [{
              label: 'Reservations',
              data: this.analytics.usage_per_month.counts,
              backgroundColor: '#16a085'
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Number of Reservations' } }
            }
          }
        });
      }

      if (this.hasPaymentData) {
        const paymentCtx = document.getElementById('paymentChart').getContext('2d');
        const paymentLabels = Object.keys(this.analytics.payment_status_counts);
        const paymentValues = Object.values(this.analytics.payment_status_counts);

        this.chartInstances.paymentChart = new ChartJS(paymentCtx, {
          type: 'pie',
          data: {
            labels: paymentLabels,
            datasets: [{
              label: 'Payments',
              data: paymentValues,
              backgroundColor: ['#2ecc71', '#e74c3c']
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'right' } }
          }
        });
      }
    }
  }
};
