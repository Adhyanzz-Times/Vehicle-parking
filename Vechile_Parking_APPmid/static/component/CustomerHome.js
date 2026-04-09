export default {
  data() {
    return {
      parkingLots: [],
      spots: [],
      selectedLot: null,
      taskId: null
    };
  },
  template: `
    <div>
      <h2 class="text-center mb-5 fw-bold text-uppercase" style="color: #2c3e50; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
        Available Parking Lots
      </h2>
      
      <div class="mb-4 text-center">
        <button class="btn btn-primary" style="background: #1abc9c; border: none; border-radius: 20px; padding: 8px 24px;" @click="exportCSV">
          Export Parking History as CSV
        </button>
      </div>

      <div class="row">
        <div class="col-md-6 mb-4" v-for="lot in parkingLots" :key="lot.id">
          <div class="card h-100 shadow border-0" style="background: linear-gradient(135deg, #ffffff 0%, #e6f0fa 100%); border-radius: 12px;">
            <div class="card-body">
              <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ lot.prime_location_name }}</h5>
              <p class="card-text" style="color: #34495e;">
                <strong>Address:</strong> {{ lot.address }}<br>
                <strong>Pin Code:</strong> {{ lot.pin_code }}<br>
                <strong>Price per Hour:</strong> ₹{{ lot.price_per_hour }}<br>
                <strong>Available Spots:</strong> {{ lot.available_spots }} / {{ lot.number_of_spots }}
              </p>
              <button 
                class="btn btn-success btn-sm" 
                style="background: #1abc9c; border: none; border-radius: 20px; padding: 6px 20px;" 
                @click="bookFirstAvailableSpot(lot.id)"
                :disabled="lot.available_spots === 0">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  mounted() {
    this.fetchParkingLots();
  },
  methods: {
    async fetchParkingLots() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          alert('Please log in to view parking lots.');
          this.$router.push('/login');
          return;
        }
        const response = await fetch('/api/parking-lots', {
          method: 'GET',
          headers: {
            'Authentication-Token': token
          }
        });
        if (!response.ok) throw new Error('Failed to fetch parking lots');
        this.parkingLots = await response.json();
      } catch (error) {
        console.error('Error fetching parking lots:', error);
        alert(error.message);
      }
    },

    async bookFirstAvailableSpot(lotId) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/book-spot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': token
          },
          body: JSON.stringify({ lot_id: lotId }) // No spot_id, backend will assign first available
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to book spot');
        alert(data.message);
        this.fetchParkingLots(); // Refresh after booking
      } catch (error) {
        console.error('Error booking spot:', error);
        alert(error.message);
      }
    },

    async exportCSV() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          alert('Please log in to export parking history');
          this.$router.push('/login');
          return;
        }
        const response = await fetch('/api/export', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authentication-Token': token
          }
        });
        const text = await response.text();
        if (!response.ok) throw new Error(`HTTP error! ${text}`);
        const data = JSON.parse(text);
        this.taskId = data.id;
        this.checkTaskStatus();
      } catch (error) {
        console.error('Error initiating CSV export:', error);
        alert(error.message);
      }
    },

    async checkTaskStatus() {
      if (!this.taskId) return;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/csv_result/${this.taskId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authentication-Token': token
          }
        });
        const text = await response.text();
        if (!response.ok) throw new Error(text);

        const contentType = response.headers.get('content-type');
        if (contentType.includes('application/json')) {
          const data = JSON.parse(text);
          if (data.status === 'Processing') {
            setTimeout(this.checkTaskStatus, 2000);
          } else if (data.error) {
            alert(`CSV export failed: ${data.error}`);
            this.taskId = null;
          } else {
            this.downloadCSV();
          }
        } else if (contentType.includes('text/csv')) {
          this.downloadCSV();
        }
      } catch (error) {
        console.error('Error checking CSV export:', error);
        alert(error.message);
        this.taskId = null;
      }
    },

    downloadCSV() {
      const downloadUrl = `/api/csv_result/${this.taskId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.taskId = null;
    }
  }
};
