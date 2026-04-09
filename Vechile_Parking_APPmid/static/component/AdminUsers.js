// File: AdminUsers.vue
export default {
    template: `
    <div>
      <h2 class="text-center mb-4 fw-bold text-uppercase" style="color: #2c3e50;">Users</h2>
      <div class="mb-4">
        <input 
          v-model="searchQuery" 
          class="form-control w-50 mx-auto" 
          placeholder="Search by username or email" 
          @input="filterUsers"
        >
      </div>
      <div class="row">
        <div class="col-md-4 mb-3" v-for="user in filteredUsers" :key="user.id">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-body">
              <h5 class="card-title fw-bold" style="color: #2c3e50;">{{ user.username }}</h5>
              <p class="card-text">
                <strong>Role:</strong> {{ user.roles[0] || 'N/A' }}<br>
                <strong>Email:</strong> {{ user.email }}<br>
                <strong>Active:</strong> {{ user.active ? 'Yes' : 'No' }}<br>
                <strong>Reservations:</strong> {{ user.reservation_count || 0 }}
              </p>
              <div class="d-flex justify-content-between flex-wrap gap-2">
                <button 
                  class="btn btn-success btn-sm" 
                  @click="verifyUser(user)" 
                  :disabled="user.active"
                  :class="{ 'btn-success': user.active }"
                >
                  {{ user.active ? 'Verified' : 'Verify' }}
                </button>
                <button 
                  class="btn btn-danger btn-sm" 
                  @click="toggleBlock(user)"
                  :disabled="!canBlock(user)"
                >
                  {{ user.active ? 'Block' : 'Unblock' }}
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
            users: [],
            searchQuery: '',
            filteredUsers: []
        };
    },
    mounted() {
        this.fetchUsers();
    },
    methods: {
        async fetchUsers() {
            try {
                const response = await fetch('/api/admin/users', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Authentication-Token': localStorage.getItem('authToken') || ''
                    }
                });
                if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
                this.users = await response.json();
                this.filteredUsers = this.users;
            } catch (error) {
                console.error('Error fetching users:', error);
                alert(error.message);
            }
        },
        filterUsers() {
            this.filteredUsers = this.users.filter(user =>
                user.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },
        async verifyUser(user) {
            if (user.active) return;
            try {
                const response = await fetch(`/api/admin/users/${user.id}/verify`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authentication-Token': localStorage.getItem('authToken') || ''
                    },
                    body: JSON.stringify({ active: true })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to verify user');
                }
                this.fetchUsers();
                alert('User verified successfully!');
            } catch (error) {
                console.error('Error verifying user:', error);
                alert(error.message);
            }
        },
        async toggleBlock(user) {
            try {
                const response = await fetch(`/api/admin/users/${user.id}/block`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authentication-Token': localStorage.getItem('authToken') || ''
                    },
                    body: JSON.stringify({ active: !user.active })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update block status');
                }
                this.fetchUsers();
                alert(`User ${user.active ? 'blocked' : 'unblocked'} successfully!`);
            } catch (error) {
                console.error('Error toggling block:', error);
                alert(error.message);
            }
        },
        canBlock(user) {
            const reservationCount = user.reservation_count || 0;
            return reservationCount >= 2 && user.active;
        }
    }
};