from app.utils.policy import BasePolicy


class DepartmentPolicy(BasePolicy):
    def create(self, actor):
        self.authorize(actor, "department.create")

    def update(self, actor):
        self.authorize(actor, "department.update")

    def delete(self, actor):
        self.authorize(actor, "department.delete")
