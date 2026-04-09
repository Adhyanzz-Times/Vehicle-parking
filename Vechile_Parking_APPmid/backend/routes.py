from flask import request, jsonify, render_template, send_from_directory
from flask_security import hash_password, auth_required, current_user, roles_required, login_user
from flask_security.utils import verify_password
from backend.models import *
from flask import current_app as app
from datetime import datetime
from sqlalchemy import func
from celery.result import AsyncResult
from backend.tasks import csv_report
from collections import defaultdict
from static import*

datastore = app.security.datastore

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    user = datastore.find_user(email=email)
    if not user or not verify_password(password, user.password):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401
    login_user(user)
    token = user.get_auth_token()
    role = [r.name for r in user.roles][0] if user.roles else "unknown"
    return jsonify({
        "success": True,
        "token": token,
        "userId": user.id,
        "username": user.username,
        "role": role,
        "message": "Login successful!"
    }), 200

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    username = data.get("username")
    role_name = data.get("role", "customer").lower()
    if datastore.find_user(email=email):
        return jsonify({"error": "User already exists!"}), 409
    role = datastore.find_role(role_name)
    if not role:
        role = datastore.create_role(name=role_name, description=f"{role_name.capitalize()} role")
        db.session.commit()
    user = datastore.create_user(
        email=email,
        username=username,
        password=hash_password(password),
        roles=[role],
        active=True,
    )
    db.session.commit()
    return jsonify({"message": "User registered successfully!"}), 201

@app.route("/logout", methods=["POST"])
@auth_required('token')
def logout():
    from flask_security import logout_user
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route("/userinfo", methods=["GET"])
@auth_required('token')
def userinfo():
    try:
        user = current_user
        reservations = Reservation.query.filter_by(user_id=user.id).all()
        ratings = [r.rating for r in reservations if r.rating is not None]
        user_rating = sum(ratings) / len(ratings) if ratings else None
        return jsonify({
            'username': user.username,
            'email': user.email,
            'user_rating': round(user_rating, 1) if user_rating else None
        }), 200
    except Exception as e:
        app.logger.error(f"Error in userinfo: {str(e)}")
        return jsonify({'error': f'Failed to fetch user info: {str(e)}'}), 500

@app.route("/api/customer/profile", methods=["PUT"])
@auth_required('token')
def update_profile():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        if not username or not email:
            return jsonify({'error': 'Username and email are required'}), 400
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        import re
        if not re.match(email_regex, email):
            return jsonify({'error': 'Invalid email format'}), 400
        if User.query.filter_by(username=username).first() and username != current_user.username:
            return jsonify({'error': 'Username already taken'}), 400
        if User.query.filter_by(email=email).first() and email != current_user.email:
            return jsonify({'error': 'Email already taken'}), 400
        current_user.username = username
        current_user.email = email
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error in update_profile: {str(e)}")
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@app.route("/api/parking-lots", methods=["GET"])
@auth_required('token')
def get_parking_lots():
    """
    Returns all parking lots with availability information.
    Requires a valid authentication token.
    """
    try:
        lots = ParkingLot.query.all()
        return jsonify([
            {
                'id': lot.id,
                'prime_location_name': lot.prime_location_name,
                'address': lot.address,
                'pin_code': lot.pin_code,
                'price_per_hour': float(lot.price_per_hour),
                'number_of_spots': lot.number_of_spots,
                'available_spots': len([s for s in lot.spots if s.status == 'A'])
            }
            for lot in lots
        ]), 200
    except Exception as e:
        print(f"Error in get_parking_lots: {str(e)}")
        return jsonify({'error': f'Failed to fetch parking lots: {str(e)}'}), 500


@app.route("/api/parking-lots/<int:lot_id>/spots", methods=["GET"])
@auth_required('token')
def get_spots(lot_id):
    """
    Returns all spots for a specific parking lot.
    Requires a valid authentication token.
    """
    try:
        ParkingLot.query.get_or_404(lot_id)
        spots = ParkingSpot.query.filter_by(lot_id=lot_id).all()
        return jsonify([
            {'id': spot.id, 'status': spot.status}
            for spot in spots
        ]), 200
    except Exception as e:
        print(f"Error in get_spots: {str(e)}")
        return jsonify({'error': f'Failed to fetch spots: {str(e)}'}), 500


