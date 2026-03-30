from app.modules.salary_components.repository import SalaryComponentRepository
from app.errors.handlers import NotFoundError, ValidationError


class SalaryComponentService:
    def __init__(self, repository: SalaryComponentRepository = None):
        self.repository = repository or SalaryComponentRepository()

    def get_all(self, filters=None):
        return self.repository.get_all(filters)

    def get_by_id(self, id):
        component = self.repository.get_by_id(id)
        if not component:
            raise NotFoundError("Salary component not found")
        return component

    def get_by_employee_id(self, employee_id):
        return self.repository.get_by_employee_id(employee_id)

    def create(self, employee_id, type, name, amount):
        return self.repository.create(employee_id, type, name, amount)

    def update(self, id, data):
        component = self.get_by_id(id)
        return self.repository.update(component, data)

    def delete(self, id):
        component = self.get_by_id(id)
        if self.repository.is_used_in_processed_batch(id):
            raise ValidationError("Cannot delete a component used in a processed batch")
        self.repository.delete(component)
