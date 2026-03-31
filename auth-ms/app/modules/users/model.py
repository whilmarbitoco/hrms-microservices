from marshmallow import Schema, fields, validate


class UserCreateSchema(Schema):
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    password = fields.Str(required=True, validate=validate.Length(min=8))
    role_id = fields.Int(load_default=None)
    employee_id = fields.Str(load_default=None)


class UserRoleSchema(Schema):
    role_id = fields.Int(required=True)


class UserResetPasswordSchema(Schema):
    new_password = fields.Str(required=True, validate=validate.Length(min=8))


class UserRead(Schema):
    id = fields.Int()
    email = fields.Str()
    name = fields.Str()
    is_active = fields.Bool()
    employee_id = fields.Str()
    created_at = fields.DateTime()
    role = fields.Method("get_role")

    def get_role(self, obj):
        return obj.role.name if obj.role else None
