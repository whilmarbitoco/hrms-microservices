from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.leave_requests.model import (
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestPatch,
    LeaveRequestReject, LeaveRequestRead,
)
from app.modules.leave_requests.service import LeaveRequestService
from app.errors.handlers import ValidationError

leave_requests_bp = Blueprint("leave_requests", __name__, url_prefix="/leave/requests")

service = LeaveRequestService()
read_schema = LeaveRequestRead()


@leave_requests_bp.route("", methods=["GET"])
@require_permission("leave_request.view")
@limiter.limit("30 per minute")
def list_requests():
    filters = {k: v for k, v in request.args.items() if v}
    return jsonify(read_schema.dump(service.get_all(filters), many=True)), 200


@leave_requests_bp.route("/<int:id>", methods=["GET"])
@require_permission("leave_request.view")
@limiter.limit("30 per minute")
def get_request(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@leave_requests_bp.route("", methods=["POST"])
@require_permission("leave_request.create")
@limiter.limit("10 per minute")
def create_request():
    try:
        data = LeaveRequestCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.create(**data))), 201


@leave_requests_bp.route("/<int:id>", methods=["PUT"])
@require_permission("leave_request.update")
@limiter.limit("10 per minute")
def update_request(id):
    try:
        data = LeaveRequestUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@leave_requests_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("leave_request.update")
@limiter.limit("10 per minute")
def patch_request(id):
    try:
        data = LeaveRequestPatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@leave_requests_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("leave_request.delete")
@limiter.limit("10 per minute")
def delete_request(id):
    service.delete(id)
    return jsonify({"message": "Leave request deleted"}), 200


@leave_requests_bp.route("/<int:id>/approve", methods=["POST"])
@require_permission("leave_request.approve")
@limiter.limit("10 per minute")
def approve_request(id):
    reviewer = get_jwt().get("email", "unknown")
    return jsonify(read_schema.dump(service.approve(id, reviewer))), 200


@leave_requests_bp.route("/<int:id>/reject", methods=["POST"])
@require_permission("leave_request.reject")
@limiter.limit("10 per minute")
def reject_request(id):
    try:
        data = LeaveRequestReject().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    reviewer = get_jwt().get("email", "unknown")
    return jsonify(read_schema.dump(service.reject(id, data["reason"], reviewer))), 200


@leave_requests_bp.route("/<int:id>/cancel", methods=["POST"])
@require_permission("leave_request.cancel")
@limiter.limit("10 per minute")
def cancel_request(id):
    return jsonify(read_schema.dump(service.cancel(id))), 200


@leave_requests_bp.route("/calendar", methods=["GET"])
@require_permission("leave_request.view")
@limiter.limit("30 per minute")
def get_calendar():
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")
    department_id = request.args.get("department_id")
    if not from_date or not to_date:
        raise ValidationError(message="from_date and to_date are required")
    from datetime import date
    return jsonify(read_schema.dump(
        service.get_calendar(date.fromisoformat(from_date), date.fromisoformat(to_date), department_id),
        many=True
    )), 200
