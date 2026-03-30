from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.salary_components.model import SalaryComponentCreate, SalaryComponentUpdate, SalaryComponentPatch, SalaryComponentRead
from app.modules.salary_components.service import SalaryComponentService
from app.errors.handlers import ValidationError

salary_components_bp = Blueprint("salary_components", __name__, url_prefix="/payroll/salary-components")

service = SalaryComponentService()
read_schema = SalaryComponentRead()


@salary_components_bp.route("", methods=["GET"])
@require_permission("salary_component.view")
@limiter.limit("30 per minute")
def list_salary_components():
    filters = {k: v for k, v in request.args.items() if v}
    return jsonify(read_schema.dump(service.get_all(filters), many=True)), 200


@salary_components_bp.route("/<int:id>", methods=["GET"])
@require_permission("salary_component.view")
@limiter.limit("30 per minute")
def get_salary_component(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@salary_components_bp.route("", methods=["POST"])
@require_permission("salary_component.create")
@limiter.limit("10 per minute")
def create_salary_component():
    try:
        data = SalaryComponentCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.create(**data))), 201


@salary_components_bp.route("/<int:id>", methods=["PUT"])
@require_permission("salary_component.update")
@limiter.limit("10 per minute")
def update_salary_component(id):
    try:
        data = SalaryComponentUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@salary_components_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("salary_component.update")
@limiter.limit("10 per minute")
def patch_salary_component(id):
    try:
        data = SalaryComponentPatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@salary_components_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("salary_component.delete")
@limiter.limit("10 per minute")
def delete_salary_component(id):
    service.delete(id)
    return jsonify({"message": "Salary component deleted"}), 200


@salary_components_bp.route("/employee/<string:employee_id>", methods=["GET"])
@require_permission("salary_component.view")
@limiter.limit("30 per minute")
def get_employee_salary_components(employee_id):
    return jsonify(read_schema.dump(service.get_by_employee_id(employee_id), many=True)), 200
