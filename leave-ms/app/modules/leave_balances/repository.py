from decimal import Decimal
from datetime import datetime, timezone
from app.extensions import db
from app.database.schema import LeaveBalance, LeavePolicy


class LeaveBalanceRepository:
    def get_all(self, filters=None):
        query = db.select(LeaveBalance)
        if filters:
            if filters.get("employee_id"):
                query = query.where(LeaveBalance.employee_id == filters["employee_id"])
            if filters.get("policy_id"):
                query = query.where(LeaveBalance.policy_id == filters["policy_id"])
        return db.session.execute(query).unique().scalars().all()

    def get_by_employee_id(self, employee_id):
        return db.session.execute(
            db.select(LeaveBalance).where(LeaveBalance.employee_id == employee_id)
        ).unique().scalars().all()

    def get_by_employee_and_policy(self, employee_id, policy_id):
        return db.session.execute(
            db.select(LeaveBalance)
            .where(LeaveBalance.employee_id == employee_id, LeaveBalance.policy_id == policy_id)
        ).scalar_one_or_none()

    def get_by_id(self, id):
        return db.session.get(LeaveBalance, id)

    def initialize_for_employee(self, employee_id):
        policies = db.session.execute(db.select(LeavePolicy)).scalars().all()
        for policy in policies:
            existing = self.get_by_employee_and_policy(employee_id, policy.id)
            if not existing:
                balance = LeaveBalance(employee_id=employee_id, policy_id=policy.id, balance=0)
                db.session.add(balance)
        db.session.commit()

    def adjust(self, balance, amount):
        balance.balance = Decimal(str(balance.balance)) + Decimal(str(amount))
        db.session.commit()
        return balance

    def override(self, balance, amount):
        balance.balance = Decimal(str(amount))
        db.session.commit()
        return balance

    def accrue(self, employee_id=None):
        query = db.select(LeaveBalance)
        if employee_id:
            query = query.where(LeaveBalance.employee_id == employee_id)
        balances = db.session.execute(query).unique().scalars().all()
        for balance in balances:
            policy = db.session.get(LeavePolicy, balance.policy_id)
            if policy:
                new_balance = min(
                    Decimal(str(balance.balance)) + Decimal(str(policy.accrual_rate)),
                    Decimal(str(policy.max_days))
                )
                balance.balance = new_balance
                balance.accrued_at = datetime.now(timezone.utc)
        db.session.commit()
