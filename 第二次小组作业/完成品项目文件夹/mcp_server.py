"""
1.创建fastmcp实例
2.创建函数、文档
3.@mcp.tool注解函数
4.启动服务器
"""
import json
from datetime import datetime

import mysql.connector
import mysql.connector
from fastmcp import FastMCP
from mysql.connector import Error


def save_to_json(data):
    """将数据保存到JSON文件"""
    with open('front_end/json/task.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return "数据保存成功"


db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'task_database'
}
mcp = FastMCP()


@mcp.tool()
def generate_todo_list():
    """生成待办清单"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = "SELECT id, time, place, staff, something, urgency FROM task ORDER BY urgency DESC, id ASC"
        cursor.execute(query)
        results = cursor.fetchall()

        todo_list = []
        for row in results:
            task = {
                "id": row[0],
                "time": str(row[1]),
                "place": row[2],
                "staff": row[3],
                "something": row[4],
                "urgency": row[5]
            }
            todo_list.append(task)

        cursor.close()
        conn.close()

        save_to_json(todo_list)

        return todo_list

    except Exception as e:
        return f"错误: {str(e)}"


@mcp.tool()
def add_todo_task(time_input: str, place: str, staff: str, something: str, urgency: str = "1"):
    """添加新的待办任务

    Args:
        time_input: 时间，格式为xxxx-xx-xx
        place: 地点
        staff: 负责人
        something: 事项内容
        urgency: 紧急程度，默认为"1"
    """
    connection = None
    cursor = None
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            cursor = connection.cursor()
            try:
                datetime.strptime(time_input, '%Y-%m-%d')
            except ValueError:
                return "错误：时间格式不正确，请使用 xxxx-xx-xx 格式"

            if not place:
                return "错误：地点不能为空"
            if not staff:
                return "错误：负责人不能为空"
            if not something:
                return "错误：事项内容不能为空"

            # 转换urgency为整数
            try:
                urgency_int = int(urgency)
            except ValueError:
                return f"错误：紧急程度 '{urgency}' 不是有效的数字"

            insert_query = """
            INSERT INTO task (time, place, staff, something, urgency)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (time_input, place, staff, something, urgency_int))
            connection.commit()

            if cursor.rowcount > 0:
                return f"成功添加待办事项，记录编号为: {cursor.lastrowid}"
            else:
                return "添加待办事项失败"
    except Error as e:
        return f"数据库操作错误: {e}"
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@mcp.tool()
def delete_todo_by_id(record_id: str):
    """根据ID删除待办事项记录

    Args:
        record_id: 要删除的记录ID（字符串类型）

    Returns:
        删除操作的结果信息
    """
    connection = None
    cursor = None
    try:
        # 将字符串ID转换为整数
        try:
            task_id = int(record_id)
        except ValueError:
            return f"错误：ID '{record_id}' 不是有效的数字"

        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            cursor = connection.cursor()

            # 首先检查记录是否存在
            check_query = "SELECT id, staff, something FROM task WHERE id = %s"
            cursor.execute(check_query, (task_id,))
            record = cursor.fetchone()

            if not record:
                return f"错误：编号为 {record_id} 的记录不存在"

            # 记录存在，获取任务信息用于返回消息
            task_info = f"负责人: {record[1]}, 事项: {record[2]}"

            # 执行删除操作
            delete_query = "DELETE FROM task WHERE id = %s"
            cursor.execute(delete_query, (task_id,))
            connection.commit()

            if cursor.rowcount > 0:
                return f"成功删除待办事项 (ID: {record_id}) - {task_info}"
            else:
                return f"删除编号为 {record_id} 的记录失败"

    except mysql.connector.Error as e:
        return f"数据库操作错误: {str(e)}"
    except Exception as e:
        return f"删除操作时发生错误: {str(e)}"
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@mcp.tool()
def get_todo_by_id(record_id: str):
    """根据ID查询待办事项详情

    Args:
        record_id: 要查询的记录ID（字符串类型）

    Returns:
        待办事项的详细信息
    """
    connection = None
    cursor = None
    try:
        # 将字符串ID转换为整数
        try:
            task_id = int(record_id)
        except ValueError:
            return f"错误：ID '{record_id}' 不是有效的数字"

        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            cursor = connection.cursor()
            query = "SELECT id, time, place, staff, something, urgency FROM task WHERE id = %s"
            cursor.execute(query, (task_id,))
            record = cursor.fetchone()

            if not record:
                return f"错误：编号为 {record_id} 的记录不存在"

            record_data = {
                'id': record[0],
                'time': str(record[1]),
                'place': record[2],
                'staff': record[3],
                'something': record[4],
                'urgency': record[5]
            }
            return record_data
    except Exception as e:
        return f"查询操作时发生错误: {str(e)}"
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@mcp.tool()
def update_todo_urgency(task_id: str, new_urgency: str):
    """更新待办事项的紧急程度

    Args:
        task_id: 待办事项编号（字符串类型）
        new_urgency: 新的紧急程度值（字符串类型）
    """
    connection = None
    cursor = None
    try:
        # 转换参数为整数
        try:
            task_id_int = int(task_id)
            new_urgency_int = int(new_urgency)
        except ValueError:
            return "错误：ID和紧急程度都必须是有效的数字"

        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            cursor = connection.cursor()
            query_check_exist = "SELECT 1 FROM task WHERE id = %s"
            cursor.execute(query_check_exist, (task_id_int,))
            result = cursor.fetchone()
            if not result:
                return f"编号为{task_id}的待办事项不存在，更新失败"

            update_query = "UPDATE task SET urgency = %s WHERE id = %s"
            cursor.execute(update_query, (new_urgency_int, task_id_int))
            connection.commit()

            if cursor.rowcount == 1:
                return f"编号为{task_id}的事项紧急程度已更新为{new_urgency}"
            else:
                return f"编号为{task_id}的事项更新失败"
    except Exception as e:
        return f"更新操作时发生错误: {str(e)}"
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@mcp.tool()
def get_weather(city: str):
    """
    :param city:
    :return: 城市天气的描述
    """
    return f"{city}天气晴，风力3级，温度25度"



if __name__ == '__main__':#time_input: str, place: str, staff: str, something: str, urgency: int = 1
    # add_todo_task('2025-06-26','home','小明','去上班',2)
    # print(generate_todo_list())
    mcp.run()