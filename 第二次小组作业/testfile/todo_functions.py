import mysql.connector
from mysql.connector import Error
from datetime import datetime

class TodoManager:
    def __init__(self, db_config):
        self.db_config = db_config

    # 生成待办清单（核心修改部分）
    def generate_todo_list(self):
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()

            # 按紧急程度降序排序，紧急程度相同则按id升序（与示例排序逻辑一致）
            query = "SELECT num, time, place, staff, something, urgency FROM things ORDER BY urgency DESC, num ASC"
            cursor.execute(query)
            results = cursor.fetchall()

            todo_list = []
            for row in results:
                # 严格按照指定字段顺序和类型构造字典
                task = {
                    "id": row[0],               # id为整数（对应数据库num字段）
                    "time": str(row[1]),        # 时间转为字符串
                    "place": row[2],            # 地点为字符串
                    "staff": row[3],            # 负责人为字符串
                    "something": row[4],        # 事项内容为字符串
                    "urgency": row[5]           # 紧急程度为整数
                }
                todo_list.append(task)

            cursor.close()
            conn.close()
            return todo_list

        except mysql.connector.Error as e:
            return f"数据库操作失败: {str(e)}"
        except Exception as e:
            return f"生成清单时发生错误: {str(e)}"

    # 其他函数保持不变（删除、更新、查询、添加等）
    def delete_record_by_id(self, record_id, resequence=False):
        connection = None
        try:
            connection = mysql.connector.connect(** self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                check_query = "SELECT num, staff FROM things WHERE num = %s"
                cursor.execute(check_query, (record_id,))
                record = cursor.fetchone()
                if not record:
                    return False, f"错误：编号为 {record_id} 的记录不存在"
                delete_query = "DELETE FROM things WHERE num = %s"
                cursor.execute(delete_query, (record_id,))
                connection.commit()
                if cursor.rowcount <= 0:
                    return False, f"删除编号为 {record_id} 的记录失败"
                if resequence:
                    cursor.execute("ALTER TABLE things MODIFY COLUMN num INT NOT NULL")
                    cursor.execute("SET @new_num = 0")
                    cursor.execute("UPDATE things SET num = (@new_num := @new_num + 1) ORDER BY num")
                    cursor.execute("SELECT MAX(num) FROM things")
                    max_num = cursor.fetchone()[0] or 0
                    cursor.execute(
                        f"ALTER TABLE things MODIFY COLUMN num INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = {max_num + 1}"
                    )
                    connection.commit()
                return True, f"成功删除编号为 {record_id} 的记录"
        except Error as e:
            return False, f"数据库操作错误: {e}"
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def update_todo_urgency(self, num, new_urgency):
        connection = None
        cursor = None
        try:
            connection = mysql.connector.connect(**self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                query_check_exist = "SELECT 1 FROM things WHERE num = %s"
                cursor.execute(query_check_exist, (num,))
                result = cursor.fetchone()
                if not result:
                    return f"编号为{num}的待办事项不存在，更新失败"
                update_query = "UPDATE things SET urgency = %s WHERE num = %s"
                cursor.execute(update_query, (new_urgency, num))
                connection.commit()
                if cursor.rowcount == 1:
                    return f"编号为{num}的事项状态更新成功"
                else:
                    return f"编号为{num}的事项更新失败，请检查参数"
        except Error as e:
            return f"数据库错误：{str(e)}"
        except Exception as e:
            return f"操作失败：{str(e)}"
        finally:
            if cursor:
                cursor.close()
            if connection and connection.is_connected():
                connection.close()

    def query_record_by_id(self, record_id):
        connection = None
        try:
            connection = mysql.connector.connect(** self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                query = "SELECT num, time, place, staff, something, urgency FROM things WHERE num = %s"
                cursor.execute(query, (record_id,))
                record = cursor.fetchone()
                if not record:
                    return None, f"错误：编号为 {record_id} 的记录不存在"
                record_data = {
                    'id': record[0],
                    'time': str(record[1]),
                    'place': record[2],
                    'staff': record[3],
                    'something': record[4],
                    'urgency': record[5]
                }
                return record_data, "查询成功"
        except Error as e:
            return None, f"数据库操作错误: {e}"
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def query_all_records(self):
        connection = None
        try:
            connection = mysql.connector.connect(**self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                query = "SELECT num, time, place, staff, something, urgency FROM things ORDER BY urgency DESC, num ASC"
                cursor.execute(query)
                records = cursor.fetchall()
                if not records:
                    return [], "数据库中没有记录"
                all_records = []
                for record in records:
                    record_data = {
                        'id': record[0],
                        'time': str(record[1]),
                        'place': record[2],
                        'staff': record[3],
                        'something': record[4],
                        'urgency': record[5]
                    }
                    all_records.append(record_data)
                return all_records, f"共查询到 {len(all_records)} 条记录"
        except Error as e:
            return [], f"数据库操作错误: {e}"
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def query_records_by_urgency(self, urgency_level):
        connection = None
        try:
            connection = mysql.connector.connect(** self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                query = "SELECT num, time, place, staff, something, urgency FROM things WHERE urgency = %s ORDER BY num ASC"
                cursor.execute(query, (urgency_level,))
                records = cursor.fetchall()
                if not records:
                    urgency_labels = ["已完成", "普通", "重要", "紧急"]
                    return [], f"没有找到紧急程度为 {urgency_level} ({urgency_labels[urgency_level]}) 的记录"
                filtered_records = []
                for record in records:
                    record_data = {
                        'id': record[0],
                        'time': str(record[1]),
                        'place': record[2],
                        'staff': record[3],
                        'something': record[4],
                        'urgency': record[5]
                    }
                    filtered_records.append(record_data)
                return filtered_records, f"共查询到 {len(filtered_records)} 条记录"
        except Error as e:
            return [], f"数据库操作错误: {e}"
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def query_records_by_date_range(self, start_date, end_date):
        connection = None
        try:
            connection = mysql.connector.connect(**self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                query = "SELECT num, time, place, staff, something, urgency FROM things WHERE time BETWEEN %s AND %s ORDER BY time ASC, urgency DESC"
                cursor.execute(query, (start_date, end_date))
                records = cursor.fetchall()
                if not records:
                    return [], f"在 {start_date} 到 {end_date} 期间没有找到记录"
                date_range_records = []
                for record in records:
                    record_data = {
                        'id': record[0],
                        'time': str(record[1]),
                        'place': record[2],
                        'staff': record[3],
                        'something': record[4],
                        'urgency': record[5]
                    }
                    date_range_records.append(record_data)
                return date_range_records, f"共查询到 {len(date_range_records)} 条记录"
        except Error as e:
            return [], f"数据库操作错误: {e}"
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def query_records_by_specific_date(self, target_date):
        connection = None
        try:
            connection = mysql.connector.connect(** self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                query = "SELECT num, time, place, staff, something, urgency FROM things WHERE time = %s ORDER BY urgency DESC, num ASC"
                cursor.execute(query, (target_date,))
                records = cursor.fetchall()
                if not records:
                    return [], f"在 {target_date} 没有找到记录"
                specific_date_records = []
                for record in records:
                    record_data = {
                        'id': record[0],
                        'time': str(record[1]),
                        'place': record[2],
                        'staff': record[3],
                        'something': record[4],
                        'urgency': record[5]
                    }
                    specific_date_records.append(record_data)
                return specific_date_records, f"共查询到 {len(specific_date_records)} 条记录"
        except Error as e:
            return [], f"数据库操作错误: {e}"
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def add_todo_task(self, time_input, place, staff, something, urgency=1):
        connection = None
        try:
            connection = mysql.connector.connect(**self.db_config)
            if connection.is_connected():
                cursor = connection.cursor()
                try:
                    datetime.strptime(time_input, '%Y-%m-%d')
                except ValueError:
                    return None, "错误：时间格式不正确，请使用 xxxx-xx-xx 格式"
            if not place:
                return None, "错误：地点不能为空"
            if not staff:
                return None, "错误：负责人不能为空"
            if not something:
                return None, "错误：事项内容不能为空"
            insert_query = """
            INSERT INTO things (time, place, staff, something, urgency)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (time_input, place, staff, something, urgency))
            connection.commit()
            if cursor.rowcount > 0:
                return cursor.lastrowid, f"成功添加待办事项，记录编号为: {cursor.lastrowid}"
            else:
                return None, "添加待办事项失败"
        except Error as e:
            return None, f"数据库操作错误: {e}"
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def add_multiple_tasks(self, tasks):
        results = []
        for task in tasks:
            task_id, msg = self.add_todo_task(** task)
            results.append(msg)
        return results


def test_program():
    print("=== 待办事项管理系统测试程序 ===")
    db_config = {
        'host': input("数据库主机地址 (默认localhost): ").strip() or "localhost",
        'database': input("数据库名称 (默认manager): ").strip() or "manager",
        'user': input("数据库用户名 (默认root): ").strip() or "root",
        'password': input("数据库密码 (默认a123456): ").strip() or "a123456",
        'port': input("数据库端口 (默认3306): ").strip() or "3306"
    }
    manager = TodoManager(db_config)
    
    while True:
        print("\n--- 功能菜单 ---")
        print("1. 生成待办清单")
        print("2. 添加待办事项")
        print("3. 更新事项紧急程度")
        print("4. 删除事项")
        print("5. 查询事项")
        print("0. 退出程序")
        
        choice = input("请选择功能 (0-5): ").strip()
        
        if choice == "0":
            print("程序已退出")
            break
            
        elif choice == "1":
            print("\n--- 生成待办清单 ---")
            result = manager.generate_todo_list()
            if isinstance(result, list):
                print("data = [")
                for i, task in enumerate(result):
                    # 格式化输出，完全匹配示例格式
                    task_str = (f"    {{'id': {task['id']}, 'time': '{task['time']}', "
                                f"'place': '{task['place']}', 'staff': '{task['staff']}', "
                                f"'something': '{task['something']}', 'urgency': {task['urgency']}}}")
                    # 最后一行不加逗号
                    if i < len(result) - 1:
                        task_str += ","
                    print(task_str)
                print("]")
            else:
                print(result)
                
        # 其他功能菜单代码保持不变
        elif choice == "2":
            print("\n--- 添加待办事项 ---")
            time_input = input("请输入时间 (xxxx-xx-xx，留空使用当前日期): ").strip()
            if not time_input:
                time_input = datetime.now().strftime('%Y-%m-%d')
            place = input("请输入地点: ").strip()
            staff = input("请输入负责人: ").strip()
            something = input("请输入事项内容: ").strip()
            urgency_input = input("请选择紧急程度 (0-3，默认1): ").strip()
            urgency = int(urgency_input) if urgency_input in ['0', '1', '2', '3'] else 1
            task_id, msg = manager.add_todo_task(time_input, place, staff, something, urgency)
            print(msg)
            
        elif choice == "3":
            print("\n--- 更新事项紧急程度 ---")
            try:
                num = int(input("请输入要更新的事项编号: ").strip())
                new_urgency = int(input("请输入新的紧急程度 (0-3): ").strip())
                if 0 <= new_urgency <= 3:
                    result = manager.update_todo_urgency(num, new_urgency)
                    print(result)
                else:
                    print("错误：紧急程度必须在0-3之间")
            except ValueError:
                print("错误：请输入有效的数字")
                
        elif choice == "4":
            print("\n--- 删除事项 ---")
            try:
                record_id = int(input("请输入要删除的记录编号: ").strip())
                resequence_choice = input("删除后是否需要重新排列编号？(y/n，默认n): ").strip()
                resequence = resequence_choice.lower() == 'y'
                success, msg = manager.delete_record_by_id(record_id, resequence)
                print(msg)
            except ValueError:
                print("错误：请输入有效的数字编号")
                
        elif choice == "5":
            print("\n--- 查询事项 ---")
            print("1. 根据编号查询")
            print("2. 查询所有记录")
            print("3. 根据紧急程度查询")
            print("4. 根据具体日期查询")
            print("5. 根据日期范围查询")
            query_choice = input("请选择查询方式 (1-5): ").strip()
            
            if query_choice == "1":
                try:
                    record_id = int(input("请输入要查询的记录编号: ").strip())
                    data, msg = manager.query_record_by_id(record_id)
                    print(msg)
                    if data:
                        print(f"详情: {data}")
                except ValueError:
                    print("错误：请输入有效的数字")
                    
            elif query_choice == "2":
                data, msg = manager.query_all_records()
                print(msg)
                if data:
                    for item in data:
                        print(f"编号: {item['id']}, 时间: {item['time']}, 事项: {item['something']}")
                        
            elif query_choice == "3":
                try:
                    urgency_level = int(input("请输入紧急程度 (0-3): ").strip())
                    if 0 <= urgency_level <= 3:
                        data, msg = manager.query_records_by_urgency(urgency_level)
                        print(msg)
                        if data:
                            for item in data:
                                print(f"编号: {item['id']}, 时间: {item['time']}, 事项: {item['something']}")
                    else:
                        print("错误：紧急程度必须在0-3之间")
                except ValueError:
                    print("错误：请输入有效的数字")
                    
            elif query_choice == "4":
                target_date = input("请输入要查询的日期 (格式: YYYY-MM-DD): ").strip()
                data, msg = manager.query_records_by_specific_date(target_date)
                print(msg)
                if data:
                    for item in data:
                        print(f"编号: {item['id']}, 事项: {item['something']}, 紧急程度: {item['urgency']}")
                        
            elif query_choice == "5":
                start_date = input("请输入开始日期 (格式: YYYY-MM-DD): ").strip()
                end_date = input("请输入结束日期 (格式: YYYY-MM-DD): ").strip()
                data, msg = manager.query_records_by_date_range(start_date, end_date)
                print(msg)
                if data:
                    for item in data:
                        print(f"编号: {item['id']}, 时间: {item['time']}, 事项: {item['something']}")
            else:
                print("无效的查询方式选择")
        else:
            print("无效的功能选择，请重新输入")


if __name__ == "__main__":
    test_program()