from app.modules.leave_balances.repository import LeaveBalanceRepository
from app.errors.handlers import NotFoundError


class LeaveBalanceService:
    def __init__(self, repository: LeaveBalanceRepository = None):
        self.repository = repository or LeaveBalanceRepository()

    def get_all(self, filters=None):
        return self.repository.get_all(filters)

    def get_by_employee_id(self, employee_id):
        return self.repository.get_by_employee_id(employee_id)

    def adjust(self, id, amount, reason=None):
        balance = self.repository.get_by_id(id)
        if not balance:
            raise NotFoundError("Leave balance not found")
        return self.repository.override(balance, amount)

    def accrue(self, employee_id=None):
        self.repository.accrue(employee_id)
