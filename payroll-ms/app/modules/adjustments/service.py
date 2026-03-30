from app.modules.adjustments.repository import AdjustmentRepository
from app.errors.handlers import NotFoundError, ValidationError


class AdjustmentService:
    def __init__(self, repository: AdjustmentRepository = None):
        self.repository = repository or AdjustmentRepository()

    def get_all(self, filters=None):
        return self.repository.get_all(filters)

    def get_by_id(self, id):
        adj = self.repository.get_by_id(id)
        if not adj:
            raise NotFoundError("Adjustment not found")
        return adj

    def get_by_employee_id(self, employee_id):
        return self.repository.get_by_employee_id(employee_id)

    def create(self, employee_id, batch_id, type, amount, reason, created_by):
        if self.repository.batch_is_processed(batch_id):
            raise ValidationError("Cannot add adjustment to a processed batch")
        return self.repository.create(employee_id, batch_id, type, amount, reason, created_by)

    def update(self, id, data):
        adj = self.get_by_id(id)
        if self.repository.batch_is_processed(adj.batch_id):
            raise ValidationError("Cannot modify adjustment in a processed batch")
        return self.repository.update(adj, data)

    def delete(self, id):
        adj = self.get_by_id(id)
        if self.repository.batch_is_processed(adj.batch_id):
            raise ValidationError("Cannot delete adjustment in a processed batch")
        self.repository.delete(adj)
