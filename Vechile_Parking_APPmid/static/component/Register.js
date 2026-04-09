export default {
  template: `
    <div class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
          <div class="card shadow-lg" style="margin-top: 50px; margin-bottom: 100px;">
            <div class="card-header bg-success text-white text-center">
              <h3 class="mb-0">Register for Vehicle Parking App</h3>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleRegister">
                <div class="form-group mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" id="username" class="form-control" v-model="username" required />
                </div>
                <div class="form-group mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" id="email" class="form-control" v-model="email" required />
                </div>
                <div class="form-group mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" id="password" class="form-control" v-model="password" required />
                </div>
                <button type="submit" class="btn btn-success w-100">Register</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      username: "",
      email: "",
      password: ""
    };
  },
  methods: {
    async handleRegister() {
      console.log("Registering...");
      try {
        const payload = {
          username: this.username,
          email: this.email,
          password: this.password
          // Not sending role, as backend defaults to "customer"
        };

        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          alert(`Registration Successful! Please log in.`);
          this.$router.push("/login");
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        alert("Something went wrong! Please try again.");
      }
    }
  }
};