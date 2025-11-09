# config.py
class TodoConfig:
    # 默认分类
    CATEGORIES = ["work", "personal", "shopping", "health", "learning", "general"]

    # 优先级设置
    PRIORITIES = {
        "low": {"color": "green", "weight": 1},
        "medium": {"color": "yellow", "weight": 2},
        "high": {"color": "red", "weight": 3},
        "urgent": {"color": "purple", "weight": 4}
    }

    # 状态流转
    STATUS_FLOW = {
        "pending": ["in_progress", "completed", "cancelled"],
        "in_progress": ["completed", "cancelled", "pending"],
        "completed": ["pending", "in_progress"],
        "cancelled": ["pending"]
    }