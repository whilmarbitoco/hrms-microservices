from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.leave_balances.model import LeaveBalanceRead, LeaveBalancePatch, LeaveBalanceAccrue
from app.modules.leave_balances.service import LeaveBalanceService
from app.errors.handlers import ValidationError

leave_balances_bp = Blueprint("leave_balances", __name__, url_prefix="/leave/balances")

service = LeaveBalanceService()
read_schema = LeaveBalanceRead()


@leave_balances_bp.route("", methods=["GET"])
@require_permission("leave_balance.view")
@limiter.limit("30 per minute")
def list_balances():
    filters = {k: v for k, v in request.args.items() if v}
    return jsonify(read_schema.dump(service.get_all(filters), many=True)), 200


@leave_balances_bp.route("/<string:employee_id>", methods=["GET"])
@require_permission("leave_balance.view")
@limiter.limit("30 per minute")
def get_employee_balances(employee_id):
    return jsonify(read_schema.dump(service.get_by_employee_id(employee_id), many=True)), 200


@leave_balances_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("leave_balance.adjust")
@limiter.limit("10 per minute")
def adjust_balance(id):
    try:
        data = LeaveBalancePatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.adjust(id, **data))), 200


@leave_balances_bp.route("/accrue", methods=["POST"])
@require_permission("leave_balance.adjust")
@limiter.limit("5 per minute")
def accrue_balances():
    try:
        data = LeaveBalanceAccrue().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    service.accrue(data.get("employee_id"))
    return jsonify({"message": "Accrual completed"}), 200
