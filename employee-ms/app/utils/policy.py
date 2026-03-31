from app.errors.handlers import ForbiddenError
from app.utils.permissions import has_permission


class BasePolicy:
    """
    Extend this class to create resource-level policies.

    Usage:
        class EmployeePolicy(BasePolicy):
            def terminate(self, employee):
                self.authorize("employee.terminate")
                # contextual check using get_jwt() if needed
    """

    def authorize(self, permission: str):
        if not has_permission(permission):
            raise ForbiddenError()
