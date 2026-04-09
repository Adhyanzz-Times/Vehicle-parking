// File: CustomerProfile.vue
export default {
    template: `
    <div>
      <h2 class="text-center mb-5 fw-bold text-uppercase" style="color: #2c3e50; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Customer Profile</h2>
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card shadow-lg p-4" style="background: #f4f6f6; border-radius: 12px;">
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label fw-bold" style="color: #34495e;">Username</label>
                <input 
                  v-model="username" 
                  class="form-control" 
                  placeholder="Enter username" 
                  style="border-radius: 8px; border: 1px solid #ced4da;"
                  :disabled="!isEditing"
                />
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold" style="color: #34495e;">Email</label>
                <input 
                  v-model="email" 
                  class="form-control" 
                  placeholder="Enter email" 
                  style="border-radius: 8px; border: 1px solid #ced4da;"
                  :disabled="!isEditing"
                />
              </div>
              <p class="mb-3"><strong>Role:</strong> Customer</p>
              <div class="text-center">
                <button 
                  v-if="!isEditing" 
                  class="btn btn-primary" 
                  style="background: #1abc9c; border: none; border-radius: 20px; padding: 8px 24px;" 
                  @click="isEditing = true"
                >
                  Edit Profile
                </button>
                <button 
                  v-if="isEditing" 
                  class="btn btn-success" 
                  style="background: #1abc9c; border: none; border-radius: 20px; padding: 8px 24px;" 
                  @click="saveProfile"
                  :disabled="!isValid"
                >
                  Save Changes
                </button>
                <button 
                  v-if="isEditing" 
                  class="btn btn-secondary ms-2" 
                  style="background: #7f8c8d; border: none; border-radius: 20px; padding: 8px 24px;" 
                  @click="cancelEdit"
                >
                  Cancel
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
            username: '',
            email: '',
            isEditing: false
        };
    },
    mounted() {
        this.fetchProfile();
    },
    computed: {
        isValid() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return this.username.trim() !== '' && emailRegex.test(this.email);
        }
    },
    methods: {
        async fetchProfile() {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No authentication token found');
                const response = await fetch('/userinfo', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Authentication-Token': token
                    }
                });
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Failed to fetch profile: ${response.status} - ${text}`);
                }
                const data = await response.json();
                this.username = data.username || '';
                this.email = data.email || '';
            } catch (error) {
                console.error("Fetch Profile Error:", error);
                alert(`Error fetching profile: ${error.message}`);
            }
        },
        async saveProfile() {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No authentication token found');
                const response = await fetch('/api/customer/profile', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({
                        username: this.username,
                        email: this.email
                    })
                });
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Failed to update profile: ${response.status} - ${text}`);
                }
                const data = await response.json();
                alert(data.message || 'Profile updated successfully!');
                this.isEditing = false;
            } catch (error) {
                console.error("Update Profile Error:", error);
                alert(`Error updating profile: ${error.message}`);
            }
        },
        cancelEdit() {
            this.isEditing = false;
            this.fetchProfile();
        }
    }
};