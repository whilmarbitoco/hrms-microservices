from decimal import Decimal
from datetime import datetime, timezone
from app.extensions import db
from app.database.schema import LeaveRequest


class LeaveRequestRepository:
    def get_all(self, filters=None):
        query = db.select(LeaveRequest)
        if filters:
            if filters.get("employee_id"):
                query = query.where(LeaveRequest.employee_id == filters["employee_id"])
            if filters.get("status"):
                query = query.where(LeaveRequest.status == filters["status"])
            if filters.get("policy_id"):
                query = query.where(LeaveRequest.policy_id == filters["policy_id"])
            if filters.get("from_date"):
                query = query.where(LeaveRequest.start_date >= filters["from_date"])
            if filters.get("to_date"):
                query = query.where(LeaveRequest.end_date <= filters["to_date"])
        return db.session.execute(query).unique().scalars().all()

    def get_by_id(self, id):
        return db.session.get(LeaveRequest, id)

    def create(self, employee_id, policy_id, start_date, end_date, days, reason):
        req = LeaveRequest(employee_id=employee_id, policy_id=policy_id,
                           start_date=start_date, end_date=end_date,
                           days=days, reason=reason, status="pending")
        db.session.add(req)
        db.session.commit()
        return req

    def update(self, request, data):
        for key, value in data.items():
            setattr(request, key, value)
        db.session.commit()
        return request

    def delete(self, request):
        db.session.delete(request)
        db.session.commit()

    def get_calendar(self, from_date, to_date, department_id=None):
        from app.database.schema import EmployeeCache
        query = (
            db.select(LeaveRequest)
            .where(LeaveRequest.status == "approved")
            .where(LeaveRequest.start_date >= from_date)
            .where(LeaveRequest.end_date <= to_date)
        )
        if department_id:
            emp_ids = db.session.execute(
                db.select(EmployeeCache.employee_id)
                .where(EmployeeCache.department == department_id)
            ).scalars().all()
            query = query.where(LeaveRequest.employee_id.in_(emp_ids))
        return db.session.execute(query).unique().scalars().all()
