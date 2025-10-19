import mysql.connector

def generate_todo_list():
    """
    生成待办事项清单
    从MySQL数据库获取所有数据，按紧急程度排序后返回指定格式的列表
    """
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",  # 可改为ahab用户
            password="a123456",
            database="manager"
        )

        cursor = conn.cursor()

        # 查询你的things表，按紧急程度降序排列
        query = "SELECT num, time, place, staff, something, urgency FROM things ORDER BY urgency DESC"
        cursor.execute(query)
        results = cursor.fetchall()

        todo_list = []
        for row in results:
            # 严格区分类型：整数不加引号，字符串加引号
            task = {
                "id": row[0],  # num是整数，输出无引号
                "time": str(row[1]),  # DATE类型转字符串，输出带引号
                "place": row[2],  # VARCHAR是字符串，输出带引号
                "staff": row[3],  # VARCHAR是字符串，输出带引号
                "something": row[4],  # VARCHAR是字符串，输出带引号
                "urgency": row[5]  # urgency是整数，输出无引号
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
        # 格式化输出为指定格式（类似data = [...]）
        print("data = [")
        for i, task in enumerate(result):
            # 拼接字典内容，处理最后一个元素的逗号
            comma = "," if i != len(result) - 1 else ""
            print(f"    {{\"id\": {task['id']}, \"time\": \"{task['time']}\", \"place\": \"{task['place']}\", "
                  f"\"staff\": \"{task['staff']}\", \"something\": \"{task['something']}\", \"urgency\": {task['urgency']}}}{comma}")
        print("]")
    else:
        print(result)