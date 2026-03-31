from marshmallow import Schema, fields, validate

ADJUSTMENT_TYPES = ["bonus", "deduction", "override"]


class AdjustmentCreate(Schema):
    employee_id = fields.Str(required=True)
    batch_id = fields.Int(required=True)
    type = fields.Str(required=True, validate=validate.OneOf(ADJUSTMENT_TYPES))
    amount = fields.Decimal(required=True, as_string=True)
    reason = fields.Str(load_default=None)


class AdjustmentUpdate(Schema):
    employee_id = fields.Str(required=True)
    batch_id = fields.Int(required=True)
    type = fields.Str(required=True, validate=validate.OneOf(ADJUSTMENT_TYPES))
    amount = fields.Decimal(required=True, as_string=True)
    reason = fields.Str(required=True, allow_none=True)


class AdjustmentPatch(Schema):
    type = fields.Str(validate=validate.OneOf(ADJUSTMENT_TYPES))
    amount = fields.Decimal(as_string=True)
    reason = fields.Str(allow_none=True)


class AdjustmentRead(Schema):
    id = fields.Int()
    employee_id = fields.Str()
    batch_id = fields.Int()
    type = fields.Str()
    amount = fields.Decimal(as_string=True)
    reason = fields.Str()
    created_by = fields.Str()
