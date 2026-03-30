from decimal import Decimal
from app.modules.payroll_batches.repository import PayrollBatchRepository
from app.modules.salary_components.repository import SalaryComponentRepository
from app.modules.adjustments.repository import AdjustmentRepository
from app.modules.employee_cache.repository import EmployeeCacheRepository
from app.modules.payslips.repository import PayslipRepository
from app.errors.handlers import NotFoundError, ValidationError
from app.events.producer import publish


class PayrollBatchService:
    def __init__(self):
        self.repository = PayrollBatchRepository()
        self.salary_repo = SalaryComponentRepository()
        self.adjustment_repo = AdjustmentRepository()
        self.employee_repo = EmployeeCacheRepository()
        self.payslip_repo = PayslipRepository()

    def get_all(self, filters=None):
        return self.repository.get_all(filters)

    def get_by_id(self, id):
        batch = self.repository.get_by_id(id)
        if not batch:
            raise NotFoundError("Payroll batch not found")
        return batch

    def create(self, name, cycle, period_start, period_end, created_by):
        return self.repository.create(name, cycle, period_start, period_end, created_by)

    def update(self, id, data):
        batch = self.get_by_id(id)
        if batch.status != "draft":
            raise ValidationError("Only draft batches can be updated")
        return self.repository.update(batch, data)

    def delete(self, id):
        batch = self.get_by_id(id)
        if batch.status != "draft":
            raise ValidationError("Only draft batches can be deleted")
        self.repository.delete(batch)

    def process(self, id):
        batch = self.get_by_id(id)
        if batch.status != "draft":
            raise ValidationError("Batch has already been processed")

        self.repository.update(batch, {"status": "processing"})

        employees = self.employee_repo.get_all()
        active_employees = [e for e in employees if e.status == "active"]
        payslips = []

        for emp in active_employees:
            components = self.salary_repo.get_by_employee_id(emp.employee_id)
            adjustments = [
                a for a in self.adjustment_repo.get_by_employee_id(emp.employee_id)
                if a.batch_id == id
            ]

            gross = sum(
                Decimal(str(c.amount)) for c in components
                if c.type in ("base", "allowance")
            )
            component_deductions = sum(
                Decimal(str(c.amount)) for c in components if c.type == "deduction"
            )
            adjustment_additions = sum(
                Decimal(str(a.amount)) for a in adjustments if a.type in ("bonus", "override")
            )
            adjustment_deductions = sum(
                Decimal(str(a.amount)) for a in adjustments if a.type == "deduction"
            )

            total_deductions = component_deductions + adjustment_deductions
            net = gross + adjustment_additions - total_deductions

            payslip = self.payslip_repo.create(
                batch_id=id,
                employee_id=emp.employee_id,
                gross=gross,
                deductions=total_deductions,
                net=net,
            )
            payslips.append(payslip)
            publish("payslip.generated", {
                "employee_id": emp.employee_id,
                "batch_id": id,
                "gross": str(gross),
                "deductions": str(total_deductions),
                "net": str(net),
            })

        self.repository.update(batch, {"status": "processed"})
        publish("payroll.processed", {
            "batch_id": id,
            "name": batch.name,
            "employee_count": len(payslips),
        })
        return batch
