from app.modules.employee_cache.repository import EmployeeCacheRepository
from app.errors.handlers import NotFoundError


class EmployeeCacheService:
    def __init__(self, repository: EmployeeCacheRepository = None):
        self.repository = repository or EmployeeCacheRepository()

    def get_all(self):
        return self.repository.get_all()

    def get_by_employee_id(self, employee_id):
        record = self.repository.get_by_employee_id(employee_id)
        if not record:
            raise NotFoundError("Employee not found in cache")
        return record
