export default {
    template: `
    <div>
      <h2 class="text-center mb-5 fw-bold text-uppercase" style="color: #2c3e50; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Ongoing Parking Bookings</h2>
      <div class="row">
        <div v-for="reservation in ongoingReservations" :key="reservation.id" class="col-md-4 mb-4">
          <div class="card shadow-sm border-0" style="background: #f4f6f6; border-radius: 12px;">
            <div class="card-body">
              <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ reservation.parking_lot_name }}</h5>
              <p class="card-text" style="color: #34495e;">
                <strong>Location:</strong> {{ reservation.parking_lot_location }}<br>
                <strong>Status:</strong> {{ reservation.status }}<br>
                <strong>Start Time:</strong> {{ formatDate(reservation.parking_timestamp) }}<br>
                <strong>Total Cost:</strong> ₹{{ reservation.parking_cost ? reservation.parking_cost.toFixed(2) : 'N/A' }}
              </p>
              <div v-if="reservation.status === 'Booked'">
                <button class="btn btn-primary btn-sm" style="background: #1abc9c; border: none; border-radius: 20px; padding: 6px 20px;" @click="parkReservation(reservation.id)">Mark Parked</button>
              </div>
              <div v-if="reservation.status === 'Parked'">
                <button class="btn btn-warning btn-sm" style="background: #f1c40f; border: none; border-radius: 20px; padding: 6px 20px;" @click="leaveReservation(reservation.id)">Mark Leaving</button>
              </div>
              <div v-if="reservation.status === 'Leaving'">
                <button class="btn btn-success btn-sm" style="background: #1abc9c; border: none; border-radius: 20px; padding: 6px 20px;" @click="payReservation(reservation.id)">Pay</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    data() {
        return {
            ongoingReservations: []
        };
    },
    mounted() {
        this.fetchOngoingReservations();
        this.$root.$on('booking-made', this.fetchOngoingReservations);
        this.$root.$on('payment-made', this.fetchOngoingReservations);
    },
    beforeDestroy() {
        this.$root.$off('booking-made', this.fetchOngoingReservations);
        this.$root.$off('payment-made', this.fetchOngoingReservations);
    },
    methods: {
        async fetchOngoingReservations() {
            try {
                const userId = localStorage.getItem('userId') || 1;
                const response = await fetch(`/api/customer/ongoing-reservations?user_id=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authentication-Token': localStorage.getItem('authToken') || ''
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
                const data = await response.json();
                this.ongoingReservations = data || [];
            } catch (error) {
                console.error('Error in fetchOngoingReservations:', error);
                alert(`Failed to fetch ongoing reservations: ${error.message}`);
            }
        },
        async parkReservation(reservationId) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('Please log in to mark as Parked');
                    this.$router.push('/login');
                    return;
                }
                const response = await fetch(`/api/customer/reservation/${reservationId}/park`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({})
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Park reservation failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData.error || 'No error message provided'
                    });
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                alert(data.message || 'Reservation marked as Parked!');
                await this.fetchOngoingReservations();
            } catch (error) {
                console.error('Error in parkReservation:', error);
                alert(`Error marking reservation as Parked: ${error.message}`);
            }
        },
        async leaveReservation(reservationId) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('Please log in to mark as Leaving');
                    this.$router.push('/login');
                    return;
                }
                const response = await fetch(`/api/customer/reservation/${reservationId}/leave`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({})
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Leave reservation failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData.error || 'No error message provided'
                    });
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                alert(data.message || 'Reservation marked as Leaving!');
                await this.fetchOngoingReservations();
            } catch (error) {
                console.error('Error in leaveReservation:', error);
                alert(`Error marking reservation as Leaving: ${error.message}`);
            }
        },
        async payReservation(reservationId) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('Please log in to make a payment');
                    this.$router.push('/login');
                    return;
                }
                const response = await fetch(`/api/customer/reservation/${reservationId}/pay`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({})
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Pay reservation failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData.error || 'No error message provided'
                    });
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                alert(data.message || 'Payment completed successfully!');
                await this.fetchOngoingReservations();
                this.$root.$emit('payment-made');
            } catch (error) {
                console.error('Error in payReservation:', error);
                alert(`Error paying reservation: ${error.message}`);
            }
        },
        formatDate(date) {
            return date ? new Date(date).toLocaleString() : 'N/A';
        }
    }
};