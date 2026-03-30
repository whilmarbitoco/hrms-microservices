from app.extensions import db
from datetime import datetime, timezone


role_permissions = db.Table(
    "role_permissions",
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id"), primary_key=True),
    db.Column("permission_id", db.Integer, db.ForeignKey("permissions.id"), primary_key=True),
)


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)
    permissions = db.relationship("Permission", secondary=role_permissions, lazy="joined")


class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    name = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=True)
    role = db.relationship("Role", lazy="joined")


class EmployeeCache(db.Model):
    __tablename__ = "employee_cache"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), nullable=False, unique=True)
    name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    synced_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class LeavePolicy(db.Model):
    __tablename__ = "leave_policies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    type = db.Column(db.String(30), nullable=False)
    max_days = db.Column(db.Numeric(6, 2), nullable=False)
    accrual_rate = db.Column(db.Numeric(6, 4), nullable=False)
    accrual_frequency = db.Column(db.String(20), nullable=False)


class LeaveBalance(db.Model):
    __tablename__ = "leave_balances"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), nullable=False)
    policy_id = db.Column(db.Integer, db.ForeignKey("leave_policies.id"), nullable=False)
    balance = db.Column(db.Numeric(8, 2), nullable=False, default=0)
    accrued_at = db.Column(db.DateTime, nullable=True)

    policy = db.relationship("LeavePolicy", lazy="joined")


class LeaveRequest(db.Model):
    __tablename__ = "leave_requests"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), nullable=False)
    policy_id = db.Column(db.Integer, db.ForeignKey("leave_policies.id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Numeric(6, 2), nullable=False)
    reason = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="pending")
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    policy = db.relationship("LeavePolicy", lazy="joined")


class ProcessedEvent(db.Model):
    __tablename__ = "processed_events"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(36), nullable=False, unique=True)
    processed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
