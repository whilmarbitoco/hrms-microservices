from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.employee_roles.model import EmployeeRoleCreate, EmployeeRoleUpdate, EmployeeRolePatch, EmployeeRoleRead
from app.modules.employee_roles.service import EmployeeRoleService
from app.modules.employees.model import EmployeeRead
from app.errors.handlers import ValidationError

employee_roles_bp = Blueprint("employee_roles", __name__, url_prefix="/employee-roles")

service = EmployeeRoleService()
read_schema = EmployeeRoleRead()
employee_read_schema = EmployeeRead()


@employee_roles_bp.route("", methods=["GET"])
@require_permission("employee_role.view")
@limiter.limit("30 per minute")
def list_employee_roles():
    return jsonify(read_schema.dump(service.get_all(), many=True)), 200


@employee_roles_bp.route("/<int:id>", methods=["GET"])
@require_permission("employee_role.view")
@limiter.limit("30 per minute")
def get_employee_role(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@employee_roles_bp.route("", methods=["POST"])
@require_permission("employee_role.create")
@limiter.limit("10 per minute")
def create_employee_role():
    try:
        data = EmployeeRoleCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.create(**data))), 201


@employee_roles_bp.route("/<int:id>", methods=["PUT"])
@require_permission("employee_role.update")
@limiter.limit("10 per minute")
def update_employee_role(id):
    try:
        data = EmployeeRoleUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@employee_roles_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("employee_role.update")
@limiter.limit("10 per minute")
def patch_employee_role(id):
    try:
        data = EmployeeRolePatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@employee_roles_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("employee_role.delete")
@limiter.limit("10 per minute")
def delete_employee_role(id):
    service.delete(id)
    return jsonify({"message": "Employee role deleted"}), 200


@employee_roles_bp.route("/<int:id>/employees", methods=["GET"])
@require_permission("employee_role.view")
@limiter.limit("30 per minute")
def get_role_employees(id):
    return jsonify(employee_read_schema.dump(service.get_employees(id), many=True)), 200
