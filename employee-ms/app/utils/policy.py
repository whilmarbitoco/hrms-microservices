from app.errors.handlers import ForbiddenError
from app.utils.permissions import has_permission


class BasePolicy:
    """
    Extend this class to create resource-level policies.

    Usage:
        class EmployeePolicy(BasePolicy):
            def terminate(self, actor, employee):
                self.authorize(actor, "employee.terminate")
                if actor.role.name == "hr_manager" and actor.department_id != employee.department_id:
                    raise ForbiddenError("You can only terminate employees in your department.")
    """

    def authorize(self, actor, permission: str):
        if not has_permission(actor, permission):
            raise ForbiddenError()
