broker_url = "redis://localhost:6379/0"
result_backend = "redis://localhost:6379/1"

# Correct timezone key (case-sensitive)
timezone = "Asia/Kolkata"

broker_connection_retry_on_startup = True

# Tell Celery Beat to use a JSON file for schedule storage (avoids gdbm errors on Windows)
beat_schedule_filename = "celerybeat-schedule.json"
