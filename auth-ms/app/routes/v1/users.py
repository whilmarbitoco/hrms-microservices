from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.users.model import UserCreateSchema, UserRoleSchema, UserResetPasswordSchema, UserRead
from app.modules.users.service import UserService
from app.errors.handlers import ValidationError

users_bp = Blueprint("users", __name__, url_prefix="/auth/users")

service = UserService()
read_schema = UserRead()


@users_bp.route("", methods=["GET"])
@require_permission("user.view")
@limiter.limit("30 per minute")
def list_users():
    return jsonify(read_schema.dump(service.get_all(), many=True)), 200


@users_bp.route("/<int:id>", methods=["GET"])
@require_permission("user.view")
@limiter.limit("30 per minute")
def get_user(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@users_bp.route("", methods=["POST"])
@require_permission("user.create")
@limiter.limit("10 per minute")
def create_user():
    try:
        data = UserCreateSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.create(**data))), 201


@users_bp.route("/<int:id>/role", methods=["PATCH"])
@require_permission("user.assign_role")
@limiter.limit("10 per minute")
def assign_role(id):
    try:
        data = UserRoleSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.assign_role(id, data["role_id"]))), 200


@users_bp.route("/<int:id>/deactivate", methods=["PATCH"])
@require_permission("user.deactivate")
@limiter.limit("10 per minute")
def deactivate_user(id):
    return jsonify(read_schema.dump(service.deactivate(id))), 200


@users_bp.route("/<int:id>/reactivate", methods=["PATCH"])
@require_permission("user.reactivate")
@limiter.limit("10 per minute")
def reactivate_user(id):
    return jsonify(read_schema.dump(service.reactivate(id))), 200


@users_bp.route("/<int:id>/reset-password", methods=["POST"])
@require_permission("user.reset_password")
@limiter.limit("10 per minute")
def reset_user_password(id):
    try:
        data = UserResetPasswordSchema().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    service.reset_password(id, data["new_password"])
    return jsonify({"message": "Password reset successfully"}), 200
