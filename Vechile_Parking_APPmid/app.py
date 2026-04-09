from flask import Flask
from backend.config import localdevelopmentConfig
from backend.models import db, User, Role
from flask_security import Security, SQLAlchemyUserDatastore
from flask_security import hash_password
from backend.celery_init import celery_init_app
from backend.tasks import daily_reminder, monthly_report  # Explicitly import tasks
from celery.schedules import crontab
import logging
app = None

def create_app():
    app = Flask(__name__)
    app.config.from_object(localdevelopmentConfig)
    app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = 'Authentication-Token'
    app.config['SECURITY_TOKEN_AUTHENTICATION_KEY'] = 'token'
    app.config['SECURITY_LOGIN_URL'] = '/login'
    app.config['SECURITY_LOGOUT_URL'] = '/logout'
    app.config['SECURITY_POST_LOGIN_VIEW'] = '/'
    app.config['SECURITY_POST_LOGOUT_VIEW'] = '/'
    app.config['SECURITY_UNAUTHORIZED_VIEW'] = '/login'
    db.init_app(app)
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    app.app_context().push()
    # Configure logging
    app.logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    app.logger.addHandler(handler)
    return app

app = create_app()
celery = celery_init_app(app)
celery.autodiscover_tasks()

with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name="admin", description="This is an admin.")
    app.security.datastore.find_or_create_role(name="customer", description="This is a customer.")
    db.session.commit()

    if not app.security.datastore.find_user(email="user@admin.com"):
        app.security.datastore.create_user(
            email="user@admin.com",
            username="admin01",
            password=hash_password("1234"),
            roles=["admin"]
        )
        db.session.commit()
    # if not app.security.datastore.find_user(email="user1@user.com"):
    #     app.security.datastore.create_user(
    #         email="user1@user.com",
    #         username="user01",
    #         password=hash_password("1234"),
    #         roles=["customer"]
    #     )
    #     db.session.commit()

from backend.routes import *

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(minute='*/1'),  # Every minute for testing
        daily_reminder.s(),
        name='Daily Reminder every minute'
    )
    
    sender.add_periodic_task(
        crontab(minute='*/1'),  # Every minute for testing
        monthly_report.s(),
        name='Monthly Report every minute'
    )

if __name__ == "__main__":
    app.run(debug=True)