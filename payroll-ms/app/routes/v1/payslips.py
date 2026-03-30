from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.payslips.model import PayslipRead, PayslipPatch
from app.modules.payslips.service import PayslipService
from app.errors.handlers import ValidationError

payslips_bp = Blueprint("payslips", __name__, url_prefix="/payroll/payslips")

service = PayslipService()
read_schema = PayslipRead()


@payslips_bp.route("", methods=["GET"])
@require_permission("payslip.view")
@limiter.limit("30 per minute")
def list_payslips():
    filters = {k: v for k, v in request.args.items() if v}
    return jsonify(read_schema.dump(service.get_all(filters), many=True)), 200


@payslips_bp.route("/<int:id>", methods=["GET"])
@require_permission("payslip.view")
@limiter.limit("30 per minute")
def get_payslip(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@payslips_bp.route("/employee/<string:employee_id>", methods=["GET"])
@require_permission("payslip.view")
@limiter.limit("30 per minute")
def get_employee_payslips(employee_id):
    return jsonify(read_schema.dump(service.get_by_employee_id(employee_id), many=True)), 200


@payslips_bp.route("/batch/<int:batch_id>", methods=["GET"])
@require_permission("payslip.view")
@limiter.limit("30 per minute")
def get_batch_payslips(batch_id):
    return jsonify(read_schema.dump(service.get_by_batch_id(batch_id), many=True)), 200


@payslips_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("payslip.view")
@limiter.limit("10 per minute")
def update_payslip_status(id):
    try:
        data = PayslipPatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update_status(id, data["status"]))), 200
