import mysql.connector
from mysql.connector import Error


def delete_record_by_id(record_id, resequence=False):
    """根据编号删除manager数据库中things表的记录，可选是否重新编号"""
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

            # 1. 检查记录是否存在（适配things表：表名events→things，字段id→num，person_name→staff）
            check_query = "SELECT num, staff FROM things WHERE num = %s"
            cursor.execute(check_query, (record_id,))
            record = cursor.fetchone()  # 返回结果：(num, staff)

            if not record:
                print(f"错误：编号为 {record_id} 的记录不存在")
                return False

            # 2. 确认删除（显示编号和负责人信息，record[1]对应staff字段）
            confirm = input(f"确定要删除编号为 {record_id}（负责人：{record[1]}）的记录吗？(y/n): ")
            if confirm.lower() != 'y':
                print("删除操作已取消")
                return False

            # 3. 执行删除操作（表名events→things，字段id→num）
            delete_query = "DELETE FROM things WHERE num = %s"
            cursor.execute(delete_query, (record_id,))
            connection.commit()

            if cursor.rowcount <= 0:
                print(f"删除编号为 {record_id} 的记录失败")
                return False

            print(f"成功删除编号为 {record_id} 的记录")

            # 4. 重新编号（若需要，适配things表和num字段）
            if resequence:
                print("正在重新排列编号...")

                # 步骤1: 取消num的自增属性
                cursor.execute("ALTER TABLE things MODIFY COLUMN num INT NOT NULL")

                # 步骤2: 重新编号num（按现有顺序从1开始递增）
                cursor.execute("SET @new_num = 0")
                cursor.execute("UPDATE things SET num = (@new_num := @new_num + 1) ORDER BY num")

                # 步骤3: 恢复自增属性并设置起始值
                cursor.execute("SELECT MAX(num) FROM things")
                max_num = cursor.fetchone()[0] or 0  # 若表为空，默认0
                cursor.execute(
                    f"ALTER TABLE things MODIFY COLUMN num INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = {max_num + 1}"
                )

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
        # 获取用户输入的编号（对应things表的num字段）
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