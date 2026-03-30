from app.extensions import db
from app.database.schema import Adjustment, PayrollBatch


class AdjustmentRepository:
    def get_all(self, filters=None):
        query = db.select(Adjustment)
        if filters:
            if filters.get("employee_id"):
                query = query.where(Adjustment.employee_id == filters["employee_id"])
            if filters.get("batch_id"):
                query = query.where(Adjustment.batch_id == filters["batch_id"])
            if filters.get("type"):
                query = query.where(Adjustment.type == filters["type"])
        return db.session.execute(query).unique().scalars().all()

    def get_by_id(self, id):
        return db.session.get(Adjustment, id)

    def get_by_employee_id(self, employee_id):
        return db.session.execute(
            db.select(Adjustment).where(Adjustment.employee_id == employee_id)
        ).unique().scalars().all()

    def create(self, employee_id, batch_id, type, amount, reason, created_by):
        adj = Adjustment(employee_id=employee_id, batch_id=batch_id, type=type,
                         amount=amount, reason=reason, created_by=created_by)
        db.session.add(adj)
        db.session.commit()
        return adj

    def update(self, adjustment, data):
        for key, value in data.items():
            setattr(adjustment, key, value)
        db.session.commit()
        return adjustment

    def delete(self, adjustment):
        db.session.delete(adjustment)
        db.session.commit()

    def batch_is_processed(self, batch_id):
        batch = db.session.get(PayrollBatch, batch_id)
        return batch and batch.status == "processed"
