from marshmallow import Schema, fields, validate


class EmployeeCreate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    email = fields.Email(required=True)
    phone = fields.Str(load_default=None)
    department_id = fields.Int(load_default=None)
    role_id = fields.Int(load_default=None)
    manager_id = fields.Int(load_default=None)
    hired_at = fields.Date(load_default=None)


class EmployeeUpdate(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    email = fields.Email(required=True)
    phone = fields.Str(required=True, allow_none=True)
    department_id = fields.Int(required=True, allow_none=True)
    role_id = fields.Int(required=True, allow_none=True)
    manager_id = fields.Int(required=True, allow_none=True)
    hired_at = fields.Date(required=True, allow_none=True)


class EmployeePatch(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=120))
    email = fields.Email()
    phone = fields.Str(allow_none=True)
    department_id = fields.Int(allow_none=True)
    role_id = fields.Int(allow_none=True)
    manager_id = fields.Int(allow_none=True)
    hired_at = fields.Date(allow_none=True)


class EmployeeTerminate(Schema):
    reason = fields.Str(required=True, validate=validate.Length(min=1))
    terminated_at = fields.Date(load_default=None)


class EmployeeRehire(Schema):
    department_id = fields.Int(required=True, allow_none=True)
    role_id = fields.Int(required=True, allow_none=True)
    hired_at = fields.Date(load_default=None)


class DepartmentNested(Schema):
    id = fields.Int()
    name = fields.Str()


class EmployeeRoleNested(Schema):
    id = fields.Int()
    name = fields.Str()
    level = fields.Str()


class EmployeeRead(Schema):
    id = fields.Int()
    employee_id = fields.Str()
    name = fields.Str()
    email = fields.Str()
    phone = fields.Str()
    status = fields.Str()
    hired_at = fields.Date()
    terminated_at = fields.Date()
    manager_id = fields.Int()
    department = fields.Nested(DepartmentNested)
    role = fields.Nested(EmployeeRoleNested)


class EmployeeHistoryRead(Schema):
    id = fields.Int()
    action = fields.Str()
    changed_by = fields.Str()
    metadata_ = fields.Dict(attribute="metadata_")
    created_at = fields.DateTime()
