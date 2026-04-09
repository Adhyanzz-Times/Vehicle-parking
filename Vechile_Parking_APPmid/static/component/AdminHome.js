export default {
  template: `
    <div>
      <h2 class="text-center mb-4 fw-bold text-uppercase" style="color: #2c3e50;">Admin Home - Parking Management</h2>
      <div class="row">
        <div class="col-md-8">
          <h4 class="fw-bold mb-3" style="color: #34495e;">Available Parking Lots</h4>
          <div class="row">
            <div class="col-md-6 mb-3" v-for="parkingLot in parkingLots" :key="parkingLot.id">
              <div class="card h-100 shadow-sm border-0">
                <div class="card-body">
                  <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ parkingLot.prime_location_name }}</h5>
                  <p class="card-text">
                    <strong>Address:</strong> {{ parkingLot.address }}<br>
                    <strong>Pin Code:</strong> {{ parkingLot.pin_code }}<br>
                    <strong>Capacity:</strong> {{ parkingLot.number_of_spots }} spots<br>
                    <strong>Hourly Rate:</strong> ₹{{ parkingLot.price_per_hour }}<br>
                    <strong>Available Spots:</strong> {{ parkingLot.available_spots || 0 }}
                  </p>
                  <div class="d-flex justify-content-between flex-wrap gap-2">
                    <button class="btn btn-warning btn-sm" @click="editParkingLot(parkingLot)">Edit Lot</button>
                    <button class="btn btn-danger btn-sm" @click="deleteParkingLot(parkingLot.id)">Delete Lot</button>
                    <button class="btn btn-success btn-sm" @click="showSpots(parkingLot)">See Spots</button>
                    <button class="btn btn-primary btn-sm" @click="openAddSpotModal(parkingLot)">Add Spot</button>
                  </div>
                  <!-- Spots List -->
                  <div v-if="parkingLot.showSpots" class="mt-3">
                    <h6 class="fw-bold" style="color: #34495e;">Spots in {{ parkingLot.prime_location_name }}</h6>
                    <ul class="list-group">
                      <li class="list-group-item d-flex justify-content-between align-items-center" v-for="spot in parkingLot.spots" :key="spot.id">
                        <span>{{ spot.name }} (Status: {{ spot.status }})</span>
                        <button class="btn btn-danger btn-sm" @click="deleteSpot(parkingLot.id, spot.id)">Delete Spot</button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h4 class="fw-bold mb-3" style="color: #34495e;">Create New Parking Lot</h4>
              <form @submit.prevent="createParkingLot">
                <div class="mb-3">
                  <input v-model="newParkingLot.prime_location_name" class="form-control" placeholder="Location Name" required>
                </div>
                <div class="mb-3">
                  <input v-model="newParkingLot.address" class="form-control" placeholder="Address" required>
                </div>
                <div class="mb-3">
                  <input v-model="newParkingLot.pin_code" class="form-control" placeholder="Pin Code" required>
                </div>
                <div class="mb-3">
                  <input v-model.number="newParkingLot.number_of_spots" type="number" class="form-control" placeholder="Number of Spots" required>
                </div>
                <div class="mb-3">
                  <input v-model.number="newParkingLot.price_per_hour" type="number" class="form-control" placeholder="Hourly Rate (₹)" required>
                </div>
                <button type="submit" class="btn btn-success w-100">Create Parking Lot</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <!-- Edit Parking Lot Modal -->
      <div v-if="editingParkingLot" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Parking Lot</h5>
              <button type="button" class="btn-close" @click="editingParkingLot = null"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <input v-model="editingParkingLot.prime_location_name" class="form-control" placeholder="Location Name" required>
              </div>
              <div class="mb-3">
                <input v-model="editingParkingLot.address" class="form-control" placeholder="Address" required>
              </div>
              <div class="mb-3">
                <input v-model="editingParkingLot.pin_code" class="form-control" placeholder="Pin Code" required>
              </div>
              <div class="mb-3">
                <input v-model.number="editingParkingLot.number_of_spots" type="number" class="form-control" placeholder="Number of Spots" required>
              </div>
              <div class="mb-3">
                <input v-model.number="editingParkingLot.price_per_hour" type="number" class="form-control" placeholder="Hourly Rate (₹)" required>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-success" @click="updateParkingLot">Save</button>
              <button class="btn btn-secondary" @click="editingParkingLot = null">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Add Spot Modal -->
      <div v-if="addingSpotToLot" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Spot to {{ addingSpotToLot.prime_location_name }}</h5>
              <button type="button" class="btn-close" @click="addingSpotToLot = null"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <select v-model="newSpot.status" class="form-control" required>
                  <option value="A">Available</option>
                  <option value="B">Booked</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-success" @click="createSpot">Add Spot</button>
              <button class="btn btn-secondary" @click="addingSpotToLot = null">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    `,
  data() {
    return {
      parkingLots: [],
      newParkingLot: {
        prime_location_name: '',
        address: '',
        pin_code: '',
        number_of_spots: null,
        price_per_hour: null
      },
      editingParkingLot: null,
      addingSpotToLot: null,
      newSpot: { status: 'A' }
    };
  },
  mounted() {
    this.fetchParkingLots();
  },
  methods: {
    async fetchParkingLots() {
      try {
        const response = await fetch('/api/parking-lots', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authentication-Token': localStorage.getItem('authToken') || ''
          }
        });
        if (!response.ok) throw new Error(`Failed to fetch parking lots: ${response.status}`);
        const lots = await response.json();
        this.parkingLots = lots.map(lot => ({ ...lot, showSpots: false }));
      } catch (error) {
        console.error('Error fetching parking lots:', error);
        alert(error.message);
      }
    },
    async createParkingLot() {
      try {
        const response = await fetch('/api/parking-lots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authentication-Token': localStorage.getItem('authToken') || ''
          },
          credentials: 'include',
          body: JSON.stringify(this.newParkingLot)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `Failed to create parking lot: ${response.status}`);
        alert(data.message || 'Parking lot created successfully');
        this.fetchParkingLots();
        this.newParkingLot = { prime_location_name: '', address: '', pin_code: '', number_of_spots: null, price_per_hour: null };
      } catch (error) {
        console.error('Error creating parking lot:', error);
        alert(error.message);
      }
    },
    editParkingLot(parkingLot) {
      this.editingParkingLot = { ...parkingLot };
    },
    async updateParkingLot() {
      try {
        const response = await fetch(`/api/parking-lots/${this.editingParkingLot.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authentication-Token': localStorage.getItem('authToken') || ''
          },
          credentials: 'include',
          body: JSON.stringify(this.editingParkingLot)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `Failed to update parking lot: ${response.status}`);
        alert(data.message || 'Parking lot updated successfully');
        this.fetchParkingLots();
        this.editingParkingLot = null;
      } catch (error) {
        console.error('Error updating parking lot:', error);
        alert(error.message);
      }
    },
    async deleteParkingLot(parkingLotId) {
      if (confirm('Are you sure you want to delete this parking lot?')) {
        try {
          const response = await fetch(`/api/parking-lots/${parkingLotId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Authentication-Token': localStorage.getItem('authToken') || ''
            }
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Failed to delete parking lot: ${response.status}`);
          }
          alert('Parking lot deleted successfully');
          this.fetchParkingLots();
        } catch (error) {
          console.error('Error deleting parking lot:', error);
          alert(error.message);
        }
      }
    },
    showSpots(parkingLot) {
      parkingLot.showSpots = !parkingLot.showSpots;
      if (parkingLot.showSpots && !parkingLot.spots) {
        this.fetchSpots(parkingLot);
      }
    },
    async fetchSpots(parkingLot) {
      try {
        const response = await fetch(`/api/parking-lots/${parkingLot.id}/spots`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authentication-Token': localStorage.getItem('authToken') || ''
          }
        });
        if (!response.ok) throw new Error(`Failed to fetch spots: ${response.status}`);
        parkingLot.spots = await response.json();
        this.$forceUpdate();
      } catch (error) {
        console.error('Error fetching spots:', error);
        alert(error.message);
      }
    },
    openAddSpotModal(parkingLot) {
      this.addingSpotToLot = parkingLot;
      this.newSpot = { status: 'A' };
    },
    async createSpot() {
      try {
        const response = await fetch(`/api/parking-lots/${this.addingSpotToLot.id}/spots`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authentication-Token': localStorage.getItem('authToken') || ''
          },
          credentials: 'include',
          body: JSON.stringify(this.newSpot)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `Failed to create spot: ${response.status}`);
        alert(data.message || 'Spot added successfully');
        this.fetchSpots(this.addingSpotToLot);
        this.addingSpotToLot = null;
      } catch (error) {
        console.error('Error creating spot:', error);
        alert(error.message);
      }
    },
    async deleteSpot(lotId, spotId) {
      if (confirm('Are you sure you want to delete this spot?')) {
        try {
          const response = await fetch(`/api/parking-lots/${lotId}/spots/${spotId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Authentication-Token': localStorage.getItem('authToken') || ''
            }
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Failed to delete spot: ${response.status}`);
          }
          alert('Spot deleted successfully');
          const parkingLot = this.parkingLots.find(lot => lot.id === lotId);
          if (parkingLot) {
            this.fetchSpots(parkingLot);
          }
        } catch (error) {
          console.error('Error deleting spot:', error);
          alert(error.message);
        }
      }
    }
  }
};