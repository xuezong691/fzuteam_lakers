from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import mysql.connector
import my_dify_api
# call_for_task_generate("生成分解后的任务json列表", "我们小组有6个人，要求是对马原第三章进行扩展ppt汇报")
# call_for_greeting_summarize("总结","./test_file/video.mp3")
# call_for_greeting_translate("总结","./test_file/video.mp3")

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

# ==================== 任务管理模块 ====================
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

# ==================== 团队管理模块 ====================
@app.route('/api/member/<action>', methods=['POST', 'DELETE'])
def member_manage(action):
    try:
        data = request.json
        userid = data.get('userid')
        
        if not userid:
            return standard_response(False, message='缺少用户ID')
        
        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')
            
        cursor = conn.cursor()
        
        if request.method == 'POST' and action == 'add':
            name = data.get('name')
            if not name:
                return standard_response(False, message='缺少成员姓名')
                
            cursor.execute(
                "INSERT INTO member (name, tech_stack) VALUES (%s, %s)",
                ( name, '[]')
            )
            
        elif request.method == 'DELETE' and action == 'delete':
            member_id = data.get('member_id')
            if not member_id:
                return standard_response(False, message='缺少成员ID')
                
            cursor.execute(
                "DELETE FROM member WHERE id = %s",
                (member_id)
            )
        else:
            cursor.close()
            conn.close()
            return standard_response(False, message='不支持的操作')
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return standard_response(True)
        
    except Exception as e:
        return standard_response(False, message=f'团队管理错误: {str(e)}')

@app.route('/api/member/refresh', methods=['GET'])
def member_refresh():
    try:
        # 获取请求参数（GET 方法从 args 取值，若前端习惯用 JSON 可改为 request.json）
        user_id = request.args.get('user_id')
        
        # 校验必填参数
        if not user_id:
            return standard_response(False, message='缺少用户ID')
        
        # 数据库连接逻辑（遵循规定的交互逻辑）
        conn = get_db_connection('my_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')

        cursor = conn.cursor(dictionary=True)  # 以字典形式返回结果，方便前端处理
        cursor.execute(
            """
            SELECT id, name, tech_stack 
            FROM member 
            WHERE user_id = %s  -- 假设 member 表有 user_id 字段关联用户
            ORDER BY id DESC  -- 按ID倒序，最新的成员在前
            """,
            (user_id,)  # 元组格式传参，避免 SQL 注入
        )
        
        # 获取所有成员数据
        members = cursor.fetchall()
        
        # 处理 tech_stack 字段（如果存储的是 JSON 字符串，转为 Python 列表）
        for member in members:
            try:
                member['tech_stack'] = json.loads(member['tech_stack']) if member['tech_stack'] else []
            except json.JSONDecodeError:
                member['tech_stack'] = []
        
        # 关闭数据库连接
        cursor.close()
        conn.close()

        # 返回成功响应，携带成员列表数据
        return standard_response(True, data={'members': members})
        
    except Exception as e:
        return standard_response(False, message=f'刷新成员列表错误: {str(e)}')

# ==================== 智能任务匹配模块 ====================

# ==================== AI功能模块 ====================需要接上my_dify_api
@app.route('/api/ai/<action>', methods=['POST'])
def ai_functions(action):
    try:
        if action == 'chat':
            # TODO: 实现AI聊天逻辑
            return standard_response(True, {'response': 'AI回复内容'})
            
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
    app.run(debug=True, port=5000)
    # print(my_dify_api.call_for_task_generate("生成分解后的任务json列表", "我们小组有6个人，要求是对马原第三章进行扩展ppt汇报"))