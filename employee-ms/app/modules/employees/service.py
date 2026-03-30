from datetime import date
from app.modules.employees.repository import EmployeeRepository
from app.errors.handlers import NotFoundError, ConflictError, ValidationError
from app.events.producer import publish


class EmployeeService:
    def __init__(self, repository: EmployeeRepository = None):
        self.repository = repository or EmployeeRepository()

    def _generate_employee_id(self):
        last = self.repository.get_last_employee_id()
        if not last:
            return "EMP001"
        num = int(last.replace("EMP", "")) + 1
        return f"EMP{num:03d}"

    def get_all(self, filters=None):
        return self.repository.get_all(filters)

    def get_by_id(self, id):
        employee = self.repository.get_by_id(id)
        if not employee:
            raise NotFoundError("Employee not found")
        return employee

    def create(self, name, email, actor_id, phone=None, department_id=None, role_id=None, manager_id=None, hired_at=None):
        if self.repository.get_by_email(email):
            raise ConflictError("Employee with this email already exists")
        employee_id = self._generate_employee_id()
        employee = self.repository.create(
            employee_id=employee_id, name=name, email=email, phone=phone,
            department_id=department_id, role_id=role_id, manager_id=manager_id,
            status="active", hired_at=hired_at or date.today(),
        )
        self.repository.add_history(employee.id, "hired", actor_id, {"employee_id": employee_id})
        publish("employee.created", {
            "employee_id": employee.employee_id,
            "name": employee.name,
            "department": employee.department.name if employee.department else None,
            "role": employee.role.name if employee.role else None,
            "status": employee.status,
        })
        return employee

    def update(self, id, data, actor_id):
        employee = self.get_by_id(id)
        if "email" in data and data["email"] != employee.email:
            if self.repository.get_by_email(data["email"]):
                raise ConflictError("Email already in use")
        updated = self.repository.update(employee, data)
        self.repository.add_history(id, "updated", actor_id, data)
        publish("employee.updated", {
            "employee_id": updated.employee_id,
            "name": updated.name,
            "department": updated.department.name if updated.department else None,
            "role": updated.role.name if updated.role else None,
            "status": updated.status,
        })
        return updated

    def delete(self, id):
        employee = self.get_by_id(id)
        if employee.status != "terminated":
            raise ValidationError("Only terminated employees can be deleted")
        self.repository.delete(employee)

    def terminate(self, id, reason, actor_id, terminated_at=None):
        employee = self.get_by_id(id)
        if employee.status != "active":
            raise ValidationError("Only active employees can be terminated")
        self.repository.update(employee, {
            "status": "terminated",
            "terminated_at": terminated_at or date.today(),
        })
        self.repository.add_history(id, "terminated", actor_id, {"reason": reason})
        publish("employee.terminated", {
            "employee_id": employee.employee_id,
            "status": "terminated",
            "reason": reason,
        })
        return employee

    def rehire(self, id, department_id, role_id, actor_id, hired_at=None):
        employee = self.get_by_id(id)
        if employee.status != "terminated":
            raise ValidationError("Only terminated employees can be rehired")
        self.repository.update(employee, {
            "status": "active",
            "department_id": department_id,
            "role_id": role_id,
            "hired_at": hired_at or date.today(),
            "terminated_at": None,
        })
        self.repository.add_history(id, "rehired", actor_id, {
            "department_id": department_id, "role_id": role_id,
        })
        publish("employee.rehired", {
            "employee_id": employee.employee_id,
            "status": "active",
            "department_id": department_id,
            "role_id": role_id,
        })
        return employee

    def get_history(self, id):
        self.get_by_id(id)
        return self.repository.get_history(id)

    def get_subordinates(self, id):
        self.get_by_id(id)
        return self.repository.get_subordinates(id)
