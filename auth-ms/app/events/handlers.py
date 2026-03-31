from app.modules.users.repository import UserRepository


def handle_employee_terminated(data):
    """Deactivate user account when employee is terminated."""
    employee_id = data.get("employee_id")
    if not employee_id:
        return
    repo = UserRepository()
    user = next((u for u in repo.get_all() if u.employee_id == employee_id), None)
    if user:
        repo.update(user, {"is_active": False})


def handle_employee_rehired(data):
    """Reactivate user account when employee is rehired."""
    employee_id = data.get("employee_id")
    if not employee_id:
        return
    repo = UserRepository()
    user = next((u for u in repo.get_all() if u.employee_id == employee_id), None)
    if user:
        repo.update(user, {"is_active": True})
