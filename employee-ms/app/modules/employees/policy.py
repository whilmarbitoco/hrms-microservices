from app.utils.policy import BasePolicy
from app.errors.handlers import ForbiddenError


class EmployeePolicy(BasePolicy):
    def create(self, actor):
        self.authorize(actor, "employee.create")

    def update(self, actor):
        self.authorize(actor, "employee.update")

    def delete(self, actor):
        self.authorize(actor, "employee.delete")

    def terminate(self, actor):
        self.authorize(actor, "employee.terminate")

    def rehire(self, actor):
        self.authorize(actor, "employee.rehire")

    def view(self, actor, employee):
        self.authorize(actor, "employee.view")
        # employees can only view their own record
        if actor.role and actor.role.name == "employee":
            if not hasattr(actor, "employee_id") or actor.id != employee.id:
                raise ForbiddenError("You can only view your own record")
