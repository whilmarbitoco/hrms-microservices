from app.modules.payslips.repository import PayslipRepository
from app.errors.handlers import NotFoundError, ValidationError, ForbiddenError


class PayslipService:
    def __init__(self, repository: PayslipRepository = None):
        self.repository = repository or PayslipRepository()

    def get_all(self, filters=None):
        return self.repository.get_all(filters)

    def get_by_id(self, id):
        payslip = self.repository.get_by_id(id)
        if not payslip:
            raise NotFoundError("Payslip not found")
        return payslip

    def get_by_employee_id(self, employee_id):
        return self.repository.get_by_employee_id(employee_id)

    def get_by_batch_id(self, batch_id):
        return self.repository.get_by_batch_id(batch_id)

    def update_status(self, id, status):
        if status not in ("sent", "acknowledged"):
            raise ValidationError("Status must be 'sent' or 'acknowledged'")
        payslip = self.get_by_id(id)
        return self.repository.update(payslip, {"status": status})
