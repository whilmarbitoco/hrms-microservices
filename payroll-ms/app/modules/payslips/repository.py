from app.extensions import db
from app.database.schema import Payslip


class PayslipRepository:
    def get_all(self, filters=None):
        query = db.select(Payslip)
        if filters:
            if filters.get("batch_id"):
                query = query.where(Payslip.batch_id == filters["batch_id"])
            if filters.get("status"):
                query = query.where(Payslip.status == filters["status"])
        return db.session.execute(query).unique().scalars().all()

    def get_by_id(self, id):
        return db.session.get(Payslip, id)

    def get_by_employee_id(self, employee_id):
        return db.session.execute(
            db.select(Payslip).where(Payslip.employee_id == employee_id)
        ).unique().scalars().all()

    def get_by_batch_id(self, batch_id):
        return db.session.execute(
            db.select(Payslip).where(Payslip.batch_id == batch_id)
        ).unique().scalars().all()

    def create(self, batch_id, employee_id, gross, deductions, net):
        payslip = Payslip(batch_id=batch_id, employee_id=employee_id,
                          gross=gross, deductions=deductions, net=net)
        db.session.add(payslip)
        db.session.commit()
        return payslip

    def update(self, payslip, data):
        for key, value in data.items():
            setattr(payslip, key, value)
        db.session.commit()
        return payslip
