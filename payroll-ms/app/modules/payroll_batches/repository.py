from app.extensions import db
from app.database.schema import PayrollBatch


class PayrollBatchRepository:
    def get_all(self, filters=None):
        query = db.select(PayrollBatch)
        if filters:
            if filters.get("status"):
                query = query.where(PayrollBatch.status == filters["status"])
            if filters.get("cycle"):
                query = query.where(PayrollBatch.cycle == filters["cycle"])
        return db.session.execute(query).scalars().all()

    def get_by_id(self, id):
        return db.session.get(PayrollBatch, id)

    def create(self, name, cycle, period_start, period_end, created_by):
        batch = PayrollBatch(name=name, cycle=cycle, period_start=period_start,
                             period_end=period_end, created_by=created_by)
        db.session.add(batch)
        db.session.commit()
        return batch

    def update(self, batch, data):
        for key, value in data.items():
            setattr(batch, key, value)
        db.session.commit()
        return batch

    def delete(self, batch):
        db.session.delete(batch)
        db.session.commit()
