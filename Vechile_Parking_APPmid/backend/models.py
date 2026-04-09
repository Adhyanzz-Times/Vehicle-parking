from .database import db
from flask_security import UserMixin, RoleMixin
from datetime import datetime

class User(db.Model, UserMixin):  # user (Table name)
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)  # used for login
    username = db.Column(db.String, unique=True, nullable=False)  # visible username
    password = db.Column(db.String, nullable=False)  # hashed password
    fs_uniquifier = db.Column(db.String, unique=True, nullable=False)
    active = db.Column(db.Boolean, nullable=False)
    roles = db.relationship('Role', secondary='user_roles', backref='users')
    reservations = db.relationship('Reservation', backref='bearer')

class Role(db.Model, RoleMixin):  # role (Table name)
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String)

class UserRoles(db.Model):  # user_roles (association table)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class ParkingLot(db.Model):  # parking_lot (Table name)
    id = db.Column(db.Integer, primary_key=True)
    prime_location_name = db.Column(db.String, nullable=False)
    address = db.Column(db.String, nullable=False)
    pin_code = db.Column(db.String, nullable=False)
    price_per_hour = db.Column(db.Integer, nullable=False)
    number_of_spots = db.Column(db.Integer, nullable=False)
    spots = db.relationship('ParkingSpot', backref='lot')

class ParkingSpot(db.Model):  # parking_spot (Table name)
    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('parking_lot.id'))
    name = db.Column(db.String, nullable=False)  # Added name column for A_Spot1, B_Spot1, etc.
    status = db.Column(db.String, nullable=False, default='A')  # A = Available, B = Booked
    reservations = db.relationship('Reservation', backref='spot')

class Reservation(db.Model):  # reservation (Table name)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spot.id'))
    parking_timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    leaving_timestamp = db.Column(db.DateTime)
    parking_cost = db.Column(db.Float)
    remarks = db.Column(db.String)
    paid = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Integer)
    status = db.Column(db.String, nullable=False, default='Booked')  # Booked, Parked, Leaving, Paid