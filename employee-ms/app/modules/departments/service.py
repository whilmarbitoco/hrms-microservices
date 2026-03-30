from app.modules.departments.repository import DepartmentRepository
from app.errors.handlers import NotFoundError, ConflictError, ValidationError


class DepartmentService:
    def __init__(self, repository: DepartmentRepository = None):
        self.repository = repository or DepartmentRepository()

    def get_all(self):
        return self.repository.get_all()

    def get_by_id(self, id):
        dept = self.repository.get_by_id(id)
        if not dept:
            raise NotFoundError("Department not found")
        return dept

    def create(self, name, description=None, manager_id=None):
        if self.repository.get_by_name(name):
            raise ConflictError("Department with this name already exists")
        return self.repository.create(name, description, manager_id)

    def update(self, id, data):
        dept = self.get_by_id(id)
        if "name" in data and data["name"] != dept.name:
            if self.repository.get_by_name(data["name"]):
                raise ConflictError("Department with this name already exists")
        return self.repository.update(dept, data)

    def delete(self, id):
        dept = self.get_by_id(id)
        if self.repository.has_active_employees(id):
            raise ValidationError("Cannot delete department with active employees")
        self.repository.delete(dept)

    def get_employees(self, id):
        self.get_by_id(id)
        return self.repository.get_employees(id)
