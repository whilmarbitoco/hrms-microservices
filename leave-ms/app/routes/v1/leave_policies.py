from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.leave_policies.model import LeavePolicyCreate, LeavePolicyUpdate, LeavePolicyPatch, LeavePolicyRead
from app.modules.leave_policies.service import LeavePolicyService
from app.errors.handlers import ValidationError

leave_policies_bp = Blueprint("leave_policies", __name__, url_prefix="/leave/policies")

service = LeavePolicyService()
read_schema = LeavePolicyRead()


@leave_policies_bp.route("", methods=["GET"])
@require_permission("leave_policy.view")
@limiter.limit("30 per minute")
def list_policies():
    return jsonify(read_schema.dump(service.get_all(), many=True)), 200


@leave_policies_bp.route("/<int:id>", methods=["GET"])
@require_permission("leave_policy.view")
@limiter.limit("30 per minute")
def get_policy(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@leave_policies_bp.route("", methods=["POST"])
@require_permission("leave_policy.create")
@limiter.limit("10 per minute")
def create_policy():
    try:
        data = LeavePolicyCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.create(**data))), 201


@leave_policies_bp.route("/<int:id>", methods=["PUT"])
@require_permission("leave_policy.update")
@limiter.limit("10 per minute")
def update_policy(id):
    try:
        data = LeavePolicyUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@leave_policies_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("leave_policy.update")
@limiter.limit("10 per minute")
def patch_policy(id):
    try:
        data = LeavePolicyPatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@leave_policies_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("leave_policy.delete")
@limiter.limit("10 per minute")
def delete_policy(id):
    service.delete(id)
    return jsonify({"message": "Leave policy deleted"}), 200
