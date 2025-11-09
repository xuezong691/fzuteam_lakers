import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
import json
from datetime import datetime
import mysql.connector
from mysql.connector import Error

app = FastAPI(title="Todo Management API", description="基于 FastAPI 的待办事项管理接口", version="1.0.0")

# ========== 数据库配置 ==========
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'task_database'
}

# ========== 工具函数 ==========
def save_to_json(data):
    """将数据保存到 JSON 文件"""
    with open('front_end/json/task.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return "数据保存成功"

# ========== 数据模型定义 ==========
class AddTaskRequest(BaseModel):
    time_input: str
    place: str
    staff: str
    something: str
    urgency: str = "1"

class UpdateUrgencyRequest(BaseModel):
    task_id: str
    new_urgency: str

# ========== 接口定义 ==========

@app.get("/todo/list")
def generate_todo_list():
    """获取待办清单"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = "SELECT id, time, place, staff, something, urgency FROM task ORDER BY urgency DESC, id ASC"
        cursor.execute(query)
        results = cursor.fetchall()

        todo_list = [
            {
                "id": row[0],
                "time": str(row[1]),
                "place": row[2],
                "staff": row[3],
                "something": row[4],
                "urgency": row[5]
            }
            for row in results
        ]

        cursor.close()
        conn.close()
        save_to_json(todo_list)

        return {"status": "success", "data": todo_list}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/todo/add")
def add_todo_task(task: AddTaskRequest):
    """添加新的待办任务"""
    connection = None
    cursor = None
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            cursor = connection.cursor()

            # 时间验证
            try:
                datetime.strptime(task.time_input, '%Y-%m-%d')
            except ValueError:
                return {"status": "error", "message": "时间格式不正确，请使用 xxxx-xx-xx 格式"}

            if not task.place:
                return {"status": "error", "message": "地点不能为空"}
            if not task.staff:
                return {"status": "error", "message": "负责人不能为空"}
            if not task.something:
                return {"status": "error", "message": "事项内容不能为空"}

            # 转换紧急程度
            try:
                urgency_int = int(task.urgency)
            except ValueError:
                return {"status": "error", "message": f"紧急程度 '{task.urgency}' 不是有效的数字"}

            insert_query = """
            INSERT INTO task (time, place, staff, something, urgency)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (task.time_input, task.place, task.staff, task.something, urgency_int))
            connection.commit()

            return {"status": "success", "message": f"成功添加待办事项，记录编号为: {cursor.lastrowid}"}
    except Error as e:
        return {"status": "error", "message": str(e)}
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.delete("/todo/delete/{record_id}")
def delete_todo_by_id(record_id: str):
    """根据ID删除待办事项"""
    connection = None
    cursor = None
    try:
        task_id = int(record_id)
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        check_query = "SELECT id, staff, something FROM task WHERE id = %s"
        cursor.execute(check_query, (task_id,))
        record = cursor.fetchone()
        if not record:
            return {"status": "error", "message": f"编号为 {record_id} 的记录不存在"}

        task_info = f"负责人: {record[1]}, 事项: {record[2]}"
        delete_query = "DELETE FROM task WHERE id = %s"
        cursor.execute(delete_query, (task_id,))
        connection.commit()

        return {"status": "success", "message": f"成功删除待办事项 (ID: {record_id}) - {task_info}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.get("/todo/{record_id}")
def get_todo_by_id(record_id: str):
    """根据ID查询待办事项"""
    try:
        task_id = int(record_id)
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = "SELECT id, time, place, staff, something, urgency FROM task WHERE id = %s"
        cursor.execute(query, (task_id,))
        record = cursor.fetchone()
        cursor.close()
        conn.close()

        if not record:
            return {"status": "error", "message": f"编号为 {record_id} 的记录不存在"}

        return {
            "status": "success",
            "data": {
                'id': record[0],
                'time': str(record[1]),
                'place': record[2],
                'staff': record[3],
                'something': record[4],
                'urgency': record[5]
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.put("/todo/urgency")
def update_todo_urgency(req: UpdateUrgencyRequest):
    """更新待办事项紧急程度"""
    try:
        task_id = int(req.task_id)
        new_urgency = int(req.new_urgency)

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        check_query = "SELECT 1 FROM task WHERE id = %s"
        cursor.execute(check_query, (task_id,))
        if not cursor.fetchone():
            return {"status": "error", "message": f"编号为 {req.task_id} 的待办事项不存在"}

        update_query = "UPDATE task SET urgency = %s WHERE id = %s"
        cursor.execute(update_query, (new_urgency, task_id))
        conn.commit()
        cursor.close()
        conn.close()

        return {"status": "success", "message": f"编号为 {req.task_id} 的事项紧急程度已更新为 {req.new_urgency}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/weather/{city}")
def get_weather(city: str):
    """获取城市天气"""
    return {"status": "success", "data": f"{city}天气晴，风力3级，温度25度"}

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=12345)
# ========== 启动命令 ==========
# 运行命令：
# uvicorn temp_server:app --host 0.0.0.0 --port 8000 --reload
# uvicorn temp_server:app --reload
