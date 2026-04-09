// File: AdminHistory.vue
export default {
  template: `
  <div>
    <h2 class="text-center mb-4 fw-bold text-uppercase" style="color: #2c3e50;">Reservation History</h2>
    <div class="row">
      <div class="col-md-12">
        <div class="card shadow-sm border-0 mb-3" v-for="reservation in history" :key="reservation.id">
          <div class="card-body">
            <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ reservation.parking_lot_name }}</h5>
            <p class="card-text">
              <strong>Customer:</strong> {{ reservation.customer_name }}<br>
              <strong>Location:</strong> {{ reservation.parking_lot_location }}<br>
              <strong>Status:</strong> {{ reservation.status }}<br>
              <strong>Start Time:</strong> {{ formatDate(reservation.parking_timestamp) }}<br>
              <strong>End Time:</strong> {{ formatDate(reservation.leaving_timestamp) || 'N/A' }}<br>
              <strong>Total Cost:</strong> ₹{{ reservation.parking_cost ? reservation.parking_cost.toFixed(2) : 'N/A' }}<br>
              <strong>Remarks:</strong> {{ reservation.remarks || 'N/A' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      history: []
    };
  },
  mounted() {
    this.fetchHistory();
  },
  methods: {
    async fetchHistory() {
      try {
        const response = await fetch('/api/admin/reservations', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Fetch reservation history failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'No error message provided'
          });
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        this.history = await response.json();
      } catch (error) {
        console.error('Error in fetchHistory:', error);
        alert(`Failed to fetch reservation history: ${error.message}`);
      }
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleString() : 'N/A';
    }
  }
};