from marshmallow import Schema, fields, validate

CYCLES = ["monthly", "semi-monthly"]


class PayrollBatchCreate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    cycle = fields.Str(required=True, validate=validate.OneOf(CYCLES))
    period_start = fields.Date(required=True)
    period_end = fields.Date(required=True)


class PayrollBatchUpdate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    cycle = fields.Str(required=True, validate=validate.OneOf(CYCLES))
    period_start = fields.Date(required=True)
    period_end = fields.Date(required=True)


class PayrollBatchPatch(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=120))
    cycle = fields.Str(validate=validate.OneOf(CYCLES))
    period_start = fields.Date()
    period_end = fields.Date()


class PayrollBatchRead(Schema):
    id = fields.Int()
    name = fields.Str()
    cycle = fields.Str()
    period_start = fields.Date()
    period_end = fields.Date()
    status = fields.Str()
    created_by = fields.Str()
