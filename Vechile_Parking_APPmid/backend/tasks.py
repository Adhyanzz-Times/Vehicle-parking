from celery import shared_task
from backend.database import db
from backend.models import User, Reservation, ParkingLot, ParkingSpot
from backend.utils import format_report
from .mail import send_email
from datetime import datetime
import csv
import requests
from flask import current_app as app
from collections import Counter

@shared_task(ignore_result=True, name="daily_reminder")
def daily_reminder():
    with app.app_context():
        app.logger.info("Starting daily_reminder task")
        pending_reservations = Reservation.query.filter_by(status='Booked').all()
        app.logger.info(f"Found {len(pending_reservations)} booked reservations")
        users = set([User.query.get(res.user_id) for res in pending_reservations if res.user_id])
        app.logger.info(f"Found {len(users)} unique users with booked reservations")
        webhook_url = "https://chat.googleapis.com/v1/spaces/AAQAaQG-DRc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=iHeZmXH9YZFrB37mrwMGTXuWc2knq_qYDLWgvp9oHKM"
        for user in users:
            if user and user.active:
                msg = f"Reminder: You have a booked parking spot that is not yet parked. Please park your vehicle or book a new spot if needed."
                payload = {"text": f"{user.username}: {msg}"}
                try:
                    app.logger.info(f"Sending webhook to {user.username} at {webhook_url}")
                    response = requests.post(webhook_url, json=payload)
                    response.raise_for_status()
                    app.logger.info(f"Sent reminder to {user.username}, status: {response.status_code}, response: {response.text}")
                except requests.exceptions.RequestException as e:
                    app.logger.error(f"Failed to send Google Chat message to {user.username}: {str(e)}, response: {response.text if 'response' in locals() else 'No response'}")
            else:
                app.logger.info(f"Skipping user {user.username if user else 'None'}: not active or invalid")
        app.logger.info("Daily reminders completed")
        return "Daily reminders sent"

@shared_task(ignore_result=True, name="monthly_report")
def monthly_report():
    with app.app_context():
        app.logger.info("Starting monthly_report task")
        users = User.query.filter(User.roles.any(name='customer')).all()
        app.logger.info(f"Found {len(users)} users with 'user' role")
        for user in users:
            if not user.active:
                app.logger.info(f"Skipping inactive user: {user.username}")
                continue
            reservations = Reservation.query.filter_by(user_id=user.id).all()
            if not reservations:
                app.logger.info(f"No reservations for user: {user.username}")
                continue
            app.logger.info(f"Processing {len(reservations)} reservations for {user.username}")
            lot_ids = [res.spot.lot_id for res in reservations if res.spot]
            lot_counts = Counter(lot_ids)
            most_used_lot_id = lot_counts.most_common(1)[0][0] if lot_counts else None
            most_used_lot = ParkingLot.query.get(most_used_lot_id) if most_used_lot_id else None
            total_cost = sum(res.parking_cost or 0 for res in reservations)
            user_data = {
                'username': user.username,
                'email': user.email,
                'total_bookings': len(reservations),
                'most_used_lot': most_used_lot.prime_location_name if most_used_lot else 'N/A',
                'total_cost': round(total_cost, 2),
                'reservations': [
                    {
                        'lot_name': ParkingLot.query.get(res.spot.lot_id).prime_location_name if res.spot and res.spot.lot_id else 'N/A',
                        'spot_name': res.spot.name if res.spot else 'N/A',
                        'status': res.status,
                        'parking_timestamp': res.parking_timestamp.strftime('%Y-%m-%d %H:%M') if res.parking_timestamp else 'N/A',
                        'leaving_timestamp': res.leaving_timestamp.strftime('%Y-%m-%d %H:%M') if res.leaving_timestamp else 'N/A',
                        'parking_cost': round(float(res.parking_cost), 2) if res.parking_cost else 0
                    } for res in reservations
                ]
            }
            try:
                app.logger.info(f"Rendering report template for {user.email}")
                message = format_report('templates/mail_details.html', user_data)
                app.logger.info(f"Sending report to {user.email}")
                success = send_email(user.email, subject="Your Monthly Parking Activity Report", message=message, content="html")
                if not success:
                    app.logger.error(f"Failed to send monthly report to {user.email}")
                else:
                    app.logger.info(f"Sent monthly report to {user.email}")
            except Exception as e:
                app.logger.error(f"Error processing report for {user.email}: {str(e)}")
        app.logger.info("Monthly reports completed")
        return "Monthly reports processed"


@shared_task(ignore_result=False, name="download_csv_report")
def csv_report(user_id):
    with app.app_context():
        try:
            app.logger.info(f"Starting CSV generation for user_id: {user_id}")
            user = User.query.get(user_id)
            if not user:
                app.logger.error(f"User not found: {user_id}")
                raise ValueError(f"User not found: {user_id}")
            reservations = Reservation.query.filter_by(user_id=user_id).all()
            filename = f"parking_history_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
            filepath = f"static/{filename}"
            app.logger.info(f"Generating CSV at: {filepath}")
            with open(filepath, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['Reservation ID', 'Parking Lot', 'Spot Name', 'Parking Timestamp', 'Leaving Timestamp', 'Cost', 'Status', 'Remarks'])
                for res in reservations:
                    lot = ParkingLot.query.get(res.spot.lot_id) if res.spot and res.spot.lot_id else None
                    writer.writerow([
                        res.id,
                        lot.prime_location_name if lot else 'N/A',
                        res.spot.name if res.spot else 'N/A',
                        res.parking_timestamp.strftime('%Y-%m-%d %H:%M') if res.parking_timestamp else 'N/A',
                        res.leaving_timestamp.strftime('%Y-%m-%d %H:%M') if res.leaving_timestamp else 'N/A',
                        round(float(res.parking_cost), 2) if res.parking_cost else 0,
                        res.status,
                        res.remarks or 'N/A'
                    ])
            app.logger.info(f"CSV generated successfully: {filepath}")
            return filename
        except Exception as e:
            app.logger.error(f"Error generating CSV for user {user_id}: {str(e)}")
            raise








