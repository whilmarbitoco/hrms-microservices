from app.modules.leave_policies.repository import LeavePolicyRepository
from app.errors.handlers import NotFoundError, ConflictError, ValidationError


class LeavePolicyService:
    def __init__(self, repository: LeavePolicyRepository = None):
        self.repository = repository or LeavePolicyRepository()

    def get_all(self):
        return self.repository.get_all()

    def get_by_id(self, id):
        policy = self.repository.get_by_id(id)
        if not policy:
            raise NotFoundError("Leave policy not found")
        return policy

    def create(self, name, type, max_days, accrual_rate, accrual_frequency):
        if self.repository.get_by_name(name):
            raise ConflictError("Leave policy with this name already exists")
        return self.repository.create(name, type, max_days, accrual_rate, accrual_frequency)

    def update(self, id, data):
        policy = self.get_by_id(id)
        if "name" in data and data["name"] != policy.name:
            if self.repository.get_by_name(data["name"]):
                raise ConflictError("Leave policy with this name already exists")
        return self.repository.update(policy, data)

    def delete(self, id):
        policy = self.get_by_id(id)
        if self.repository.has_active_balances(id):
            raise ValidationError("Cannot delete policy with active leave balances")
        self.repository.delete(policy)
