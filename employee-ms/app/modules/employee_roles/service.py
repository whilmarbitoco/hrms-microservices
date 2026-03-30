from app.modules.employee_roles.repository import EmployeeRoleRepository
from app.errors.handlers import NotFoundError, ConflictError, ValidationError


class EmployeeRoleService:
    def __init__(self, repository: EmployeeRoleRepository = None):
        self.repository = repository or EmployeeRoleRepository()

    def get_all(self):
        return self.repository.get_all()

    def get_by_id(self, id):
        role = self.repository.get_by_id(id)
        if not role:
            raise NotFoundError("Employee role not found")
        return role

    def create(self, name, description=None, level=None):
        if self.repository.get_by_name(name):
            raise ConflictError("Employee role with this name already exists")
        return self.repository.create(name, description, level)

    def update(self, id, data):
        role = self.get_by_id(id)
        if "name" in data and data["name"] != role.name:
            if self.repository.get_by_name(data["name"]):
                raise ConflictError("Employee role with this name already exists")
        return self.repository.update(role, data)

    def delete(self, id):
        role = self.get_by_id(id)
        if self.repository.has_active_employees(id):
            raise ValidationError("Cannot delete role with active employees assigned")
        self.repository.delete(role)

    def get_employees(self, id):
        self.get_by_id(id)
        return self.repository.get_employees(id)
