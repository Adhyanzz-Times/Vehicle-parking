// File: AdminAnalytics.vue
export default {
    template: `
    <div>
      <h2 class="text-center mb-5 fw-bold text-uppercase" style="color: #2c3e50;">Parking Analytics</h2>
      <div class="row">
        <div class="col-md-4 mb-4">
          <h4 class="fw-bold mb-3 text-center" style="color: #34495e;">Reservations by Parking Lot</h4>
          <canvas id="parkingLotChart"></canvas>
        </div>
        <div class="col-md-4 mb-4">
          <h4 class="fw-bold mb-3 text-center" style="color: #34495e;">Users by Reservations</h4>
          <canvas id="userChart"></canvas>
        </div>
        <div class="col-md-4 mb-4">
          <h4 class="fw-bold mb-3 text-center" style="color: #34495e;">Revenue by Parking Lot</h4>
          <canvas id="revenueChart"></canvas>
        </div>
      </div>
    </div>
    `,
    data() {
        return {
            analytics: { parkingLots: [], users: [], revenue: [] }
        };
    },
    mounted() {
        this.fetchAnalytics();
    },
    methods: {
        async fetchAnalytics() {
            try {
                const response = await fetch('/api/admin/parking-analytics', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Authentication-Token': localStorage.getItem('authToken') || ''
                    }
                });
                if (!response.ok) throw new Error(`Failed to fetch parking analytics: ${response.status}`);
                this.analytics = await response.json();
                this.renderCharts();
            } catch (error) {
                console.error('Error fetching parking analytics:', error);
                alert(error.message);
            }
        },
        renderCharts() {
            // Parking Lot Reservations Bar Chart
            const parkingLotCtx = document.getElementById('parkingLotChart').getContext('2d');
            new Chart(parkingLotCtx, {
                type: 'bar',
                data: {
                    labels: this.analytics.parkingLots.map(p => p.prime_location_name),
                    datasets: [{
                        label: 'Reservations',
                        data: this.analytics.parkingLots.map(p => p.reservations),
                        backgroundColor: '#16a085',
                        borderColor: '#12876f',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: { y: { beginAtZero: true, title: { display: true, text: 'No. of Reservations' } } },
                    plugins: { legend: { display: false } }
                }
            });

            // User Reservations Pie Chart
            const userCtx = document.getElementById('userChart').getContext('2d');
            new Chart(userCtx, {
                type: 'pie',
                data: {
                    labels: this.analytics.users.map(u => u.username),
                    datasets: [{
                        label: 'Reservations',
                        data: this.analytics.users.map(u => u.reservations),
                        backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6']
                    }]
                },
                options: {
                    plugins: { legend: { position: 'right' } }
                }
            });

            // Revenue by Parking Lot Doughnut Chart
            const revenueCtx = document.getElementById('revenueChart').getContext('2d');
            new Chart(revenueCtx, {
                type: 'doughnut',
                data: {
                    labels: this.analytics.revenue.map(r => r.prime_location_name),
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: this.analytics.revenue.map(r => r.revenue),
                        backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6']
                    }]
                },
                options: {
                    plugins: { legend: { position: 'right' } }
                }
            });
        }
    }
};