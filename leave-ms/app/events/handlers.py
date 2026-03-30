from app.modules.employee_cache.repository import EmployeeCacheRepository
from app.modules.leave_balances.repository import LeaveBalanceRepository


def handle_employee_created(data):
    EmployeeCacheRepository().upsert(
        employee_id=data["employee_id"],
        name=data["name"],
        department=data.get("department"),
        status=data.get("status", "active"),
    )
    LeaveBalanceRepository().initialize_for_employee(data["employee_id"])


def handle_employee_terminated(data):
    EmployeeCacheRepository().set_status(data["employee_id"], "terminated")


def handle_employee_rehired(data):
    EmployeeCacheRepository().set_status(data["employee_id"], "active")
    LeaveBalanceRepository().initialize_for_employee(data["employee_id"])
