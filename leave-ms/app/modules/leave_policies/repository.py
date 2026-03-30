from app.extensions import db
from app.database.schema import LeavePolicy, LeaveBalance


class LeavePolicyRepository:
    def get_all(self):
        return db.session.execute(db.select(LeavePolicy)).scalars().all()

    def get_by_id(self, id):
        return db.session.get(LeavePolicy, id)

    def get_by_name(self, name):
        return db.session.execute(db.select(LeavePolicy).where(LeavePolicy.name == name)).scalar_one_or_none()

    def get_default(self):
        return db.session.execute(db.select(LeavePolicy)).scalars().first()

    def create(self, name, type, max_days, accrual_rate, accrual_frequency):
        policy = LeavePolicy(name=name, type=type, max_days=max_days,
                             accrual_rate=accrual_rate, accrual_frequency=accrual_frequency)
        db.session.add(policy)
        db.session.commit()
        return policy

    def update(self, policy, data):
        for key, value in data.items():
            setattr(policy, key, value)
        db.session.commit()
        return policy

    def delete(self, policy):
        db.session.delete(policy)
        db.session.commit()

    def has_active_balances(self, policy_id):
        return db.session.execute(
            db.select(LeaveBalance).where(LeaveBalance.policy_id == policy_id)
        ).scalar_one_or_none() is not None
