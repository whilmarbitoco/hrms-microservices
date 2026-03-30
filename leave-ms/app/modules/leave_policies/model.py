from marshmallow import Schema, fields, validate

POLICY_TYPES = ["vacation", "sick", "unpaid", "maternity", "paternity"]
ACCRUAL_FREQUENCIES = ["monthly", "yearly"]


class LeavePolicyCreate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    type = fields.Str(required=True, validate=validate.OneOf(POLICY_TYPES))
    max_days = fields.Decimal(required=True, as_string=True)
    accrual_rate = fields.Decimal(required=True, as_string=True)
    accrual_frequency = fields.Str(required=True, validate=validate.OneOf(ACCRUAL_FREQUENCIES))


class LeavePolicyUpdate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    type = fields.Str(required=True, validate=validate.OneOf(POLICY_TYPES))
    max_days = fields.Decimal(required=True, as_string=True)
    accrual_rate = fields.Decimal(required=True, as_string=True)
    accrual_frequency = fields.Str(required=True, validate=validate.OneOf(ACCRUAL_FREQUENCIES))


class LeavePolicyPatch(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=120))
    type = fields.Str(validate=validate.OneOf(POLICY_TYPES))
    max_days = fields.Decimal(as_string=True)
    accrual_rate = fields.Decimal(as_string=True)
    accrual_frequency = fields.Str(validate=validate.OneOf(ACCRUAL_FREQUENCIES))


class LeavePolicyRead(Schema):
    id = fields.Int()
    name = fields.Str()
    type = fields.Str()
    max_days = fields.Decimal(as_string=True)
    accrual_rate = fields.Decimal(as_string=True)
    accrual_frequency = fields.Str()
