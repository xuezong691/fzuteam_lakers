from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

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

# ==================== 用户认证模块 ====================
@app.route('/api/auth/<action>', methods=['POST'])
def auth(action):
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if action == 'register':
            teamname = data.get('teamname')
            # 验证账号密码格式
            if not (len(username) == 8 and username.isalnum() and len(password) == 8 and password.isalnum()):
                return standard_response(False, message='账号密码格式错误')
            
            conn = get_db_connection('user_database')
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
            conn = get_db_connection('user_database')
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

# ==================== 会议处理模块 ====================
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
@app.route('/api/task/update', methods=['PUT'])
def update_task():
    try:
        data = request.json
        required_fields = ['userid', 'id', 'time', 'place', 'staff', 'something', 'urgency']
        
        # 验证必要字段
        for field in required_fields:
            if field not in data:
                return standard_response(False, message=f'缺少必要字段: {field}')
        
        conn = get_db_connection('task_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')
            
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE task_%s SET time=%s, place=%s, staff=%s, something=%s, urgency=%s WHERE id=%s",
            (data['userid'], data['time'], data['place'], data['staff'], 
             data['something'], data['urgency'], data['id'])
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return standard_response(True)
        
    except Exception as e:
        return standard_response(False, message=f'任务更新错误: {str(e)}')

# ==================== 团队管理模块 ====================
@app.route('/api/member/<action>', methods=['POST', 'DELETE'])
def member_manage(action):
    try:
        data = request.json
        userid = data.get('userid')
        
        if not userid:
            return standard_response(False, message='缺少用户ID')
        
        conn = get_db_connection('member_database')
        if not conn:
            return standard_response(False, message='数据库连接失败')
            
        cursor = conn.cursor()
        
        if request.method == 'POST' and action == 'add':
            name = data.get('name')
            if not name:
                return standard_response(False, message='缺少成员姓名')
                
            cursor.execute(
                "INSERT INTO member_%s (name, tech_stack) VALUES (%s, %s)", 
                (userid, name, '[]')
            )
            
        elif request.method == 'DELETE' and action == 'delete':
            member_id = data.get('member_id')
            if not member_id:
                return standard_response(False, message='缺少成员ID')
                
            cursor.execute(
                "DELETE FROM member_%s WHERE id = %s", 
                (userid, member_id)
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

# ==================== AI功能模块 ====================
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