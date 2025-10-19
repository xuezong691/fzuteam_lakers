import mysql.connector
from mysql.connector import Error
from datetime import datetime

def add_todo_task():
    """向manager数据库的things表添加待办事项"""
    # 数据库连接配置（适配你的数据库）
    config = {
        'host': 'localhost',
        'database': 'manager',  # 你的数据库名（原为event_tracking）
        'user': 'root',         # 可改为你的ahab用户
        'password': 'a123456',  # 你的数据库密码（原为123456）
        'port': '3306'
    }

    connection = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**config)

        if connection.is_connected():
            cursor = connection.cursor()

            # 获取用户输入的待办事项信息
            print("\n=== 添加待办事项 ===")
            
            # 时间输入（格式：xxxx-xx-xx）
            time_input = input("请输入时间 (xxxx-xx-xx，留空使用当前日期): ").strip()
            if not time_input:
                time_input = datetime.now().strftime('%Y-%m-%d')
            else:
                # 验证时间格式
                try:
                    datetime.strptime(time_input, '%Y-%m-%d')
                except ValueError:
                    return "错误：时间格式不正确，请使用 xxxx-xx-xx 格式"
            
            place = input("请输入地点: ").strip()
            staff = input("请输入负责人: ").strip()  # 字段名对应staff（负责人）
            something = input("请输入事项内容: ").strip()  # 对应something字段
            
            # 紧急程度选择
            print("\n紧急程度选项：")
            print("0 - 已完成")
            print("1 - 一般")
            print("2 - 重要") 
            print("3 - 紧急")
            urgency_input = input("请选择紧急程度 (0-3，默认1): ").strip()
            
            # 处理紧急程度，转换为整数
            if urgency_input in ['0', '1', '2', '3']:
                urgency = int(urgency_input)
            else:
                urgency = 1  # 默认一般

            # 验证必填字段（你的表字段均为非空，需验证）
            if not place:
                return "错误：地点不能为空"
            if not staff:
                return "错误：负责人不能为空"
            if not something:
                return "错误：事项内容不能为空"

            # 确认添加
            print(f"\n请确认要添加的待办事项：")
            print(f"时间: {time_input}")
            print(f"地点: {place}")
            print(f"负责人: {staff}")  # 显示为“负责人”，对应staff字段
            print(f"事项: {something}")
            print(f"紧急程度: {urgency}")

            confirm = input("\n确定要添加这条记录吗？(y/n): ")
            if confirm.lower() != 'y':
                return "添加操作已取消"

            # 执行插入操作（适配things表结构，删除多余的created_at字段）
            insert_query = """
            INSERT INTO things (time, place, staff, something, urgency)
            VALUES (%s, %s, %s, %s, %s)
            """
            
            cursor.execute(insert_query, (time_input, place, staff, something, urgency))
            connection.commit()

            if cursor.rowcount > 0:
                # 返回自动生成的num编号（你的表中num是自增主键）
                return f"成功添加待办事项，记录编号为: {cursor.lastrowid}"
            else:
                return "添加待办事项失败"

    except Error as e:
        return f"数据库操作错误: {e}"
    finally:
        # 关闭数据库连接
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def add_multiple_tasks():
    """连续向things表添加多条待办事项"""
    results = []
    while True:
        result = add_todo_task()
        results.append(result)
        print(f"\n{result}")
        
        continue_add = input("\n是否继续添加其他事项？(y/n): ")
        if continue_add.lower() != 'y':
            results.append("添加操作结束")
            break
    
    return "\n".join(results)

if __name__ == "__main__":
    try:
        # 询问是否添加多条记录
        multi_choice = input("是否添加多条事项？(y/n，默认n): ")
        if multi_choice.lower() == 'y':
            result = add_multiple_tasks()
            print(f"\n=== 操作结果 ===\n{result}")
        else:
            result = add_todo_task()
            print(f"\n=== 操作结果 ===\n{result}")
    except Exception as e:
        print(f"发生错误: {e}")