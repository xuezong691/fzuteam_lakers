from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import mysql.connector
import json
import my_dify_api
# call_for_task_generate("生成分解后的任务json列表", "我们小组有6个人，要求是对马原第三章进行扩展ppt汇报")
# call_for_greeting_summarize("总结","./test_file/video.mp3")
# call_for_greeting_translate("总结","./test_file/video.mp3")
message_counter = 0
app = Flask(__name__)
CORS(app)

# 数据库配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456'
}

def get_db_connection(database_name):
    """统一的数据库连接函数"""
    try:
        return mysql.connector.connect(**db_config, database=database_name)
    except mysql.connector.Error as e:
        print(f"数据库连接错误: {e}")
        return None

def standard_response(success, data=None, message=None):
    """统一响应格式"""
    response = {'success': success}
    if data:
        response.update(data)
    if message:
        response['message'] = message

    return jsonify(response)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/page')
def page():
    return render_template('page.html')

# ==================== 用户认证模块 ====================
@app.route('/api/auth/<action>', methods=['POST'])
def auth(action):             #登录注册验证
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if action == 'register':
            teamname = data.get('teamname')
            # 验证账号密码格式
            if not (len(username) == 8 and username.isalnum() and len(password) == 8 and password.isalnum()):
                return standard_response(False, message='账号密码格式错误')
            
            conn = get_db_connection('my_database')
            if not conn:
                return standard_response(False, message='数据库连接失败')
                
            cursor = conn.cursor()
            # 检查用户是否存在
            cursor.execute("SELECT * FROM user WHERE username = %s", (username,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return standard_response(False, message='用户已存在')
            
            # 创建新用户
            cursor.execute("INSERT INTO user (username, password, teamname) VALUES (%s, %s, %s)", 
                         (username, password, teamname))
            conn.commit()
            
            # 获取用户ID
            cursor.execute("SELECT id FROM user WHERE username = %s", (username,))
            user_id = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            
            return standard_response(True, {'userid': user_id, 'teamname': teamname})
        
        elif action == 'login':
            conn = get_db_connection('my_database')
            if not (len(username) == 8 and username.isalnum() and len(password) == 8 and password.isalnum()):
                return standard_response(False, message='账号密码格式错误')

            if not conn:
                return standard_response(False, message='数据库连接失败')
                
            cursor = conn.cursor()
            cursor.execute("SELECT id, teamname FROM user WHERE username = %s AND password = %s", 
                         (username, password))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if result:
                return standard_response(True, {'userid': result[0], 'teamname': result[1]})
            return standard_response(False, message='登录失败')
            
    except Exception as e:
        return standard_response(False, message=f'服务器错误: {str(e)}')

# ==================== 会议处理模块 ====================需要接上my_dify_api
@app.route('/api/meeting/<action>', methods=['POST'])
def meeting(action):
    try:
        if action == 'audio-to-text':
            # TODO: 实现语音转文字逻辑
            return standard_response(True, {'text': '语音转文字结果'})
            
        elif action == 'generate-summary':
            # TODO: 实现会议纪要生成逻辑
            return standard_response(True, {'summary': '会议纪要内容'})
            
        else:
            return standard_response(False, message='未知的操作类型')
            
    except Exception as e:
        return standard_response(False, message=f'会议处理错误: {str(e)}')

# ==================== 任务管理模块 ====================还需要一个函数上传数据库的任务信息给前端
def get_user_id_from_json(data):
    """
    从前端 JSON 里兼容读取 user_id：
    优先 user_id，没有的话再看 userid。
    """
    return data.get('user_id') or data.get('userid')


# 1. 刷新：根据 user_id 查询该用户所有任务
@app.route('/api/task/refresh', methods=['POST'])
def refresh_task():
    try:
        data = request.json or {}

        user_id = get_user_id_from_json(data)
        if not user_id:
            return standard_response(False, message='缺少必要字段: user_id')

        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, time, place, staff, something, urgency, user_id
            FROM task
            WHERE user_id = %s
            ORDER BY time DESC, id DESC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        tasks = []
        for row in rows:
            task = {
                'id': row[0],
                'time': row[1].isoformat() if hasattr(row[1], 'isoformat') else row[1],
                'place': row[2],
                'staff': row[3],
                'something': row[4],
                'urgency': row[5],
                'user_id': row[6],
            }
            tasks.append(task)

        return standard_response(True, data={'tasks': tasks})

    except Exception as e:
        return standard_response(False, message=f'任务刷新错误: {str(e)}')


# 2. 增添：新增一条任务记录
@app.route('/api/task/add', methods=['POST'])
def add_task():
    try:
        data = request.json or {}

        user_id = get_user_id_from_json(data)
        if not user_id:
            return standard_response(False, message='缺少必要字段: user_id')

        # 其他必要字段
        required_fields = ['time', 'place', 'staff', 'something']
        for field in required_fields:
            if field not in data:
                return standard_response(False, message=f'缺少必要字段: {field}')

        urgency = data.get('urgency', 1)

        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO task (time, place, staff, something, urgency, user_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                data['time'],
                data['place'],
                data['staff'],
                data['something'],
                urgency,
                user_id
            )
        )
        conn.commit()

        # 不同驱动名字可能略有差别，这里按常见写法
        new_id = getattr(cursor, 'lastrowid', None)

        cursor.close()
        conn.close()

        return standard_response(True, data={'id': new_id})

    except Exception as e:
        return standard_response(False, message=f'任务新增错误: {str(e)}')


# 3. 删除：根据 id 删除一条任务记录
@app.route('/api/task/delete', methods=['DELETE'])
def delete_task():
    try:
        data = request.json or {}
        if 'id' not in data:
            return standard_response(False, message='缺少必要字段: id')

        task_id = data['id']

        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM task WHERE id = %s",
            (task_id,)
        )
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()

        if affected == 0:
            return standard_response(False, message='未找到需要删除的任务')

        return standard_response(True, data={})  # 或者省略 data 参数

    except Exception as e:
        return standard_response(False, message=f'任务删除错误: {str(e)}')

