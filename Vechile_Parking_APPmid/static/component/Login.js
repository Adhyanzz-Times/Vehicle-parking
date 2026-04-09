export default {
    template: `
      <div class="container my-5">
        <div class="row justify-content-center">
          <div class="col-md-5 col-lg-4">
            <div class="card shadow-lg" style="height: 450px; margin-top: 50px; margin-bottom: 100px;">
              <div class="card-header bg-primary text-white text-center">
                <h3 class="mb-0">Login Form</h3>
              </div>
              <div class="card-body d-flex flex-column justify-content-center">
                <form @submit.prevent="loginUser">
                  <div class="form-group mb-4">
                    <label for="email" class="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      class="form-control"
                      v-model="formData.email"
                      required
                    />
                  </div>
                  <div class="form-group mb-4">
                    <label for="password" class="form-label">Password</label>
                    <input
                      type="password"
                      id="password"
                      class="form-control"
                      v-model="formData.password"
                      required
                    />
                  </div>
                  <button type="submit" class="btn btn-primary w-100">Login</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    data() {
        return {
            formData: {
                email: "",
                password: "",
            },
        };
    },
    methods: {
        async loginUser() {
            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(this.formData),
                });

                const data = await response.json();
                console.log("Login Response:", data);
                console.log("Role from Server:", data.role);
                console.log("Username from Server:", data.username);

                if (response.ok && data.success) {
                    localStorage.setItem("authToken", data.token || '');
                    localStorage.setItem("userId", data.userId);
                    localStorage.setItem("username", data.username || 'Unknown');
                    localStorage.setItem("role", data.role);

                    console.log("Cookies after login:", document.cookie);

                    if (data.role === "admin") {
                        alert(`Welcome, Admin ${data.username}!`);
                        this.$router.push("/admindashboard");
                    } else if (data.role === "professional") {
                        alert(`Welcome, Professional ${data.username}!`);
                        this.$router.push("/professionaldashboard");
                    } else if (data.role === "customer") {
                        alert(`Welcome, Customer ${data.username}!`);
                        this.$router.push("/customerdashboard");
                    } else {
                        alert("Unknown role! Redirecting to home.");
                        this.$router.push("/");
                    }
                } else {
                    throw new Error(data.message || "Login failed! Invalid credentials.");
                }
            } catch (error) {
                console.error("Login Error:", error);
                alert(error.message);
            }
        },
    },
};
