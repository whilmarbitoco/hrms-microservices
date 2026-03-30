from marshmallow import Schema, fields, validate


LEVELS = ["junior", "mid", "senior", "lead", "principal"]


class EmployeeRoleCreate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    description = fields.Str(load_default=None)
    level = fields.Str(load_default=None, validate=validate.OneOf(LEVELS))


class EmployeeRoleUpdate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    description = fields.Str(required=True, allow_none=True)
    level = fields.Str(required=True, allow_none=True, validate=validate.OneOf(LEVELS))


class EmployeeRolePatch(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=120))
    description = fields.Str(allow_none=True)
    level = fields.Str(allow_none=True, validate=validate.OneOf(LEVELS))


class EmployeeRoleRead(Schema):
    id = fields.Int()
    name = fields.Str()
    description = fields.Str()
    level = fields.Str()
