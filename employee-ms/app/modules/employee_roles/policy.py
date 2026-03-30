from app.utils.policy import BasePolicy


class EmployeeRolePolicy(BasePolicy):
    def create(self, actor):
        self.authorize(actor, "employee_role.create")

    def update(self, actor):
        self.authorize(actor, "employee_role.update")

    def delete(self, actor):
        self.authorize(actor, "employee_role.delete")
