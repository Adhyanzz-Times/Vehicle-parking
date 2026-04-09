// File: AdminOngoing.vue
export default {
  template: `
  <div>
    <h2 class="text-center mb-4 fw-bold text-uppercase" style="color: #2c3e50;">
      <i class="bi bi-ticket-perforated me-2"></i>Ongoing Reservations & Available Spots
    </h2>
    <div class="row">
      <div class="col-md-6">
        <h4 class="fw-bold mb-3" style="color: #34495e;">Ongoing Reservations</h4>
        <div class="card shadow-sm border-0 mb-3" v-for="reservation in ongoing" :key="reservation.id">
          <div class="card-body">
            <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ reservation.parking_lot_name }}</h5>
            <p class="card-text">
              <strong>Customer:</strong> {{ reservation.customer_name }}<br>
              <strong>Location:</strong> {{ reservation.parking_lot_location }}<br>
              <strong>Status:</strong> {{ reservation.status }}<br>
              <strong>Start Time:</strong> {{ formatDate(reservation.parking_timestamp) }}
            </p>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <h4 class="fw-bold mb-3" style="color: #34495e;">Available Spots by Lot</h4>
        <div class="card shadow-sm border-0 mb-3" v-for="lot in parkingLots" :key="lot.id">
          <div class="card-body">
            <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ lot.prime_location_name }}</h5>
            <p class="card-text">
              <strong>Available Spots:</strong> {{ lot.available_spots }} / {{ lot.number_of_spots }}<br>
              <strong>Location:</strong> {{ lot.address }}<br>
              <strong>Pin Code:</strong> {{ lot.pin_code }}
            </p>
            <button class="btn btn-success btn-sm" @click="showSpots(lot)">View Spots</button>
            <div v-if="lot.showSpots" class="mt-3">
              <ul class="list-group">
                <li class="list-group-item" v-for="spot in lot.spots" :key="spot.id">
                  Spot {{ spot.id }} (Status: {{ spot.status }})
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      ongoing: [],
      parkingLots: []
    };
  },
  mounted() {
    this.fetchOngoing();
    this.fetchParkingLots();
  },
  methods: {
    async fetchOngoing() {
      try {
        const response = await fetch('/api/admin/ongoing-reservations', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Fetch ongoing reservations failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'No error message provided'
          });
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        this.ongoing = await response.json();
      } catch (error) {
        console.error('Error in fetchOngoing:', error);
        alert(`Failed to fetch ongoing reservations: ${error.message}`);
      }
    },
    async fetchParkingLots() {
      try {
        const response = await fetch('/api/parking-lots', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Fetch parking lots failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'No error message provided'
          });
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        const lots = await response.json();
        this.parkingLots = lots.map(lot => ({ ...lot, showSpots: false }));
      } catch (error) {
        console.error('Error in fetchParkingLots:', error);
        alert(`Failed to fetch parking lots: ${error.message}`);
      }
    },
    async showSpots(lot) {
      lot.showSpots = !lot.showSpots;
      if (lot.showSpots && !lot.spots) {
        try {
          const response = await fetch(`/api/parking-lots/${lot.id}/spots`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Fetch spots failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData.error || 'No error message provided'
            });
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
          }
          lot.spots = await response.json();
          this.$forceUpdate();
        } catch (error) {
          console.error('Error in showSpots:', error);
          alert(`Failed to fetch spots: ${error.message}`);
        }
      }
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleString() : 'N/A';
    }
  }
};