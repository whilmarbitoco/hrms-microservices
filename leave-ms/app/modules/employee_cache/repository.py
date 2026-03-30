from app.extensions import db
from app.database.schema import EmployeeCache


class EmployeeCacheRepository:
    def get_all(self):
        return db.session.execute(db.select(EmployeeCache)).scalars().all()

    def get_by_employee_id(self, employee_id):
        return db.session.execute(
            db.select(EmployeeCache).where(EmployeeCache.employee_id == employee_id)
        ).scalar_one_or_none()

    def upsert(self, employee_id, name, department, status):
        record = self.get_by_employee_id(employee_id)
        if record:
            record.name = name
            record.department = department
            record.status = status
        else:
            record = EmployeeCache(employee_id=employee_id, name=name, department=department, status=status)
            db.session.add(record)
        db.session.commit()
        return record

    def set_status(self, employee_id, status):
        record = self.get_by_employee_id(employee_id)
        if record:
            record.status = status
            db.session.commit()
        return record
