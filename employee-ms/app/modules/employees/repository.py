from app.extensions import db
from app.database.schema import Employee, EmployeeHistory


class EmployeeRepository:
    def get_all(self, filters=None):
        query = db.select(Employee)
        if filters:
            if filters.get("name"):
                query = query.where(Employee.name.ilike(f"%{filters['name']}%"))
            if filters.get("email"):
                query = query.where(Employee.email.ilike(f"%{filters['email']}%"))
            if filters.get("department_id"):
                query = query.where(Employee.department_id == filters["department_id"])
            if filters.get("role_id"):
                query = query.where(Employee.role_id == filters["role_id"])
            if filters.get("status"):
                query = query.where(Employee.status == filters["status"])
            if filters.get("hired_from"):
                query = query.where(Employee.hired_at >= filters["hired_from"])
            if filters.get("hired_to"):
                query = query.where(Employee.hired_at <= filters["hired_to"])
        return db.session.execute(query).unique().scalars().all()

    def get_by_id(self, id):
        return db.session.get(Employee, id)

    def get_by_email(self, email):
        return db.session.execute(db.select(Employee).where(Employee.email == email)).scalar_one_or_none()

    def get_last_employee_id(self):
        result = db.session.execute(
            db.select(Employee.employee_id).order_by(Employee.id.desc())
        ).first()
        return result[0] if result else None

    def create(self, **kwargs):
        employee = Employee(**kwargs)
        db.session.add(employee)
        db.session.commit()
        return employee

    def update(self, employee, data):
        for key, value in data.items():
            setattr(employee, key, value)
        db.session.commit()
        return employee

    def delete(self, employee):
        db.session.delete(employee)
        db.session.commit()

    def add_history(self, employee_id, action, changed_by, metadata=None):
        history = EmployeeHistory(
            employee_id=employee_id,
            action=action,
            changed_by=changed_by,
            metadata_=metadata,
        )
        db.session.add(history)
        db.session.commit()
        return history

    def get_history(self, employee_id):
        return db.session.execute(
            db.select(EmployeeHistory)
            .where(EmployeeHistory.employee_id == employee_id)
            .order_by(EmployeeHistory.created_at.desc())
        ).scalars().all()

    def get_subordinates(self, manager_id):
        visited = set()
        result = []

        def recurse(mid):
            subs = db.session.execute(
                db.select(Employee).where(Employee.manager_id == mid)
            ).unique().scalars().all()
            for s in subs:
                if s.id not in visited:
                    visited.add(s.id)
                    result.append(s)
                    recurse(s.id)

        recurse(manager_id)
        return result
