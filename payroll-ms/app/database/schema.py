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
    role = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    synced_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class SalaryComponent(db.Model):
    __tablename__ = "salary_components"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)


class PayrollBatch(db.Model):
    __tablename__ = "payroll_batches"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    cycle = db.Column(db.String(20), nullable=False)
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="draft")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)


class Adjustment(db.Model):
    __tablename__ = "adjustments"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey("payroll_batches.id"), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    reason = db.Column(db.String(255), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    batch = db.relationship("PayrollBatch", lazy="joined")


class Payslip(db.Model):
    __tablename__ = "payslips"

    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey("payroll_batches.id"), nullable=False)
    employee_id = db.Column(db.String(20), nullable=False)
    gross = db.Column(db.Numeric(12, 2), nullable=False)
    deductions = db.Column(db.Numeric(12, 2), nullable=False)
    net = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="generated")
    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    batch = db.relationship("PayrollBatch", lazy="joined")


class ProcessedEvent(db.Model):
    __tablename__ = "processed_events"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(36), nullable=False, unique=True)
    processed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
