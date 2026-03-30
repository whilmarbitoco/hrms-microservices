from marshmallow import Schema, fields, validate


class PayslipRead(Schema):
    id = fields.Int()
    batch_id = fields.Int()
    employee_id = fields.Str()
    gross = fields.Decimal(as_string=True)
    deductions = fields.Decimal(as_string=True)
    net = fields.Decimal(as_string=True)
    status = fields.Str()
    generated_at = fields.DateTime()


class PayslipPatch(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(["sent", "acknowledged"]))
