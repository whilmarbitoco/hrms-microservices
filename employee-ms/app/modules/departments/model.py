from marshmallow import Schema, fields, validate


class DepartmentCreate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    description = fields.Str(load_default=None)
    manager_id = fields.Int(load_default=None)


class DepartmentUpdate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    description = fields.Str(required=True, allow_none=True)
    manager_id = fields.Int(required=True, allow_none=True)


class DepartmentPatch(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=120))
    description = fields.Str(allow_none=True)
    manager_id = fields.Int(allow_none=True)


class DepartmentRead(Schema):
    id = fields.Int()
    name = fields.Str()
    description = fields.Str()
    manager_id = fields.Int()
