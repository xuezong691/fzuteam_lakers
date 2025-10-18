import mysql.connector
from mysql.connector import Error

# 数据库连接配置 - 请根据你的实际情况修改
DB_CONFIG = {
    'host': 'localhost',
    'database': 'event_tracking',
    'user': 'root',
    'password': '123456',  # 替换为你的数据库密码
    'port': '3306'
}


def query_record_by_id(record_id):
    """根据编号查询数据库中的记录"""
    connection = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**DB_CONFIG)

        if connection.is_connected():
            cursor = connection.cursor()

            # 查询指定编号的记录
            query = "SELECT id, time, place, staff, something, urgency FROM events WHERE id = %s"
            cursor.execute(query, (record_id,))
            record = cursor.fetchone()

            if not record:
                print(f"错误：编号为 {record_id} 的记录不存在")
                return None

            # 格式化输出查询结果
            print(f"查询结果 - 编号: {record[0]}")
            print(f"时间: {record[1]}")
            print(f"地点: {record[2]}")
            print(f"人员: {record[3]}")
            print(f"事项: {record[4]}")
            print(f"紧急程度: {record[5]}")
            
            # 返回记录数据
            record_data = {
                'id': record[0],
                'time': record[1],
                'place': record[2],
                'staff': record[3],
                'something': record[4],
                'urgency': record[5]
            }
            
            return record_data

    except Error as e:
        print(f"数据库操作错误: {e}")
        return None
    finally:
        # 关闭数据库连接
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


def query_all_records():
    """查询所有记录"""
    connection = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**DB_CONFIG)

        if connection.is_connected():
            cursor = connection.cursor()

            # 查询所有记录
            query = "SELECT id, time, place, staff, something, urgency FROM events ORDER BY urgency DESC, id ASC"
            cursor.execute(query)
            records = cursor.fetchall()

            if not records:
                print("数据库中没有记录")
                return []

            print(f"共查询到 {len(records)} 条记录:")
            print("-" * 80)
            
            all_records = []
            for record in records:
                print(f"编号: {record[0]} | 时间: {record[1]} | 地点: {record[2]} | "
                      f"人员: {record[3]} | 事项: {record[4]} | 紧急程度: {record[5]}")
                
                record_data = {
                    'id': record[0],
                    'time': record[1],
                    'place': record[2],
                    'staff': record[3],
                    'something': record[4],
                    'urgency': record[5]
                }
                all_records.append(record_data)
            
            print("-" * 80)
            return all_records

    except Error as e:
        print(f"数据库操作错误: {e}")
        return []
    finally:
        # 关闭数据库连接
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


def query_records_by_urgency(urgency_level):
    """根据紧急程度查询记录"""
    connection = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**DB_CONFIG)

        if connection.is_connected():
            cursor = connection.cursor()

            # 查询指定紧急程度的记录
            query = "SELECT id, time, place, staff, something, urgency FROM events WHERE urgency = %s ORDER BY id ASC"
            cursor.execute(query, (urgency_level,))
            records = cursor.fetchall()

            if not records:
                urgency_labels = ["已完成", "普通", "重要", "紧急"]
                print(f"没有找到紧急程度为 {urgency_level} ({urgency_labels[urgency_level]}) 的记录")
                return []

            urgency_labels = ["已完成", "普通", "重要", "紧急"]
            print(f"紧急程度为 {urgency_level} ({urgency_labels[urgency_level]}) 的记录:")
            print("-" * 80)
            
            filtered_records = []
            for record in records:
                print(f"编号: {record[0]} | 时间: {record[1]} | 地点: {record[2]} | "
                      f"人员: {record[3]} | 事项: {record[4]} | 紧急程度: {record[5]}")
                
                record_data = {
                    'id': record[0],
                    'time': record[1],
                    'place': record[2],
                    'staff': record[3],
                    'something': record[4],
                    'urgency': record[5]
                }
                filtered_records.append(record_data)
            
            print("-" * 80)
            return filtered_records

    except Error as e:
        print(f"数据库操作错误: {e}")
        return []
    finally:
        # 关闭数据库连接
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


