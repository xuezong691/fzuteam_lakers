# simple_todo_manager.py
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum


class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Status(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TodoItem:
    def __init__(self, title: str, description: str = "", category: str = "general",
                 priority: Priority = Priority.MEDIUM, due_date: Optional[str] = None,
                 tags: List[str] = None):
        self.id = id(self)
        self.title = title
        self.description = description
        self.category = category
        self.priority = priority
        self.due_date = due_date
        self.status = Status.PENDING
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.tags = tags or []

    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.now()

    def __str__(self):
        status_emoji = {
            Status.PENDING: "⏳",
            Status.IN_PROGRESS: "🔄",
            Status.COMPLETED: "✅",
            Status.CANCELLED: "❌"
        }
        priority_emoji = {
            Priority.LOW: "🟢",
            Priority.MEDIUM: "🟡",
            Priority.HIGH: "🔴",
            Priority.URGENT: "🚨"
        }

        return (f"{status_emoji[self.status]} {priority_emoji[self.priority]} {self.title}\n"
                f"   描述: {self.description}\n"
                f"   分类: {self.category} | 状态: {self.status.value}\n"
                f"   截止: {self.due_date or '无'} | 标签: {', '.join(self.tags)}")


class TodoManager:
    def __init__(self):
        self.todos: Dict[int, TodoItem] = {}

    def add_todo(self, title: str, **kwargs) -> TodoItem:
        todo = TodoItem(title, **kwargs)
        self.todos[todo.id] = todo
        return todo

    def get_todo(self, todo_id: int) -> Optional[TodoItem]:
        return self.todos.get(todo_id)

    def update_todo(self, todo_id: int, **kwargs) -> bool:
        todo = self.get_todo(todo_id)
        if todo:
            todo.update(**kwargs)
            return True
        return False

    def delete_todo(self, todo_id: int) -> bool:
        if todo_id in self.todos:
            del self.todos[todo_id]
            return True
        return False

    def list_todos(self, status: Optional[Status] = None,
                   category: Optional[str] = None) -> List[TodoItem]:
        todos = list(self.todos.values())

        if status:
            todos = [t for t in todos if t.status == status]
        if category:
            todos = [t for t in todos if t.category == category]

        return sorted(todos, key=lambda x: (x.priority.value, x.created_at))

    def get_stats(self) -> Dict[str, Any]:
        todos = list(self.todos.values())
        total = len(todos)
        completed = len([t for t in todos if t.status == Status.COMPLETED])

        return {
            "total": total,
            "completed": completed,
            "pending": len([t for t in todos if t.status == Status.PENDING]),
            "in_progress": len([t for t in todos if t.status == Status.IN_PROGRESS]),
            "completion_rate": completed / total if total > 0 else 0
        }


def main():
    """主函数 - 交互式演示"""
    manager = TodoManager()

    print("📝 简易待办事项管理器")
    print("=" * 40)

    while True:
        print("\n可选操作:")
        print("1. 添加待办事项")
        print("2. 查看待办事项")
        print("3. 更新待办事项")
        print("4. 删除待办事项")
        print("5. 查看统计")
        print("6. 退出")

        choice = input("请选择 (1-6): ").strip()

        if choice == "1":
            title = input("标题: ")
            description = input("描述: ")
            category = input("分类 (work/personal/shopping/health/learning/general): ") or "general"
            priority = input("优先级 (low/medium/high/urgent): ") or "medium"
            due_date = input("截止日期 (YYYY-MM-DD): ") or None
            tags = input("标签 (逗号分隔): ").split(",") if input("标签 (逗号分隔): ") else []

            try:
                priority_enum = Priority(priority)
                todo = manager.add_todo(
                    title,
                    description=description,
                    category=category,
                    priority=priority_enum,
                    due_date=due_date,
                    tags=[tag.strip() for tag in tags if tag.strip()]
                )
                print(f"✅ 已添加待办事项 (ID: {todo.id})")
            except ValueError as e:
                print(f"❌ 错误: {e}")

        elif choice == "2":
            status_filter = input("状态过滤 (pending/in_progress/completed/cancelled/全部): ") or "全部"
            category_filter = input("分类过滤: ") or None

            status_map = {
                "pending": Status.PENDING,
                "in_progress": Status.IN_PROGRESS,
                "completed": Status.COMPLETED,
                "cancelled": Status.CANCELLED
            }

            status = status_map.get(status_filter) if status_filter != "全部" else None
            todos = manager.list_todos(status=status, category=category_filter)

            if not todos:
                print("📝 没有待办事项")
            else:
                print(f"\n📋 找到 {len(todos)} 个待办事项:")
                for todo in todos:
                    print(f"\n{todo}")

        elif choice == "3":
            try:
                todo_id = int(input("待办事项ID: "))
                todo = manager.get_todo(todo_id)
                if not todo:
                    print("❌ 未找到该待办事项")
                    continue

                print(f"当前: {todo}")
                print("\n可更新字段 (直接回车跳过):")

                updates = {}
                new_status = input("状态 (pending/in_progress/completed/cancelled): ")
                if new_status:
                    updates["status"] = Status(new_status)

                new_priority = input("优先级 (low/medium/high/urgent): ")
                if new_priority:
                    updates["priority"] = Priority(new_priority)

                new_title = input("新标题: ")
                if new_title:
                    updates["title"] = new_title

                new_description = input("新描述: ")
                if new_description:
                    updates["description"] = new_description

                if updates:
                    manager.update_todo(todo_id, **updates)
                    print("✅ 已更新待办事项")
                else:
                    print("ℹ️ 未进行任何更改")

            except (ValueError, KeyError) as e:
                print(f"❌ 错误: {e}")

        elif choice == "4":
            try:
                todo_id = int(input("待办事项ID: "))
                if manager.delete_todo(todo_id):
                    print("✅ 已删除待办事项")
                else:
                    print("❌ 未找到该待办事项")
            except ValueError:
                print("❌ 请输入有效的数字ID")

        elif choice == "5":
            stats = manager.get_stats()
            print(f"""📊 统计信息:
• 总计: {stats['total']}
• 待处理: {stats['pending']}
• 进行中: {stats['in_progress']}
• 已完成: {stats['completed']}
• 完成率: {stats['completion_rate']:.1%}""")

        elif choice == "6":
            print("👋 再见！")
            break

        else:
            print("❌ 无效选择")


if __name__ == "__main__":
    main()