import mysql.connector

def generate_todo_list():
    """
    生成待办事项清单
    从MySQL数据库获取所有数据，按紧急程度排序后返回列表
    """
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="xjh112233",
            database="demo"
        )

        cursor = conn.cursor()

        query = "SELECT num, time, place, staff, something, urgency FROM todo_tasks ORDER BY urgency DESC"
        cursor.execute(query)

        results = cursor.fetchall()

        todo_list = []
        for row in results:
            task = {
                'num': row[0],
                'time': row[1],
                'place': row[2],
                'staff': row[3],
                'something': row[4],
                'urgency': row[5]
            }
            todo_list.append(task)

        cursor.close()
        conn.close()

        return todo_list

    except mysql.connector.Error as e:
        return f"数据库操作失败: {str(e)}"
    except Exception as e:
        return f"生成清单时发生错误: {str(e)}"

if __name__ == "__main__":
    result = generate_todo_list()
    if isinstance(result, list):
        for task in result:
            print(f"编号: {task['num']}, 时间: {task['time']}, 地点: {task['place']}, "
                  f"人员: {task['staff']}, 事项: {task['something']}, 紧急程度: {task['urgency']}")
    else:
        print(result)
