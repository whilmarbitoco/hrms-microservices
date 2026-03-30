import os

basedir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'app.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
    RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
    RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
    RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = 900
    JWT_REFRESH_TOKEN_EXPIRES = 2592000
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_CSRF_PROTECT = True

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    CORS_SUPPORTS_CREDENTIALS = True

    TALISMAN_FORCE_HTTPS = True
    TALISMAN_STRICT_TRANSPORT_SECURITY = True
    TALISMAN_CONTENT_SECURITY_POLICY = {
        "default-src": "'self'",
        "script-src": "'self'",
        "style-src": "'self'",
    }


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = False
    TALISMAN_FORCE_HTTPS = False


class ProductionConfig(BaseConfig):
    DEBUG = False

    def __init__(self):
        missing = [v for v in ("SECRET_KEY", "JWT_SECRET_KEY", "DATABASE_URL") if not os.getenv(v)]
        if missing:
            raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}")


class TestingConfig(BaseConfig):
    TESTING = True
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_COOKIE_SECURE = False
    TALISMAN_FORCE_HTTPS = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    RATELIMIT_ENABLED = False
    RATELIMIT_ENABLED = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
