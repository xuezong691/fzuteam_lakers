import mysql.connector
from mysql.connector import Error


def delete_record_by_id(record_id, resequence=False):
    """根据编号删除数据库中的记录，可选是否重新编号"""
    # 数据库连接配置 - 请根据你的实际情况修改
    config = {
        'host': 'localhost',
        'database': 'event_tracking',
        'user': 'root',
        'password': '123456',  # 替换为你的数据库密码
        'port': '3306'
    }

    connection = None
    try:
        # 建立数据库连接
        connection = mysql.connector.connect(**config)

        if connection.is_connected():
            cursor = connection.cursor()

            # 先检查记录是否存在
            check_query = "SELECT id, person_name FROM events WHERE id = %s"
            cursor.execute(check_query, (record_id,))
            record = cursor.fetchone()

            if not record:
                print(f"错误：编号为 {record_id} 的记录不存在")
                return False

            # 确认删除
            confirm = input(f"确定要删除编号为 {record_id}（{record[1]}）的记录吗？(y/n): ")
            if confirm.lower() != 'y':
                print("删除操作已取消")
                return False

            # 执行删除操作
            delete_query = "DELETE FROM events WHERE id = %s"
            cursor.execute(delete_query, (record_id,))
            connection.commit()

            if cursor.rowcount <= 0:
                print(f"删除编号为 {record_id} 的记录失败")
                return False

            print(f"成功删除编号为 {record_id} 的记录")

            # 如果需要重新编号
            if resequence:
                print("正在重新排列编号...")

                # 步骤1: 取消自增属性
                cursor.execute("ALTER TABLE events MODIFY COLUMN id INT NOT NULL")

                # 步骤2: 重新编号
                cursor.execute("SET @new_id = 0")
                cursor.execute("UPDATE events SET id = (@new_id := @new_id + 1) ORDER BY id")

                # 步骤3: 恢复自增属性并设置自增起始值
                cursor.execute("SELECT MAX(id) FROM events")
                max_id = cursor.fetchone()[0] or 0
                cursor.execute(
                    f"ALTER TABLE events MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = {max_id + 1}")

                connection.commit()
                print("编号已重新按顺序排列")

            return True

    except Error as e:
        print(f"数据库操作错误: {e}")
        return False
    finally:
        # 关闭数据库连接
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


if __name__ == "__main__":
    try:
        # 获取用户输入的编号
        record_id = int(input("请输入要删除的记录编号: "))

        # 询问是否需要重新编号
        resequence_choice = input("删除后是否需要重新排列编号？(y/n，默认n): ")
        resequence = resequence_choice.lower() == 'y'

        # 调用删除函数
        delete_record_by_id(record_id, resequence)
    except ValueError:
        print("错误：请输入有效的数字编号")
    except Exception as e:
        print(f"发生错误: {e}")

