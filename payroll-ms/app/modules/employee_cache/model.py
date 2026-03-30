from marshmallow import Schema, fields


class EmployeeCacheRead(Schema):
    id = fields.Int()
    employee_id = fields.Str()
    name = fields.Str()
    department = fields.Str()
    role = fields.Str()
    status = fields.Str()
    synced_at = fields.DateTime()
