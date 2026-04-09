export default {
  template: `
    <div class="container mt-5 text-center">
      <h1 class="display-4 fw-bold" style="color: #1f2d3d; text-shadow: 1px 1px 3px rgba(0,0,0,0.15);">
        Welcome to Vehicle Parking App
      </h1>
      <p class="lead mb-4" style="color: #3b4a59;">
        Hassle-free parking bookings in your city — quick, secure, and reliable!
      </p>

      <!-- Image Gallery: Full image shown, equal size -->
      <div class="row justify-content-center mb-5">
        <!-- Image 1 -->
        <div class="col-md-6 mb-3">
          <div style="background-color: #f0f0f0; height: 400px; display: flex; justify-content: center; align-items: center; border: 3px solid #2c3e50; border-radius: 10px;">
            <img src="/static/images/carparking.jpg" alt="Car Parking 1"
                 style="max-height: 100%; max-width: 100%; object-fit: contain;">
          </div>
        </div>
        <!-- Image 2 -->
        <div class="col-md-6 mb-3">
          <div style="background-color: #f0f0f0; height: 400px; display: flex; justify-content: center; align-items: center; border: 3px solid #1f2d3d; border-radius: 10px;">
            <img src="/static/images/carparking2.jpg" alt="Car Parking 2"
                 style="max-height: 100%; max-width: 100%; object-fit: contain;">
          </div>
        </div>
      </div>

      <!-- Info Text -->
      <div class="row justify-content-center mb-4">
        <div class="col-md-8">
          <p style="color: #2c3e50;">
            Easily find and book parking spots across multiple prime locations. Our system ensures safe, real-time reservations with user-friendly features for customers and professionals.
          </p>
        </div>
      </div>

      <!-- Call to Action -->
      
    </div>
  `
};
