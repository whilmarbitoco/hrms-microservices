from app.extensions import db
from app.database.schema import EmployeeRole, Employee


class EmployeeRoleRepository:
    def get_all(self):
        return db.session.execute(db.select(EmployeeRole)).scalars().all()

    def get_by_id(self, id):
        return db.session.get(EmployeeRole, id)

    def get_by_name(self, name):
        return db.session.execute(db.select(EmployeeRole).where(EmployeeRole.name == name)).scalar_one_or_none()

    def create(self, name, description, level):
        role = EmployeeRole(name=name, description=description, level=level)
        db.session.add(role)
        db.session.commit()
        return role

    def update(self, role, data):
        for key, value in data.items():
            setattr(role, key, value)
        db.session.commit()
        return role

    def delete(self, role):
        db.session.delete(role)
        db.session.commit()

    def has_active_employees(self, role_id):
        return db.session.execute(
            db.select(Employee).where(Employee.role_id == role_id, Employee.status == "active")
        ).scalar_one_or_none() is not None

    def get_employees(self, role_id):
        return db.session.execute(
            db.select(Employee).where(Employee.role_id == role_id)
        ).unique().scalars().all()
