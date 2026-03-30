from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.errors.handlers import ForbiddenError, UnauthorizedError


def _get_actor():
    from app.database.schema import User
    from app.extensions import db

    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user:
        raise UnauthorizedError()
    return user


def has_permission(actor, permission: str) -> bool:
    if not actor.role:
        return False
    return any(p.name == permission for p in actor.role.permissions)


def require_permission(permission: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            actor = _get_actor()
            if not has_permission(actor, permission):
                raise ForbiddenError()
            return fn(*args, **kwargs)
        return wrapper
    return decorator
