from app.extensions import db
from app.database.schema import SalaryComponent


class SalaryComponentRepository:
    def get_all(self, filters=None):
        query = db.select(SalaryComponent)
        if filters:
            if filters.get("employee_id"):
                query = query.where(SalaryComponent.employee_id == filters["employee_id"])
            if filters.get("type"):
                query = query.where(SalaryComponent.type == filters["type"])
        return db.session.execute(query).scalars().all()

    def get_by_id(self, id):
        return db.session.get(SalaryComponent, id)

    def get_by_employee_id(self, employee_id):
        return db.session.execute(
            db.select(SalaryComponent).where(SalaryComponent.employee_id == employee_id)
        ).scalars().all()

    def create(self, employee_id, type, name, amount):
        component = SalaryComponent(employee_id=employee_id, type=type, name=name, amount=amount)
        db.session.add(component)
        db.session.commit()
        return component

    def update(self, component, data):
        for key, value in data.items():
            setattr(component, key, value)
        db.session.commit()
        return component

    def delete(self, component):
        db.session.delete(component)
        db.session.commit()

    def is_used_in_processed_batch(self, component_id):
        from app.database.schema import Payslip, PayrollBatch
        result = db.session.execute(
            db.select(Payslip)
            .join(PayrollBatch, Payslip.batch_id == PayrollBatch.id)
            .where(PayrollBatch.status == "processed")
            .where(Payslip.employee_id == db.select(SalaryComponent.employee_id)
                   .where(SalaryComponent.id == component_id).scalar_subquery())
        ).first()
        return result is not None