# ==================== 团队管理模块 ====================还需要一个函数上传数据库的成员信息给前端
@app.route('/api/member/list', methods=['POST'])
def list_members():
    try:
        data = request.json or {}
        user_id = get_user_id_from_json(data)
        if not user_id:
            return standard_response(False, message='缺少必要字段: user_id')

        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, name, tech_stack, quality_score, workload_score,
                   collaboration_score, completion_score, user_id
            FROM member
            WHERE user_id = %s
            ORDER BY id ASC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        members = []
        for row in rows:
            tech_stack = row[2]
            # 确保 JSON 字段安全解析（若为字符串则加载，否则保持原样）
            if isinstance(tech_stack, str):
                try:
                    tech_stack = json.loads(tech_stack)
                except (TypeError, ValueError):
                    tech_stack = []

            member = {
                'id': row[0],
                'name': row[1],
                'tech_stack': tech_stack or [],
                'quality_score': float(row[3]) if row[3] is not None else 0.0,
                'workload_score': float(row[4]) if row[4] is not None else 0.0,
                'collaboration_score': float(row[5]) if row[5] is not None else 0.0,
                'completion_score': float(row[6]) if row[6] is not None else 0.0,
                'user_id': row[7],
            }
            members.append(member)

        return standard_response(True, data={'members': members})

    except Exception as e:
        return standard_response(False, message=f'获取成员列表失败: {str(e)}')


