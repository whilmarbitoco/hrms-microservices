from marshmallow import Schema, fields


class LeaveBalanceRead(Schema):
    id = fields.Int()
    employee_id = fields.Str()
    policy_id = fields.Int()
    balance = fields.Decimal(as_string=True)
    accrued_at = fields.DateTime()
    policy = fields.Nested(lambda: PolicyNested())


class PolicyNested(Schema):
    id = fields.Int()
    name = fields.Str()
    type = fields.Str()


class LeaveBalancePatch(Schema):
    amount = fields.Decimal(required=True, as_string=True)
    reason = fields.Str(load_default=None)


class LeaveBalanceAccrue(Schema):
    employee_id = fields.Str(load_default=None)
