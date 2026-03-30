from decimal import Decimal
from datetime import datetime, timezone
from app.modules.leave_requests.repository import LeaveRequestRepository
from app.modules.leave_balances.repository import LeaveBalanceRepository
from app.modules.employee_cache.repository import EmployeeCacheRepository
from app.errors.handlers import NotFoundError, ValidationError
from app.events.producer import publish


class LeaveRequestService:
    def __init__(self):
        self.repository = LeaveRequestRepository()
        self.balance_repo = LeaveBalanceRepository()
        self.employee_repo = EmployeeCacheRepository()

    def _get_employee_or_raise(self, employee_id):
        emp = self.employee_repo.get_by_employee_id(employee_id)
        if not emp:
            raise NotFoundError("Employee not found")
        if emp.status == "terminated":
            raise ValidationError("Terminated employees cannot submit leave requests")
        return emp

    def _calculate_days(self, start_date, end_date):
        return Decimal((end_date - start_date).days + 1)

    def get_all(self, filters=None):
        return self.repository.get_all(filters)

    def get_by_id(self, id):
        req = self.repository.get_by_id(id)
        if not req:
            raise NotFoundError("Leave request not found")
        return req

    def create(self, employee_id, policy_id, start_date, end_date, reason=None):
        self._get_employee_or_raise(employee_id)
        days = self._calculate_days(start_date, end_date)
        balance = self.balance_repo.get_by_employee_and_policy(employee_id, policy_id)
        if not balance:
            raise ValidationError("No leave balance found for this policy")
        if Decimal(str(balance.balance)) < days:
            raise ValidationError(f"Insufficient leave balance. Available: {balance.balance}, Requested: {days}")
        req = self.repository.create(employee_id, policy_id, start_date, end_date, days, reason)
        publish("leave.applied", {"employee_id": employee_id, "leave_request_id": req.id, "days": str(days)})
        return req

    def update(self, id, data):
        req = self.get_by_id(id)
        if req.status != "pending":
            raise ValidationError("Only pending requests can be updated")
        if "start_date" in data or "end_date" in data:
            start = data.get("start_date", req.start_date)
            end = data.get("end_date", req.end_date)
            data["days"] = self._calculate_days(start, end)
        return self.repository.update(req, data)

    def delete(self, id):
        req = self.get_by_id(id)
        if req.status != "pending":
            raise ValidationError("Only pending requests can be deleted")
        self.repository.delete(req)

    def approve(self, id, reviewer_id):
        req = self.get_by_id(id)
        if req.status != "pending":
            raise ValidationError("Only pending requests can be approved")
        balance = self.balance_repo.get_by_employee_and_policy(req.employee_id, req.policy_id)
        if balance:
            self.balance_repo.adjust(balance, -Decimal(str(req.days)))
        self.repository.update(req, {
            "status": "approved",
            "reviewed_by": reviewer_id,
            "reviewed_at": datetime.now(timezone.utc),
        })
        publish("leave.approved", {
            "employee_id": req.employee_id,
            "leave_request_id": req.id,
            "policy_id": req.policy_id,
            "days": str(req.days),
            "leave_type": req.policy.type if req.policy else None,
        })
        return req

    def reject(self, id, reason, reviewer_id):
        req = self.get_by_id(id)
        if req.status != "pending":
            raise ValidationError("Only pending requests can be rejected")
        self.repository.update(req, {
            "status": "rejected",
            "reason": reason,
            "reviewed_by": reviewer_id,
            "reviewed_at": datetime.now(timezone.utc),
        })
        publish("leave.rejected", {"employee_id": req.employee_id, "leave_request_id": req.id, "reason": reason})
        return req

    def cancel(self, id):
        req = self.get_by_id(id)
        if req.status not in ("pending", "approved"):
            raise ValidationError("Only pending or approved requests can be cancelled")
        if req.status == "approved":
            balance = self.balance_repo.get_by_employee_and_policy(req.employee_id, req.policy_id)
            if balance:
                self.balance_repo.adjust(balance, Decimal(str(req.days)))
        self.repository.update(req, {"status": "cancelled"})
        return req

    def get_calendar(self, from_date, to_date, department_id=None):
        return self.repository.get_calendar(from_date, to_date, department_id)
