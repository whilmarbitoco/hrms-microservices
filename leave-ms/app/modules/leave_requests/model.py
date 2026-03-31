from marshmallow import Schema, fields, validate


class LeaveRequestCreate(Schema):
    employee_id = fields.Str(required=True)
    policy_id = fields.Int(required=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    reason = fields.Str(load_default=None)


class LeaveRequestUpdate(Schema):
    employee_id = fields.Str(required=True)
    policy_id = fields.Int(required=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    reason = fields.Str(required=True, allow_none=True)


class LeaveRequestPatch(Schema):
    start_date = fields.Date()
    end_date = fields.Date()
    reason = fields.Str(allow_none=True)


class LeaveRequestReject(Schema):
    reason = fields.Str(required=True, validate=validate.Length(min=1))


class PolicyNested(Schema):
    id = fields.Int()
    name = fields.Str()
    type = fields.Str()


class LeaveRequestRead(Schema):
    id = fields.Int()
    employee_id = fields.Str()
    policy_id = fields.Int()
    start_date = fields.Date()
    end_date = fields.Date()
    days = fields.Decimal(as_string=True)
    reason = fields.Str()
    status = fields.Str()
    reviewed_by = fields.Str()
    reviewed_at = fields.DateTime()
    policy = fields.Nested(PolicyNested)
