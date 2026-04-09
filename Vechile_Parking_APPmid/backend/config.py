class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class localdevelopmentConfig(Config):
    # Configuration for db 
    SQLALCHEMY_DATABASE_URI = "sqlite:///securedb.sqlite3"
    DEBUG = True 

    #Configuration for security 
    SECRET_KEY = "this-is-a-secret-key" # Hasesh user credintials and store in sessions.
    SECURITY_PASSWORD_HASH = "bcrypt" # Mechanism to hash credentials and store in databases.
    SECURITY_PASSWORD_SALT = "this-is-a-secret-key" # this is a string that is used to hash the user credentials to store in databases by security-password_hash mechaism , (mentioned line jst above ).
    WTF_CSRF_ENABLED = False # Only for forms (frontend) ( set it true when u will add frontend for now it will be false ).
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token" # ?? by which name you will refrencening your aunthetication token .