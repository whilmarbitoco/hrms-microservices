import os
import uuid
from flask import Flask, jsonify, g, request
from app.errors.handlers import APIError
from app.core.logging import configure_logging
from app.core.config import config_map
from app.routes.health import health_bp
from app.routes.v1.employee_cache import employee_cache_bp
from app.routes.v1.leave_policies import leave_policies_bp
from app.routes.v1.leave_balances import leave_balances_bp
from app.routes.v1.leave_requests import leave_requests_bp
from .extensions import db, migrate, jwt, cors, limiter, talisman

env = os.getenv("FLASK_ENV", "development")


def create_app():
    app = Flask(__name__)
    app.config.from_object(config_map[env])

    configure_logging()

    @app.before_request
    def set_correlation_id():
        g.correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))

    @app.after_request
    def add_correlation_header(response):
        response.headers["X-Correlation-ID"] = getattr(g, "correlation_id", "")
        return response

    @app.errorhandler(APIError)
    def handle_api_error(error):
        return jsonify(error.to_json()), error.status_code

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=app.config["CORS_SUPPORTS_CREDENTIALS"])
    limiter.init_app(app)

    if app.config.get("TALISMAN_FORCE_HTTPS"):
        talisman.init_app(
            app,
            force_https=app.config["TALISMAN_FORCE_HTTPS"],
            strict_transport_security=app.config["TALISMAN_STRICT_TRANSPORT_SECURITY"],
            content_security_policy=app.config["TALISMAN_CONTENT_SECURITY_POLICY"],
        )

    app.register_blueprint(health_bp)
    app.register_blueprint(employee_cache_bp)
    app.register_blueprint(leave_policies_bp)
    app.register_blueprint(leave_balances_bp)
    app.register_blueprint(leave_requests_bp)

    if env != "testing":
        from app.events.consumer import start_consumer
        start_consumer(app)

    return app
