export default {
  template: `
  <div>
    <h2 class="text-center mb-5 fw-bold text-uppercase" style="color: #2c3e50; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Parking History</h2>
    <div class="row">
      <div v-for="reservation in parkingHistory" :key="reservation.id" class="col-md-6 mb-4">
        <div class="card shadow-sm border-0" style="background: #f8f9fa; border-radius: 10px;">
          <div class="card-body">
            <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ reservation.parking_lot_name }}</h5>
            <p class="card-text mb-2" style="color: #34495e;">
              <strong>Location:</strong> {{ reservation.parking_lot_location }}<br>
              <strong>Status:</strong> {{ reservation.status }}<br>
              <strong>Start Time:</strong> {{ formatDate(reservation.parking_timestamp) }}<br>
              <strong>End Time:</strong> {{ formatDate(reservation.leaving_timestamp) || 'N/A' }}<br>
              <strong>Total Cost:</strong> ₹{{ reservation.parking_cost ? reservation.parking_cost.toFixed(2) : 'N/A' }}<br>
              <strong>Rating:</strong> {{ reservation.rating || 'Not Rated' }}<br>
              <strong>Remarks:</strong> {{ reservation.remarks || 'N/A' }}
            </p>
            <div v-if="reservation.status === 'Paid' && !reservation.rating">
              <label for="rating">Rate (1-5):</label>
              <input 
                type="number" 
                v-model.number="reservation.tempRating" 
                min="1" 
                max="5" 
                class="form-control w-25 d-inline-block mx-2" 
                style="border-radius: 8px;"
              />
              <button 
                class="btn btn-primary btn-sm" 
                style="background: #1abc9c; border: none; border-radius: 20px; padding: 6px 20px;" 
                @click="submitRating(reservation.id, reservation.tempRating)" 
                :disabled="!reservation.tempRating || reservation.tempRating < 1 || reservation.tempRating > 5"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      parkingHistory: []
    };
  },
  mounted() {
    this.fetchParkingHistory();
    this.$root.$on('payment-made', this.fetchParkingHistory);
  },
  beforeDestroy() {
    this.$root.$off('payment-made', this.fetchParkingHistory);
  },
  methods: {
    async fetchParkingHistory() {
      try {
        const userId = localStorage.getItem('userId') || 1;
        const response = await fetch(`/api/customer/reservations?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authentication-Token': localStorage.getItem('authToken') || ''
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Fetch parking history failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'No error message provided'
          });
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        this.parkingHistory = data.map(reservation => ({
          ...reservation,
          tempRating: null
        })) || [];
      } catch (error) {
        console.error('Error in fetchParkingHistory:', error);
        alert(`Failed to fetch parking history: ${error.message}`);
      }
    },
    async submitRating(reservationId, rating) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          alert('Please log in to submit a rating');
          this.$router.push('/login');
          return;
        }
        if (!rating || rating < 1 || rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
        const response = await fetch(`/api/customer/reservation/${reservationId}/rate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authentication-Token': token
          },
          body: JSON.stringify({ rating: parseInt(rating) })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Rate reservation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'No error message provided'
          });
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        alert(data.message || 'Rating submitted successfully!');
        await this.fetchParkingHistory();
      } catch (error) {
        console.error('Error in submitRating:', error);
        alert(`Error submitting rating: ${error.message}`);
      }
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleString() : 'N/A';
    }
  }
};