@app.route('/api/member/add', methods=['POST'])
def add_member():
    try:
        data = request.json or {}
        user_id = get_user_id_from_json(data)
        if not user_id:
            return standard_response(False, message='缺少必要字段: user_id')

        name = data.get('name')
        if not name:
            return standard_response(False, message='姓名不能为空')

        tech_stack = data.get('tech_stack', [])
        # 确保 tech_stack 是 list，避免 SQL 注入风险
        if not isinstance(tech_stack, list):
            tech_stack = []

        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO member (name, tech_stack, user_id)
            VALUES (%s, %s, %s)
            """,
            (name, json.dumps(tech_stack, ensure_ascii=False), user_id)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()

        return standard_response(True, data={'id': new_id}, message='成员添加成功')

    except Exception as e:
        return standard_response(False, message=f'添加成员失败: {str(e)}')


@app.route('/api/member/update', methods=['POST'])
def update_member():
    try:
        data = request.json or {}
        user_id = get_user_id_from_json(data)
        if not user_id:
            return standard_response(False, message='缺少必要字段: user_id')

        member_id = data.get('id')
        if not member_id:
            return standard_response(False, message='缺少成员 ID')

        name = data.get('name')
        if not name:
            return standard_response(False, message='姓名不能为空')

        tech_stack = data.get('tech_stack', [])
        if not isinstance(tech_stack, list):
            tech_stack = []

        # 新增：获取并验证四个评分属性
        quality_score = data.get('quality_score', 0.0)
        workload_score = data.get('workload_score', 0.0)
        collaboration_score = data.get('collaboration_score', 0.0)
        completion_score = data.get('completion_score', 0.0)

        # 验证评分是否为数字类型
        try:
            quality_score = float(quality_score)
            workload_score = float(workload_score)
            collaboration_score = float(collaboration_score)
            completion_score = float(completion_score)
        except (TypeError, ValueError):
            return standard_response(False, message='评分必须是数字类型')

        # 验证评分范围 (0-100)
        score_validations = [
            ('质量评分', quality_score),
            ('工作量评分', workload_score),
            ('协作评分', collaboration_score),
            ('完成度评分', completion_score)
        ]

        for score_name, score_value in score_validations:
            if not (0 <= score_value <= 100):
                return standard_response(False, message=f'{score_name}必须在0-100范围内')

        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor()
        # 验证该成员是否属于当前 user_id（防止越权修改）
        cursor.execute(
            "SELECT id FROM member WHERE id = %s AND user_id = %s",
            (member_id, user_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return standard_response(False, message='无权修改此成员或成员不存在')

        # 修改：更新SQL语句，包含四个评分字段
        cursor.execute(
            """
            UPDATE member
            SET name = %s, tech_stack = %s,
                quality_score = %s, workload_score = %s,
                collaboration_score = %s, completion_score = %s
            WHERE id = %s AND user_id = %s
            """,
            (name, json.dumps(tech_stack, ensure_ascii=False),
             quality_score, workload_score, collaboration_score, completion_score,
             member_id, user_id)
        )
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()

        if affected == 0:
            return standard_response(False, message='未更新任何记录')
        else:
            return standard_response(True, message='成员信息更新成功')

    except Exception as e:
        return standard_response(False, message=f'更新成员失败: {str(e)}')

@app.route('/api/member/delete', methods=['POST'])
def delete_member():
    try:
        data = request.json or {}
        user_id = get_user_id_from_json(data)
        if not user_id:
            return standard_response(False, message='缺少必要字段: user_id')

        member_id = data.get('id')
        if not member_id:
            return standard_response(False, message='缺少成员 ID')

        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor()
        # 检查是否存在且归属正确
        cursor.execute(
            "SELECT id FROM member WHERE id = %s AND user_id = %s",
            (member_id, user_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return standard_response(False, message='无权删除此成员或成员不存在')

        cursor.execute(
            "DELETE FROM member WHERE id = %s AND user_id = %s",
            (member_id, user_id)
        )
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        conn.close()

        if affected == 0:
            return standard_response(False, message='删除失败')
        else:
            return standard_response(True, message='成员删除成功')

    except Exception as e:
        return standard_response(False, message=f'删除成员失败: {str(e)}')

# ==================== AI功能模块 ====================需要接上my_dify_api
@app.route('/api/ai/<action>', methods=['POST'])
def ai_functions(action):
    global message_counter
    try:
        if action == 'chat':
            data = request.json or {}

            query = data.get('query', '')
            paragraph = data.get('paragraph', '')

            if not query:
                return standard_response(False, message='消息内容不能为空')

            message_counter += 1

            if message_counter == 1:
                # 第一条消息返回测试文本
                response_text = "这是后端返回的测试消息！如果你能看到这条消息，说明前后端通信正常。"
            else:
                # 后续消息不返回内容
                response_text = my_dify_api.call_for_chat("快速回答",paragraph)

            return standard_response(True, {'response': response_text})

        elif action == 'generate-tasks':
            # TODO: 实现任务生成逻辑
            return standard_response(True, {'tasks': [{'name': '任务1'}]})

        elif action == 'match-tasks':
            # TODO: 实现任务匹配逻辑
            return standard_response(True, {'matched_tasks': [{'task': {}, 'member': {}}]})

        else:
            return standard_response(False, message='未知的AI操作类型')

    except Exception as e:
        return standard_response(False, message=f'AI功能错误: {str(e)}')

# ==================== 错误处理 ====================
@app.errorhandler(404)
def not_found(error):
    return standard_response(False, message='接口不存在'), 404

@app.errorhandler(500)
def internal_error(error):
    return standard_response(False, message='服务器内部错误'), 500

@app.errorhandler(400)
def bad_request(error):
    return standard_response(False, message='请求参数错误'), 400

# ==================== 健康检查 ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    return standard_response(True, {'status': '服务运行正常'})

if __name__ == '__main__':
    app.run(debug=False, port=5000,threaded=True)
    # print(my_dify_api.call_for_task_generate("生成分解后的任务json列表", "我们小组有6个人，要求是对马原第三章进行扩展ppt汇报"))