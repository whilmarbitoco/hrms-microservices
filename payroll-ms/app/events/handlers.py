from app.modules.employee_cache.repository import EmployeeCacheRepository


def handle_employee_created(data):
    EmployeeCacheRepository().upsert(
        employee_id=data["employee_id"],
        name=data["name"],
        department=data.get("department"),
        role=data.get("role"),
        status=data.get("status", "active"),
    )


def handle_employee_updated(data):
    EmployeeCacheRepository().upsert(
        employee_id=data["employee_id"],
        name=data["name"],
        department=data.get("department"),
        role=data.get("role"),
        status=data.get("status", "active"),
    )


def handle_employee_terminated(data):
    EmployeeCacheRepository().set_status(data["employee_id"], "terminated")


def handle_employee_rehired(data):
    EmployeeCacheRepository().set_status(data["employee_id"], "active")


def handle_leave_approved(data):
    from app.modules.adjustments.repository import AdjustmentRepository
    if data.get("leave_type") == "unpaid" and data.get("batch_id"):
        AdjustmentRepository().create(
            employee_id=data["employee_id"],
            batch_id=data["batch_id"],
            type="deduction",
            amount=data.get("amount", 0),
            reason=f"Unpaid leave deduction: {data.get('leave_request_id')}",
            created_by=None,
        )
