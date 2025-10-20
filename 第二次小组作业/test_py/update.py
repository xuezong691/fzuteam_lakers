import mysql.connector
from mysql.connector import Error

def update_todo_urgency(num, new_urgency):
    """
    根据编号更新待办事项的紧急程度
    
    参数:
        num (int): 待办事项的编号（对应things表的num字段）
        new_urgency (int): 更新后的紧急程度（0-3，0代表已完成）
    
    返回:
        str: 操作结果提示字符串，成功时返回"编号为xxx的事项状态更新成功"
    """
    # 数据库连接配置（适配你的manager数据库）
    db_config = {
        'host': 'localhost',       # 数据库主机地址
        'database': 'manager',     # 你的数据库名称（原为todo_task，已修改）
        'user': 'root',            # 可根据需要改为ahab用户
        'password': 'a123456'      # 你的数据库密码（原为123456，已修改）
    }
    
    connection = None
    cursor = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            cursor = connection.cursor()
            
            # 先查询编号是否存在（表名改为things）
            query_check_exist = "SELECT 1 FROM things WHERE num = %s"  # 表名从todo_task改为things
            cursor.execute(query_check_exist, (num,))
            result = cursor.fetchone()  # 存在则返回(1,)，不存在则返回None
            
            if not result:
                return f"编号为{num}的待办事项不存在，更新失败"
            
            # 执行更新操作（表名改为things）
            update_query = """
                UPDATE things  # 表名从todo_task改为things
                SET urgency = %s 
                WHERE num = %s
            """
            cursor.execute(update_query, (new_urgency, num))
            connection.commit()  # 提交事务
            
            # 验证更新影响行数（1行则成功）
            if cursor.rowcount == 1:
                return f"编号为{num}的事项状态更新成功"
            else:
                return f"编号为{num}的事项更新失败，请检查参数"
    
    except Error as e:
        return f"数据库错误：{str(e)}"
    except Exception as e:
        return f"操作失败：{str(e)}"
    finally:
        # 确保资源释放
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

