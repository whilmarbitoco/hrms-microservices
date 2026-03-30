from marshmallow import Schema, fields, validate

COMPONENT_TYPES = ["base", "allowance", "deduction"]


class SalaryComponentCreate(Schema):
    employee_id = fields.Str(required=True)
    type = fields.Str(required=True, validate=validate.OneOf(COMPONENT_TYPES))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    amount = fields.Decimal(required=True, as_string=True)


class SalaryComponentUpdate(Schema):
    employee_id = fields.Str(required=True)
    type = fields.Str(required=True, validate=validate.OneOf(COMPONENT_TYPES))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    amount = fields.Decimal(required=True, as_string=True)


class SalaryComponentPatch(Schema):
    employee_id = fields.Str()
    type = fields.Str(validate=validate.OneOf(COMPONENT_TYPES))
    name = fields.Str(validate=validate.Length(min=1, max=120))
    amount = fields.Decimal(as_string=True)


class SalaryComponentRead(Schema):
    id = fields.Int()
    employee_id = fields.Str()
    type = fields.Str()
    name = fields.Str()
    amount = fields.Decimal(as_string=True)
