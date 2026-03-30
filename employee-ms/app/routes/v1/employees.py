from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError as MarshmallowValidationError
from app.extensions import db, limiter
from app.utils.sanitizer import sanitize_dict
from app.utils.permissions import require_permission
from app.modules.employees.model import (
    EmployeeCreate, EmployeeUpdate, EmployeePatch,
    EmployeeTerminate, EmployeeRehire, EmployeeRead, EmployeeHistoryRead,
)
from app.modules.employees.service import EmployeeService
from app.errors.handlers import ValidationError
from app.database.schema import User

employees_bp = Blueprint("employees", __name__, url_prefix="/employees")

service = EmployeeService()
read_schema = EmployeeRead()
history_schema = EmployeeHistoryRead()


@employees_bp.route("", methods=["GET"])
@require_permission("employee.view")
@limiter.limit("30 per minute")
def list_employees():
    filters = {k: v for k, v in request.args.items() if v}
    return jsonify(read_schema.dump(service.get_all(filters), many=True)), 200


@employees_bp.route("/<int:id>", methods=["GET"])
@require_permission("employee.view")
@limiter.limit("30 per minute")
def get_employee(id):
    return jsonify(read_schema.dump(service.get_by_id(id))), 200


@employees_bp.route("", methods=["POST"])
@require_permission("employee.create")
@limiter.limit("10 per minute")
def create_employee():
    try:
        data = EmployeeCreate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    actor_id = int(get_jwt_identity())
    return jsonify(read_schema.dump(service.create(actor_id=actor_id, **data))), 201


@employees_bp.route("/<int:id>", methods=["PUT"])
@require_permission("employee.update")
@limiter.limit("10 per minute")
def update_employee(id):
    try:
        data = EmployeeUpdate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    actor_id = int(get_jwt_identity())
    return jsonify(read_schema.dump(service.update(id, data, actor_id))), 200


@employees_bp.route("/<int:id>", methods=["PATCH"])
@require_permission("employee.update")
@limiter.limit("10 per minute")
def patch_employee(id):
    try:
        data = EmployeePatch().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    actor_id = int(get_jwt_identity())
    return jsonify(read_schema.dump(service.update(id, data, actor_id))), 200


@employees_bp.route("/<int:id>", methods=["DELETE"])
@require_permission("employee.delete")
@limiter.limit("10 per minute")
def delete_employee(id):
    service.delete(id)
    return jsonify({"message": "Employee deleted"}), 200


@employees_bp.route("/<int:id>/terminate", methods=["POST"])
@require_permission("employee.terminate")
@limiter.limit("10 per minute")
def terminate_employee(id):
    try:
        data = EmployeeTerminate().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    actor_id = int(get_jwt_identity())
    return jsonify(read_schema.dump(service.terminate(id, actor_id=actor_id, **data))), 200


@employees_bp.route("/<int:id>/rehire", methods=["POST"])
@require_permission("employee.rehire")
@limiter.limit("10 per minute")
def rehire_employee(id):
    try:
        data = EmployeeRehire().load(sanitize_dict(request.json or {}))
    except MarshmallowValidationError as e:
        raise ValidationError(message=e.messages)
    actor_id = int(get_jwt_identity())
    return jsonify(read_schema.dump(service.rehire(id, actor_id=actor_id, **data))), 200


@employees_bp.route("/<int:id>/history", methods=["GET"])
@require_permission("employee.view")
@limiter.limit("30 per minute")
def get_employee_history(id):
    return jsonify(history_schema.dump(service.get_history(id), many=True)), 200


@employees_bp.route("/<int:id>/subordinates", methods=["GET"])
@require_permission("employee.view")
@limiter.limit("30 per minute")
def get_subordinates(id):
    return jsonify(read_schema.dump(service.get_subordinates(id), many=True)), 200
