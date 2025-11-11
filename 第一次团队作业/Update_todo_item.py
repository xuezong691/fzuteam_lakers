import mysql.connector
from mysql.connector import Error

# 待办事项数据库配置
TASK_DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'task_database'
}

def update_todo_item(userid: int, task_id: int, time: str, place: str, staff: str, something: str, urgency: int) -> dict:
    """
    修改待办事项数据库中的对应记录
    
    参数说明：
    - userid: 登录用户的ID（用于定位数据表，如 task_28）
    - task_id: 待办事项的主键ID（表中id字段，唯一标识一条记录）
    - time: 修改后的日期（格式：YYYY-MM-DD，必填）
    - place: 修改后的地点（必填）
    - staff: 修改后的负责人（必填）
    - something: 修改后的待办内容（文本类型，必填）
    - urgency: 修改后的紧急程度（整数，默认1，可选值建议1-5）
    
    返回值：
    - 字典格式：{"success": 布尔值, "message": 提示信息, "error": 错误详情（可选）}
    """
    # 1. 参数合法性校验
    if not all([userid, task_id, time, place, staff, something]):
        return {
            "success": False,
            "message": "必填参数不能为空（userid、task_id、time、place、staff、something）"
        }
    
    if not isinstance(userid, int) or userid <= 0:
        return {"success": False, "message": "userid必须是正整数"}
    
    if not isinstance(task_id, int) or task_id <= 0:
        return {"success": False, "message": "task_id必须是正整数"}
    
    if not isinstance(urgency, int) or urgency < 1 or urgency > 5:
        return {"success": False, "message": "紧急程度（urgency）必须是1-5的整数"}
    
    # 2. 构造数据表名（task_+userid）
    table_name = f"task_{userid}"
    
    # 3. 数据库操作
    connection = None
    cursor = None
    try:
        # 连接数据库
        connection = mysql.connector.connect(**TASK_DB_CONFIG)
        if not connection.is_connected():
            return {"success": False, "message": "数据库连接失败"}
        
        cursor = connection.cursor()
        
        # 构造UPDATE SQL
        update_sql = f"""
            UPDATE {table_name}
            SET time = %s, place = %s, staff = %s, something = %s, urgency = %s
            WHERE id = %s
        """
        # 传入参数
        params = (time, place, staff, something, urgency, task_id)
        
        # 执行SQL
        cursor.execute(update_sql, params)
        connection.commit()
        
        # 检查是否有记录被修改
        if cursor.rowcount == 0:
            return {"success": False, "message": f"未找到ID为{task_id}的待办事项，修改失败"}
        
        return {
            "success": True,
            "message": f"ID为{task_id}的待办事项修改成功"
        }
    
    except Error as e:
        # 异常处理：回滚事务，返回错误信息
        if connection and connection.is_connected():
            connection.rollback()
        return {
            "success": False,
            "message": "待办事项修改失败",
            "error": str(e)  # 便于后端调试，前端可选择性展示
        }
    finally:
        # 关闭游标和连接
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            