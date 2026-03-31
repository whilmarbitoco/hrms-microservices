from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, set_refresh_cookies, unset_jwt_cookies
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.modules.auth.model import (
    RegisterSchema, LoginSchema, ChangePasswordSchema,
    ForgotPasswordSchema, ResetPasswordSchema, UserRead,
)
from app.modules.auth.service import AuthService
from app.errors.handlers import ValidationError

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

service = AuthService()
user_read = UserRead()


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per hour")
def register():
    try:
        data = RegisterSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    user = service.register(**data)
    return jsonify({"message": "Registered successfully", "user_id": user.id}), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    try:
        data = LoginSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    access_token, refresh_token, user = service.login(data["email"], data["password"])
    response = jsonify({
        "access_token": access_token,
        "user": user_read.dump(user),
    })
    set_refresh_cookies(response, refresh_token)
    return response, 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    access_token = service.refresh(get_jwt_identity())
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    response = jsonify({"message": "Logged out successfully"})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = service.get_me(get_jwt_identity())
    return jsonify(user_read.dump(user)), 200


@auth_bp.route("/me/password", methods=["PATCH"])
@jwt_required()
@limiter.limit("5 per hour")
def change_password():
    try:
        data = ChangePasswordSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    service.change_password(get_jwt_identity(), data["current_password"], data["new_password"])
    return jsonify({"message": "Password changed successfully"}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5 per hour")
def forgot_password():
    try:
        data = ForgotPasswordSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    token = service.forgot_password(data["email"])
    # In production, send email. For now return token in response for testing.
    return jsonify({"message": "If the email exists, a reset link has been sent", "reset_token": token}), 200


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5 per hour")
def reset_password():
    try:
        data = ResetPasswordSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    service.reset_password(data["token"], data["new_password"])
    return jsonify({"message": "Password reset successfully"}), 200
