from app.errors.handlers import ForbiddenError
from app.utils.permissions import has_permission


class BasePolicy:
    def authorize(self, permission: str):
        if not has_permission(permission):
            raise ForbiddenError()