@app.route("/api/book-spot", methods=["POST"])
@auth_required('token')
def book_spot():
    """
    Books the first available spot in the given lot for the current user.
    The frontend should send only `lot_id`.
    """
    try:
        data = request.json
        lot_id = data.get('lot_id')

        if not lot_id:
            return jsonify({'error': 'Missing lot_id'}), 400

        lot = ParkingLot.query.get_or_404(lot_id)

        # Find first available spot
        spot = ParkingSpot.query.filter_by(lot_id=lot_id, status='A').first()
        if not spot:
            return jsonify({'error': 'No available spots'}), 400

        # Assign the spot to the current user
        spot.status = 'B'
        reservation = Reservation(
            user_id=current_user.id,
            spot_id=spot.id,
            parking_timestamp=datetime.utcnow(),
            parking_cost=float(lot.price_per_hour),
            paid=False
        )

        db.session.add(reservation)
        db.session.commit()

        return jsonify({
            'message': f'Success! Spot {spot.id} booked in {lot.prime_location_name}.'
        }), 200

    except Exception as e:
        print(f"Error in book_spot: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Failed to book spot: {str(e)}'}), 500

@app.route("/api/customer/analytics", methods=["GET"])
@auth_required('token')
def customer_analytics():
    app.logger.info(f"Analytics requested by {current_user.email}")
    reservations = Reservation.query.filter_by(user_id=current_user.id).all()

    usage_per_month = defaultdict(int)
    payment_status_counts = {"Paid": 0, "Unpaid": 0}

    for r in reservations:
        # Count monthly usage
        month_label = r.parking_timestamp.strftime("%b %Y")
        usage_per_month[month_label] += 1

        # Count payment status
        if r.paid:
            payment_status_counts["Paid"] += 1
        else:
            payment_status_counts["Unpaid"] += 1

    # Sort months chronologically
    sorted_usage = sorted(
        usage_per_month.items(),
        key=lambda x: datetime.strptime(x[0], "%b %Y")
    )

    return jsonify({
        # For chart.js: labels and counts
        "usage_per_month": {
            "labels": [m for m, _ in sorted_usage],
            "counts": [c for _, c in sorted_usage]
        },
        "payment_status_counts": payment_status_counts
    })

@app.route("/api/customer/reservations", methods=["GET"])
def get_customer_reservations():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id query parameter is required'}), 400
        reservations = Reservation.query.filter_by(user_id=user_id).all()
        app.logger.info(f"Fetched {len(reservations)} reservations for user {user_id}")
        result = []
        for r in reservations:
            spot = ParkingSpot.query.get(r.spot_id)
            if not spot:
                app.logger.warning(f"No ParkingSpot found for reservation {r.id}")
                continue
            lot = ParkingLot.query.get(spot.lot_id)
            if not lot:
                app.logger.warning(f"No ParkingLot found for spot {spot.id}")
                continue
            result.append({
                'id': r.id,
                'parking_lot_name': lot.prime_location_name,
                'parking_lot_location': lot.address,
                'spot_name': spot.name,
                'status': r.status,
                'parking_timestamp': r.parking_timestamp.isoformat(),
                'leaving_timestamp': r.leaving_timestamp.isoformat() if r.leaving_timestamp else None,
                'parking_cost': float(r.parking_cost) if r.parking_cost else None,
                'remarks': r.remarks,
                'rating': r.rating
            })
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error in get_customer_reservations: {str(e)}")
        return jsonify({'error': f'Failed to fetch reservations: {str(e)}'}), 500

@app.route("/api/customer/ongoing-reservations", methods=["GET"])
def get_customer_ongoing_reservations():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id query parameter is required'}), 400
        reservations = Reservation.query.filter_by(user_id=user_id).filter(
            Reservation.status != 'Paid'
        ).all()
        app.logger.info(f"Fetched {len(reservations)} ongoing reservations for user {user_id}")
        result = []
        for r in reservations:
            spot = ParkingSpot.query.get(r.spot_id)
            if not spot:
                app.logger.warning(f"No ParkingSpot found for reservation {r.id}")
                continue
            lot = ParkingLot.query.get(spot.lot_id)
            if not lot:
                app.logger.warning(f"No ParkingLot found for spot {spot.id}")
                continue
            result.append({
                'id': r.id,
                'parking_lot_name': lot.prime_location_name,
                'parking_lot_location': lot.address,
                'spot_name': spot.name,
                'status': r.status,
                'parking_timestamp': r.parking_timestamp.isoformat(),
                'parking_cost': float(r.parking_cost) if r.parking_cost else None,
                'rating': r.rating
            })
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error in get_customer_ongoing_reservations: {str(e)}")
        return jsonify({'error': f'Failed to fetch ongoing reservations: {str(e)}'}), 500

@app.route("/api/customer/reservation/<int:reservation_id>/park", methods=["PUT"])
@auth_required('token')
def park_reservation(reservation_id):
    try:
        reservation = Reservation.query.get_or_404(reservation_id)
        if reservation.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        if reservation.status != 'Booked':
            return jsonify({'error': 'Reservation must be in Booked state to mark as Parked'}), 400
        reservation.status = 'Parked'
        db.session.commit()
        return jsonify({'message': 'Reservation marked as Parked'}), 200
    except Exception as e:
        app.logger.error(f"Error in park_reservation: {str(e)}")
        return jsonify({'error': f'Failed to mark as Parked: {str(e)}'}), 500

@app.route("/api/customer/reservation/<int:reservation_id>/leave", methods=["PUT"])
@auth_required('token')
def leave_reservation(reservation_id):
    try:
        reservation = Reservation.query.get_or_404(reservation_id)
        if reservation.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        if reservation.status != 'Parked':
            return jsonify({'error': 'Reservation must be in Parked state to mark as Leaving'}), 400
        reservation.status = 'Leaving'
        reservation.leaving_timestamp = datetime.utcnow()
        spot = ParkingSpot.query.get(reservation.spot_id)
        if not spot:
            return jsonify({'error': 'Invalid spot for reservation'}), 400
        lot = ParkingLot.query.get(spot.lot_id)
        if not lot:
            return jsonify({'error': 'Invalid parking lot for spot'}), 400
        duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
        reservation.parking_cost = round(float(lot.price_per_hour) * max(duration_hours, 1), 2)
        db.session.commit()
        return jsonify({'message': 'Reservation marked as Leaving'}), 200
    except Exception as e:
        app.logger.error(f"Error in leave_reservation: {str(e)}")
        return jsonify({'error': f'Failed to mark as Leaving: {str(e)}'}), 500

@app.route("/api/customer/reservation/<int:reservation_id>/pay", methods=["PUT"])
@auth_required('token')
def pay_reservation(reservation_id):
    try:
        reservation = Reservation.query.get_or_404(reservation_id)
        if reservation.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        if reservation.status != 'Leaving':
            return jsonify({'error': 'Reservation must be in Leaving state to pay'}), 400
        if reservation.paid:
            return jsonify({'error': 'Reservation already paid'}), 400
        reservation.paid = True
        reservation.status = 'Paid'
        spot = ParkingSpot.query.get(reservation.spot_id)
        if not spot:
            return jsonify({'error': 'Invalid spot for reservation'}), 400
        spot.status = 'A'
        db.session.commit()
        return jsonify({'message': 'Payment completed successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error in pay_reservation: {str(e)}")
        return jsonify({'error': f'Failed to process payment: {str(e)}'}), 500

@app.route("/api/customer/reservation/<int:reservation_id>/rate", methods=["PUT"])
@auth_required('token')
def rate_reservation(reservation_id):
    try:
        reservation = Reservation.query.get_or_404(reservation_id)
        if reservation.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        if not reservation.paid:
            return jsonify({'error': 'Reservation must be paid before rating'}), 400
        if reservation.rating is not None:
            return jsonify({'error': 'Reservation already rated'}), 400
        data = request.json
        rating = data.get('rating')
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be an integer between 1 and 5'}), 400
        reservation.rating = rating
        db.session.commit()
        return jsonify({'message': 'Rating submitted successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error in rate_reservation: {str(e)}")
        return jsonify({'error': f'Failed to submit rating: {str(e)}'}), 500

@app.route("/api/admin/users", methods=["GET"])
@auth_required('token')
@roles_required('admin')
def get_users():
    try:
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'roles': [r.name for r in u.roles],
            'active': u.active,
            'reservation_count': len(u.reservations)
        } for u in users]), 200
    except Exception as e:
        app.logger.error(f"Error in get_users: {str(e)}")
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500

@app.route("/api/admin/users/<int:user_id>/verify", methods=["PUT"])
@auth_required('token')
@roles_required('admin')
def verify_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        user.active = True
        db.session.commit()
        return jsonify({'message': 'User verified successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error in verify_user: {str(e)}")
        return jsonify({'error': f'Failed to verify user: {str(e)}'}), 500

@app.route("/api/admin/users/<int:user_id>/block", methods=["PUT"])
@auth_required('token')
@roles_required('admin')
def block_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        user.active = data.get('active', user.active)
        db.session.commit()
        return jsonify({'message': f'User {"unblocked" if user.active else "blocked"} successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error in block_user: {str(e)}")
        return jsonify({'error': f'Failed to block/unblock user: {str(e)}'}), 500

@app.route("/api/parking-lots", methods=["POST"])
@auth_required('token')
@roles_required('admin')
def create_parking_lot():
    try:
        data = request.json
        lot = ParkingLot(
            prime_location_name=data.get('prime_location_name'),
            address=data.get('address'),
            pin_code=data.get('pin_code'),
            number_of_spots=data.get('number_of_spots', 0),
            price_per_hour=data.get('price_per_hour')
        )
        db.session.add(lot)
        db.session.flush()
        for i in range(lot.number_of_spots):
            spot = ParkingSpot(
                lot_id=lot.id,
                name=f"{lot.prime_location_name}_Spot{i + 1}",
                status='A'
            )
            db.session.add(spot)
        db.session.commit()
        return jsonify({'message': 'Parking lot created successfully'}), 201
    except Exception as e:
        app.logger.error(f"Error in create_parking_lot: {str(e)}")
        return jsonify({'error': f'Failed to create parking lot: {str(e)}'}), 500

@app.route("/api/parking-lots/<int:lot_id>", methods=["PUT"])
@auth_required('token')
@roles_required('admin')
def update_parking_lot(lot_id):
    try:
        lot = ParkingLot.query.get_or_404(lot_id)
        data = request.json
        old_name = lot.prime_location_name
        lot.prime_location_name = data.get('prime_location_name', lot.prime_location_name)
        lot.address = data.get('address', lot.address)
        lot.pin_code = data.get('pin_code', lot.pin_code)
        lot.price_per_hour = data.get('price_per_hour', lot.price_per_hour)
        new_spots = data.get('number_of_spots', lot.number_of_spots)
        if new_spots > lot.number_of_spots:
            for i in range(lot.number_of_spots, new_spots):
                spot = ParkingSpot(
                    lot_id=lot.id,
                    name=f"{lot.prime_location_name}_Spot{i + 1}",
                    status='A'
                )
                db.session.add(spot)
        elif new_spots < lot.number_of_spots:
            excess_spots = ParkingSpot.query.filter_by(lot_id=lot.id, status='A').limit(lot.number_of_spots - new_spots).all()
            for spot in excess_spots:
                db.session.delete(spot)
        lot.number_of_spots = new_spots
        if old_name != lot.prime_location_name:
            spots = ParkingSpot.query.filter_by(lot_id=lot.id).order_by(ParkingSpot.id).all()
            for i, spot in enumerate(spots, 1):
                spot.name = f"{lot.prime_location_name}_Spot{i}"
        db.session.commit()
        return jsonify({'message': 'Parking lot updated successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error in update_parking_lot: {str(e)}")
        return jsonify({'error': f'Failed to update parking lot: {str(e)}'}), 500

@app.route("/api/parking-lots/<int:lot_id>", methods=["DELETE"])
@auth_required('token')
def delete_parking_lot(lot_id):
    # Optional: only allow admins
    if not current_user.has_role('admin'):
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        lot = ParkingLot.query.get_or_404(lot_id)

        # Optional: cascade delete spots if they exist
        for spot in lot.spots:
            db.session.delete(spot)

        db.session.delete(lot)
        db.session.commit()

        return jsonify({'message': f'Parking lot {lot.prime_location_name} deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_parking_lot: {str(e)}")
        return jsonify({'error': f'Failed to delete parking lot: {str(e)}'}), 500


@app.route("/api/parking-lots/<int:lot_id>/spots", methods=["POST"])
@auth_required('token')
@roles_required('admin')
def create_spot(lot_id):
    try:
        lot = ParkingLot.query.get_or_404(lot_id)
        data = request.json
        spot_count = ParkingSpot.query.filter_by(lot_id=lot_id).count()
        spot = ParkingSpot(
            lot_id=lot_id,
            name=f"{lot.prime_location_name}_Spot{spot_count + 1}",
            status=data.get('status', 'A')
        )
        db.session.add(spot)
        lot.number_of_spots += 1
        db.session.commit()
        return jsonify({'message': 'Spot added successfully'}), 201
    except Exception as e:
        app.logger.error(f"Error in create_spot: {str(e)}")
        return jsonify({'error': f'Failed to add spot: {str(e)}'}), 500

@app.route("/api/parking-lots/<int:lot_id>/spots/<int:spot_id>", methods=["DELETE"])
@auth_required('token')
@roles_required('admin')
def delete_spot(lot_id, spot_id):
    try:
        spot = ParkingSpot.query.get_or_404(spot_id)
        if spot.lot_id != lot_id:
            return jsonify({'error': 'Spot does not belong to this lot'}), 400
        if Reservation.query.filter_by(spot_id=spot_id).first():
            return jsonify({'error': 'Cannot delete spot with active reservations'}), 400
        lot = ParkingLot.query.get(lot_id)
        lot.number_of_spots -= 1
        db.session.delete(spot)
        remaining_spots = ParkingSpot.query.filter_by(lot_id=lot_id).order_by(ParkingSpot.id).all()
        for i, s in enumerate(remaining_spots, 1):
            s.name = f"{lot.prime_location_name}_Spot{i}"
        db.session.commit()
        return jsonify({'message': 'Spot deleted successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error in delete_spot: {str(e)}")
        return jsonify({'error': f'Failed to delete spot: {str(e)}'}), 500

@app.route("/api/admin/reservations", methods=["GET"])
def get_reservations():
    try:
        reservations = Reservation.query.all()
        app.logger.info(f"Fetched {len(reservations)} reservations")
        result = []
        for r in reservations:
            spot = ParkingSpot.query.get(r.spot_id)
            if not spot:
                app.logger.warning(f"No ParkingSpot found for reservation {r.id}")
                continue
            lot = ParkingLot.query.get(spot.lot_id)
            if not lot:
                app.logger.warning(f"No ParkingLot found for spot {spot.id}")
                continue
            user = User.query.get(r.user_id)
            if not user:
                app.logger.warning(f"No User found for reservation {r.id}")
                continue
            result.append({
                'id': r.id,
                'parking_lot_name': lot.prime_location_name,
                'parking_lot_location': lot.address,
                'spot_name': spot.name,
                'customer_name': user.username,
                'status': r.status,
                'parking_timestamp': r.parking_timestamp.isoformat(),
                'leaving_timestamp': r.leaving_timestamp.isoformat() if r.leaving_timestamp else None,
                'parking_cost': float(r.parking_cost) if r.parking_cost else None,
                'remarks': r.remarks
            })
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error in get_reservations: {str(e)}")
        return jsonify({'error': f'Failed to fetch reservations: {str(e)}'}), 500

@app.route("/api/admin/ongoing-reservations", methods=["GET"])
def get_ongoing_reservations():
    try:
        reservations = Reservation.query.filter(Reservation.status != 'Paid').all()
        app.logger.info(f"Fetched {len(reservations)} ongoing reservations")
        result = []
        for r in reservations:
            spot = ParkingSpot.query.get(r.spot_id)
            if not spot:
                app.logger.warning(f"No ParkingSpot found for reservation {r.id}")
                continue
            lot = ParkingLot.query.get(spot.lot_id)
            if not lot:
                app.logger.warning(f"No ParkingLot found for spot {spot.id}")
                continue
            user = User.query.get(r.user_id)
            if not user:
                app.logger.warning(f"No User found for reservation {r.id}")
                continue
            result.append({
                'id': r.id,
                'parking_lot_name': lot.prime_location_name,
                'parking_lot_location': lot.address,
                'spot_name': spot.name,
                'customer_name': user.username,
                'status': r.status,
                'parking_timestamp': r.parking_timestamp.isoformat()
            })
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error in get_ongoing_reservations: {str(e)}")
        return jsonify({'error': f'Failed to fetch ongoing reservations: {str(e)}'}), 500

@app.route("/api/admin/parking-analytics", methods=["GET"])
@auth_required('token')
@roles_required('admin')
def get_parking_analytics():
    try:
        parking_lots = db.session.query(
            ParkingLot.prime_location_name,
            db.func.count(Reservation.id).label('reservations')
        ).outerjoin(Reservation, ParkingLot.id == Reservation.spot_id)\
         .group_by(ParkingLot.prime_location_name).all()
        users = db.session.query(
            User.username,
            db.func.count(Reservation.id).label('reservations')
        ).outerjoin(Reservation, User.id == Reservation.user_id)\
         .group_by(User.username).all()
        revenue = db.session.query(
            ParkingLot.prime_location_name,
            db.func.sum(Reservation.parking_cost).label('revenue')
        ).outerjoin(Reservation, ParkingLot.id == Reservation.spot_id)\
         .group_by(ParkingLot.prime_location_name).all()
        return jsonify({
            'parkingLots': [{'prime_location_name': name, 'reservations': reservations} for name, reservations in parking_lots],
            'users': [{'username': username, 'reservations': reservations} for username, reservations in users],
            'revenue': [{'prime_location_name': name, 'revenue': float(revenue) if revenue else 0} for name, revenue in revenue]
        }), 200
    except Exception as e:
        app.logger.error(f"Error in get_parking_analytics: {str(e)}")
        return jsonify({'error': f'Failed to fetch analytics: {str(e)}'}), 500

@app.route('/api/export', methods=['GET'])
@auth_required('token')
def export_csv():
    try:
        app.logger.info(f"Starting CSV export for user {current_user.id}")
        result = csv_report.delay(current_user.id)
        return jsonify({"id": result.id})
    except Exception as e:
        app.logger.error(f"Error initiating CSV export for user {current_user.id}: {str(e)}")
        return jsonify({"error": f"Failed to initiate CSV export: {str(e)}"}), 500

@app.route('/api/csv_result/<id>', methods=['GET'])
@auth_required('token')
def csv_result(id):
    try:
        res = AsyncResult(id)
        if res.ready():
            if res.successful() and res.result:
                app.logger.info(f"Serving CSV file: {res.result} for task {id}")
                return send_from_directory('static', res.result, as_attachment=True)
            else:
                app.logger.error(f"Task {id} failed or no result: {res.result}")
                return jsonify({"error": "Task failed or file not found"}), 500
        app.logger.info(f"Task {id} still processing")
        return jsonify({"status": "Processing", "id": id})
    except Exception as e:
        app.logger.error(f"Error in csv_result for task {id}: {str(e)}")
        return jsonify({"error": f"Failed to retrieve CSV: {str(e)}"}), 500