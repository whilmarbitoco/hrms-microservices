from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.departments.model import DepartmentCreate, DepartmentUpdate, DepartmentPatch, DepartmentRead
from app.modules.departments.service import DepartmentService
from app.modules.employees.model import EmployeeRead
from app.errors.handlers import ValidationError

departments_bp = Blueprint("departments", __name__, url_prefix="/departments")

service = DepartmentService()
read_schema = DepartmentRead()
employee_read_schema = EmployeeRead()


@departments_bp.route("", methods=["GET"])
@require_permission("department.view")
@limiter.limit("30 per minute")
def list_departments():
    return jsonify(read_schema.dump(service.get_all(), many=True)), 200


@departments_bp.route("/<int:id>", methods=["GET"])
@require_permission("department.view")
@limiter.limit("30 per minute")
def get_department(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@departments_bp.route("", methods=["POST"])
@require_permission("department.create")
@limiter.limit("10 per minute")
def create_department():
    try:
        data = DepartmentCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.create(**data))), 201


@departments_bp.route("/<int:id>", methods=["PUT"])
@require_permission("department.update")
@limiter.limit("10 per minute")
def update_department(id):
    try:
        data = DepartmentUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@departments_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("department.update")
@limiter.limit("10 per minute")
def patch_department(id):
    try:
        data = DepartmentPatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    return jsonify(read_schema.dump(service.update(id, data))), 200


@departments_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("department.delete")
@limiter.limit("10 per minute")
def delete_department(id):
    service.delete(id)
    return jsonify({"message": "Department deleted"}), 200


@departments_bp.route("/<int:id>/employees", methods=["GET"])
@require_permission("department.view")
@limiter.limit("30 per minute")
def get_department_employees(id):
    return jsonify(employee_read_schema.dump(service.get_employees(id), many=True)), 200
