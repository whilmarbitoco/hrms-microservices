from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.errors.handlers import ForbiddenError, UnauthorizedError

AUTH_PERMISSIONS = [
    "user.view", "user.create", "user.assign_role",
    "user.deactivate", "user.reactivate", "user.reset_password",
]

ROLE_PERMISSIONS = {
    "admin": AUTH_PERMISSIONS,
    "hr_manager": ["user.view", "user.create", "user.deactivate", "user.reactivate", "user.reset_password"],
}


def has_permission(permission: str) -> bool:
    claims = get_jwt()
    if not claims.get("is_active", True):
        raise UnauthorizedError("Account is deactivated")
    role = claims.get("role")
    allowed = ROLE_PERMISSIONS.get(role, [])
    return permission in allowed


def require_permission(permission: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            if not has_permission(permission):
                raise ForbiddenError()
            return fn(*args, **kwargs)
        return wrapper
    return decorator
