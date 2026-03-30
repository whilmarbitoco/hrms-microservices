from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.adjustments.model import AdjustmentCreate, AdjustmentUpdate, AdjustmentPatch, AdjustmentRead
from app.modules.adjustments.service import AdjustmentService
from app.errors.handlers import ValidationError

adjustments_bp = Blueprint("adjustments", __name__, url_prefix="/payroll/adjustments")

service = AdjustmentService()
read_schema = AdjustmentRead()


@adjustments_bp.route("", methods=["GET"])
@require_permission("adjustment.view")
@limiter.limit("30 per minute")
def list_adjustments():
    filters = {k: v for k, v in request.args.items() if v}
    return jsonify(read_schema.dump(service.get_all(filters), many=True)), 200


@adjustments_bp.route("/<int:id>", methods=["GET"])
@require_permission("adjustment.view")
@limiter.limit("30 per minute")
def get_adjustment(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@adjustments_bp.route("", methods=["POST"])
@require_permission("adjustment.create")
@limiter.limit("10 per minute")
def create_adjustment():
    try:
        data = AdjustmentCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    created_by = int(get_jwt_identity())
    return jsonify(read_schema.dump(service.create(created_by=created_by, **data))), 201


@adjustments_bp.route("/<int:id>", methods=["PUT"])
@require_permission("adjustment.update")
@limiter.limit("10 per minute")
def update_adjustment(id):
    try:
        data = AdjustmentUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@adjustments_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("adjustment.update")
@limiter.limit("10 per minute")
def patch_adjustment(id):
    try:
        data = AdjustmentPatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@adjustments_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("adjustment.delete")
@limiter.limit("10 per minute")
def delete_adjustment(id):
    service.delete(id)
    return jsonify({"message": "Adjustment deleted"}), 200


@adjustments_bp.route("/employee/<string:employee_id>", methods=["GET"])
@require_permission("adjustment.view")
@limiter.limit("30 per minute")
def get_employee_adjustments(employee_id):
    return jsonify(read_schema.dump(service.get_by_employee_id(employee_id), many=True)), 200
