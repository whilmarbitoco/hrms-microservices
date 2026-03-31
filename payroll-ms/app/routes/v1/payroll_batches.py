from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.payroll_batches.model import PayrollBatchCreate, PayrollBatchUpdate, PayrollBatchPatch, PayrollBatchRead
from app.modules.payroll_batches.service import PayrollBatchService
from app.errors.handlers import ValidationError

payroll_batches_bp = Blueprint("payroll_batches", __name__, url_prefix="/payroll/batches")

service = PayrollBatchService()
read_schema = PayrollBatchRead()


@payroll_batches_bp.route("", methods=["GET"])
@require_permission("payroll.view")
@limiter.limit("30 per minute")
def list_batches():
    filters = {k: v for k, v in request.args.items() if v}
    return jsonify(read_schema.dump(service.get_all(filters), many=True)), 200


@payroll_batches_bp.route("/<int:id>", methods=["GET"])
@require_permission("payroll.view")
@limiter.limit("30 per minute")
def get_batch(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@payroll_batches_bp.route("", methods=["POST"])
@require_permission("payroll.create")
@limiter.limit("10 per minute")
def create_batch():
    try:
        data = PayrollBatchCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    created_by = get_jwt().get("email", "unknown")
    return jsonify(read_schema.dump(service.create(created_by=created_by, **data))), 201


@payroll_batches_bp.route("/<int:id>", methods=["PUT"])
@require_permission("payroll.create")
@limiter.limit("10 per minute")
def update_batch(id):
    try:
        data = PayrollBatchUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@payroll_batches_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("payroll.create")
@limiter.limit("10 per minute")
def patch_batch(id):
    try:
        data = PayrollBatchPatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@payroll_batches_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("payroll.create")
@limiter.limit("10 per minute")
def delete_batch(id):
    service.delete(id)
    return jsonify({"message": "Payroll batch deleted"}), 200


@payroll_batches_bp.route("/<int:id>/process", methods=["POST"])
@require_permission("payroll.process")
@limiter.limit("5 per minute")
def process_batch(id):
    return jsonify(read_schema.dump(service.process(id))), 200
