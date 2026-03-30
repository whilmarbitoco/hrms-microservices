from flask import Blueprint, jsonify
from app.extensions import limiter
from app.utils.permissions import require_permission
from app.modules.employee_cache.service import EmployeeCacheService
from app.modules.employee_cache.model import EmployeeCacheRead

employee_cache_bp = Blueprint("employee_cache", __name__, url_prefix="/leave/employees")

service = EmployeeCacheService()
read_schema = EmployeeCacheRead()


@employee_cache_bp.route("", methods=["GET"])
@require_permission("leave_request.view")
@limiter.limit("30 per minute")
def list_cached_employees():
    return jsonify(read_schema.dump(service.get_all(), many=True)), 200


@employee_cache_bp.route("/<string:employee_id>", methods=["GET"])
@require_permission("leave_request.view")
@limiter.limit("30 per minute")
def get_cached_employee(employee_id):
    return jsonify(read_schema.dump(service.get_by_employee_id(employee_id))), 200