def query_records_by_date_range(start_date, end_date):
    """根据日期范围查询记录"""
    connection = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**DB_CONFIG)

        if connection.is_connected():
            cursor = connection.cursor()

            # 查询指定日期范围内的记录
            query = "SELECT id, time, place, staff, something, urgency FROM events WHERE time BETWEEN %s AND %s ORDER BY time ASC, urgency DESC"
            cursor.execute(query, (start_date, end_date))
            records = cursor.fetchall()

            if not records:
                print(f"在 {start_date} 到 {end_date} 期间没有找到记录")
                return []

            print(f"在 {start_date} 到 {end_date} 期间的记录:")
            print("-" * 80)
            
            date_range_records = []
            for record in records:
                print(f"编号: {record[0]} | 时间: {record[1]} | 地点: {record[2]} | "
                      f"人员: {record[3]} | 事项: {record[4]} | 紧急程度: {record[5]}")
                
                record_data = {
                    'id': record[0],
                    'time': record[1],
                    'place': record[2],
                    'staff': record[3],
                    'something': record[4],
                    'urgency': record[5]
                }
                date_range_records.append(record_data)
            
            print("-" * 80)
            return date_range_records

    except Error as e:
        print(f"数据库操作错误: {e}")
        return []
    finally:
        # 关闭数据库连接
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


def query_records_by_specific_date(target_date):
    """根据具体日期查询记录"""
    connection = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**DB_CONFIG)

        if connection.is_connected():
            cursor = connection.cursor()

            # 查询指定日期的记录
            query = "SELECT id, time, place, staff, something, urgency FROM events WHERE time = %s ORDER BY urgency DESC, id ASC"
            cursor.execute(query, (target_date,))
            records = cursor.fetchall()

            if not records:
                print(f"在 {target_date} 没有找到记录")
                return []

            print(f"{target_date} 的记录:")
            print("-" * 80)
            
            specific_date_records = []
            for record in records:
                print(f"编号: {record[0]} | 时间: {record[1]} | 地点: {record[2]} | "
                      f"人员: {record[3]} | 事项: {record[4]} | 紧急程度: {record[5]}")
                
                record_data = {
                    'id': record[0],
                    'time': record[1],
                    'place': record[2],
                    'staff': record[3],
                    'something': record[4],
                    'urgency': record[5]
                }
                specific_date_records.append(record_data)
            
            print("-" * 80)
            return specific_date_records

    except Error as e:
        print(f"数据库操作错误: {e}")
        return []
    finally:
        # 关闭数据库连接
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


if __name__ == "__main__":
    try:
        print("=== 数据库查询功能 ===")
        print("1. 根据编号查询单条记录")
        print("2. 查询所有记录")
        print("3. 根据紧急程度查询记录")
        print("4. 根据具体日期查询记录")
        print("5. 根据日期范围查询记录")
        
        choice = input("请选择查询方式 (1-5): ").strip()
        
        if choice == "1":
            record_id = int(input("请输入要查询的记录编号: "))
            result = query_record_by_id(record_id)
            if result:
                print(f"\n查询成功！记录数据: {result}")
            
        elif choice == "2":
            result = query_all_records()
            if result:
                print(f"\n查询成功！共 {len(result)} 条记录")
            
        elif choice == "3":
            print("紧急程度说明: 0=已完成, 1=普通, 2=重要, 3=紧急")
            urgency_level = int(input("请输入紧急程度 (0-3): "))
            if 0 <= urgency_level <= 3:
                result = query_records_by_urgency(urgency_level)
                if result:
                    print(f"\n查询成功！共 {len(result)} 条记录")
            else:
                print("错误：紧急程度必须在 0-3 之间")
                
        elif choice == "4":
            target_date = input("请输入要查询的日期 (格式: YYYY-MM-DD): ").strip()
            if target_date:
                result = query_records_by_specific_date(target_date)
                if result:
                    print(f"\n查询成功！共 {len(result)} 条记录")
            else:
                print("错误：请输入有效的日期")
                
        elif choice == "5":
            start_date = input("请输入开始日期 (格式: YYYY-MM-DD): ").strip()
            end_date = input("请输入结束日期 (格式: YYYY-MM-DD): ").strip()
            if start_date and end_date:
                result = query_records_by_date_range(start_date, end_date)
                if result:
                    print(f"\n查询成功！共 {len(result)} 条记录")
            else:
                print("错误：请输入有效的日期范围")
                
        else:
            print("无效的选择，请输入 1-5 之间的数字")
            
    except ValueError:
        print("错误：请输入有效的数字")
    except Exception as e:
        print(f"发生错误: {e}")
