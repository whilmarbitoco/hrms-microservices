from app.extensions import db
from app.database.schema import Department, Employee


class DepartmentRepository:
    def get_all(self):
        return db.session.execute(db.select(Department)).unique().scalars().all()

    def get_by_id(self, id):
        return db.session.get(Department, id)

    def get_by_name(self, name):
        return db.session.execute(db.select(Department).where(Department.name == name)).scalar_one_or_none()

    def create(self, name, description, manager_id):
        dept = Department(name=name, description=description, manager_id=manager_id)
        db.session.add(dept)
        db.session.commit()
        return dept

    def update(self, dept, data):
        for key, value in data.items():
            setattr(dept, key, value)
        db.session.commit()
        return dept

    def delete(self, dept):
        db.session.delete(dept)
        db.session.commit()

    def has_active_employees(self, department_id):
        return db.session.execute(
            db.select(Employee).where(Employee.department_id == department_id, Employee.status == "active")
        ).scalar_one_or_none() is not None

    def get_employees(self, department_id):
        return db.session.execute(
            db.select(Employee).where(Employee.department_id == department_id)
        ).unique().scalars().all()
